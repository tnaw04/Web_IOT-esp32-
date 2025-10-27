// src/controllers/sensor.controller.js

const { poolPromise, sql } = require('../db'); // Đi ra một cấp để vào file db.js

// Biến này sẽ giữ mapping được tải từ CSDL
let sensorMapping = {};

// Hàm để tải và khởi tạo sensorMapping từ CSDL
const loadSensorMapping = async () => {
    try {
        const pool = await poolPromise;
        const result = await pool.request().query('SELECT type, sensor_id FROM Sensor');

        const newMapping = {};
        for (const row of result.recordset) {
            newMapping[row.type] = row.sensor_id;
        }

        sensorMapping = newMapping;
        console.log('Sensor mapping loaded successfully:', sensorMapping);
    } catch (err) {
        console.error('FATAL: Failed to load sensor mapping. Shutting down.', err);
        process.exit(1); // Dừng ứng dụng nếu không tải được mapping
    }
};

const createSensorData = async (data) => {
    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            // Lặp qua từng key trong object data (temperature, humidity, ...)
            for (const key in data) {
                if (sensorMapping[key]) {
                    const sensor_id = sensorMapping[key];
                    const value = data[key];

                    const request = new sql.Request(transaction);
                    await request
                        .input('sensor_id', sql.Int, sensor_id)
                        .input('value', sql.Real, value)
                        // Sửa lỗi múi giờ: Ghi lại thời gian là giờ UTC hiện tại + 7 tiếng.
                        .query(`
                            INSERT INTO SensorData (sensor_id, value, recorded_at)
                            VALUES (@sensor_id, @value, DATEADD(hour, 7, GETUTCDATE()))
                        `);
                }
            }
            await transaction.commit();
            console.log('Data inserted successfully into SQL Server');
        } catch (err) {
            await transaction.rollback();
            throw err; // Ném lỗi để khối catch bên ngoài bắt được
        }

    } catch (err) {
        console.error('SQL Server insert error:', err);
    }
};

const getSensorData = async (req, res) => {
    // Lấy các tham số từ query string, với các giá trị mặc định
    const {
        page = 1,
        limit = 1000, // Tăng giới hạn mặc định để lấy nhiều dữ liệu hơn cho client-side filtering
        sortKey = 'Timestamp',
        sortOrder = 'desc',
        startDate,
        endDate,
        search // Thêm tham số tìm kiếm
    } = req.query;

    // --- Biện pháp bảo mật: Whitelisting ---
    // Chỉ cho phép sắp xếp theo các cột đã định sẵn để tránh SQL Injection
    const allowedSortKeys = ['Timestamp', 'temperature', 'humidity', 'luminosity'];
    const safeSortKey = allowedSortKeys.includes(sortKey) ? sortKey : 'Timestamp';
    const safeSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    // -----------------------------------------

    const offset = (page - 1) * limit;

    try {
        const pool = await poolPromise;
        const request = pool.request();

        let whereClauses = [];
        // Chú ý: Tên cột trong CSDL là 'recorded_at'
        if (startDate) {
            whereClauses.push(`recorded_at >= @startDate`);
            request.input('startDate', sql.Date, startDate);
        }
        if (endDate) {
            // Thêm 1 ngày để bao gồm cả ngày kết thúc
            let inclusiveEndDate = new Date(endDate);
            inclusiveEndDate.setDate(inclusiveEndDate.getDate() + 1);
            whereClauses.push(`recorded_at < @endDate`);
            request.input('endDate', sql.Date, inclusiveEndDate);
        }

        let whereCondition = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        // --- Thêm logic tìm kiếm ---
        // Điều kiện tìm kiếm sẽ được áp dụng sau khi PIVOT
        let postPivotWhere = '';
        if (search) {
            postPivotWhere = `
                WHERE CAST(temperature AS VARCHAR(20)) LIKE @searchTerm
                   OR CAST(humidity AS VARCHAR(20)) LIKE @searchTerm
                   OR CAST(luminosity AS VARCHAR(20)) LIKE @searchTerm
                   OR FORMAT(CAST(Timestamp AS DATETIME2(0)), 'dd/MM/yyyy HH:mm:ss') LIKE @searchTerm
            `;
            request.input('searchTerm', sql.NVarChar, `%${search}%`);
        }

        // Câu truy vấn PIVOT để biến đổi dữ liệu
        // Thay thế PIVOT bằng GROUP BY với conditional aggregation (CASE)
        const pivotQuery = `
            WITH PivotedData AS (
                SELECT
                    -- Định dạng thời gian thành chuỗi ngay tại CSDL để tránh các vấn đề về múi giờ
                    FORMAT(CAST(sd.recorded_at AS DATETIME2(0)), 'yyyy-MM-dd HH:mm:ss') AS Timestamp,
                    ISNULL(MAX(CASE WHEN s.type = 'temperature' THEN sd.value END), 0) AS temperature,
                    ISNULL(MAX(CASE WHEN s.type = 'humidity' THEN sd.value END), 0) AS humidity,
                    ISNULL(MAX(CASE WHEN s.type = 'luminosity' THEN sd.value END), 0) AS luminosity
                FROM SensorData sd
                JOIN Sensor s ON sd.sensor_id = s.sensor_id
                ${whereCondition}
                GROUP BY CAST(sd.recorded_at AS DATETIME2(0))
            )
        `;

        // --- Query 1: Lấy tổng số bản ghi (để tính tổng số trang) ---
        // Cần một request riêng vì request cũ đã có input
        const countRequest = pool.request();
        // Sao chép các tham số từ request chính sang countRequest để truy vấn đếm hoạt động chính xác
        for (const key in request.parameters) {
            countRequest.input(key, request.parameters[key].type, request.parameters[key].value);
        }
        const countResult = await countRequest.query(`${pivotQuery} SELECT COUNT(*) as total FROM PivotedData ${postPivotWhere}`);

        const totalRecords = countResult.recordset[0].total;
        const totalPages = Math.ceil(totalRecords / limit);

        // --- Query 2: Lấy dữ liệu cho trang hiện tại ---
        const dataQuery = `
            ${pivotQuery}
            SELECT * FROM PivotedData ${postPivotWhere}
            ORDER BY ${safeSortKey} ${safeSortOrder}
            OFFSET ${offset} ROWS
            FETCH NEXT ${parseInt(limit, 10)} ROWS ONLY
        `;

        const dataResult = await request.query(dataQuery);

        // Trả về dữ liệu theo cấu trúc mà frontend mong đợi
        res.json({
            totalPages: totalPages,
            data: dataResult.recordset
        });

    } catch (err) {
        console.error('SQL Server get data error:', err);
        res.status(500).send(err.message);
    }
};

const getLatestSensorData = async (req, res) => {
    try {
        const pool = await poolPromise;

        // Tối ưu hóa truy vấn để chỉ lấy 1 bản ghi mới nhất
        // và làm tròn giá trị ngay tại CSDL
        const query = `
            SELECT TOP 1
                FORMAT(CAST(sd.recorded_at AS DATETIME2(0)), 'HH:mm:ss') AS time,
                CAST(ISNULL(MAX(CASE WHEN s.type = 'temperature' THEN sd.value END), 0) AS DECIMAL(10, 2)) AS temperature,
                CAST(ISNULL(MAX(CASE WHEN s.type = 'humidity' THEN sd.value END), 0) AS DECIMAL(10, 2)) AS humidity,
                CAST(ISNULL(MAX(CASE WHEN s.type = 'luminosity' THEN sd.value END), 0) AS DECIMAL(10, 2)) AS luminosity
            FROM SensorData sd
            JOIN Sensor s ON sd.sensor_id = s.sensor_id
            GROUP BY CAST(sd.recorded_at AS DATETIME2(0))
            ORDER BY CAST(sd.recorded_at AS DATETIME2(0)) DESC;
        `;

        const result = await pool.request().query(query);

        res.json(result.recordset[0] || null); // Trả về một object hoặc null

    } catch (err) {
        console.error('SQL Server get latest data error:', err);
        res.status(500).send(err.message);
    }
};

const getHistoricalSensorData = async (req, res) => {
    try {
        const pool = await poolPromise;

        const query = `
            SELECT * FROM (
                SELECT TOP 50
                    FORMAT(CAST(sd.recorded_at AS DATETIME2(0)), 'HH:mm:ss') AS time,
                    CAST(ISNULL(MAX(CASE WHEN s.type = 'temperature' THEN sd.value END), 0) AS DECIMAL(10, 2)) AS temperature,
                    CAST(ISNULL(MAX(CASE WHEN s.type = 'humidity' THEN sd.value END), 0) AS DECIMAL(10, 2)) AS humidity,
                    CAST(ISNULL(MAX(CASE WHEN s.type = 'luminosity' THEN sd.value END), 0) AS DECIMAL(10, 2)) AS luminosity
                FROM SensorData sd
                JOIN Sensor s ON sd.sensor_id = s.sensor_id
                GROUP BY CAST(sd.recorded_at AS DATETIME2(0))
                ORDER BY CAST(sd.recorded_at AS DATETIME2(0)) DESC
            ) AS LatestData
            ORDER BY time ASC;
        `;

        const result = await pool.request().query(query);

        res.json(result.recordset);

    } catch (err) {
        console.error('SQL Server get historical data error:', err);
        res.status(500).send(err.message);
    }
};


module.exports = {
    createSensorData,
    getSensorData,
    loadSensorMapping, // Xuất hàm mới
    getLatestSensorData,
    getHistoricalSensorData,
};