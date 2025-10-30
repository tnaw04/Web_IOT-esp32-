
const { poolPromise, sql } = require('../db');


let sensorMapping = {};


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
        process.exit(1); 
    }
};

const createSensorData = async (data) => {
    try {
        const pool = await poolPromise;
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            
            for (const key in data) {
                if (sensorMapping[key]) {
                    const sensor_id = sensorMapping[key];
                    const value = data[key];

                    const request = new sql.Request(transaction);
                    await request
                        .input('sensor_id', sql.Int, sensor_id)
                        .input('value', sql.Real, value)
                      
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
            throw err; 
        }

    } catch (err) {
        console.error('SQL Server insert error:', err);
    }
};

const getSensorData = async (req, res) => {
  
    const {
        page = 1,
        limit = 1000, 
        sortKey = 'Timestamp',
        sortOrder = 'desc',
        startDate,
        endDate,
        search,
        filterCategory = 'all'
    } = req.query;

    
    const allowedSortKeys = ['Timestamp', 'temperature', 'humidity', 'luminosity'];
    const safeSortKey = allowedSortKeys.includes(sortKey) ? sortKey : 'Timestamp';
    const safeSortOrder = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';


    const offset = (page - 1) * limit;

    try {
        const pool = await poolPromise;
        const request = pool.request();

        let whereClauses = [];
   
        if (startDate) {
            whereClauses.push(`recorded_at >= @startDate`);
            request.input('startDate', sql.Date, startDate);
        }
        if (endDate) {
         
            let inclusiveEndDate = new Date(endDate);
            inclusiveEndDate.setDate(inclusiveEndDate.getDate() + 1);
            whereClauses.push(`recorded_at < @endDate`);
            request.input('endDate', sql.Date, inclusiveEndDate);
        }

        let whereCondition = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

        
        let postPivotWhere = '';
        if (search) {
            postPivotWhere = `
                WHERE 1=1 AND (${
                    (() => {
                        const searchConditions = [];
                        if (filterCategory === 'all' || filterCategory === 'temperature') {
                            searchConditions.push(`FORMAT(temperature, 'F2') LIKE @searchTerm`);
                        }
                        if (filterCategory === 'all' || filterCategory === 'humidity') {
                            searchConditions.push(`FORMAT(humidity, 'F2') LIKE @searchTerm`);
                        }
                        if (filterCategory === 'all' || filterCategory === 'luminosity') {
                            searchConditions.push(`FORMAT(luminosity, 'F2') LIKE @searchTerm`);
                        }
                        if (filterCategory === 'all') {
                            searchConditions.push(`FORMAT(CAST(Timestamp AS DATETIME2(0)), 'dd/MM/yyyy HH:mm:ss') LIKE @searchTerm`);
                        }
                        return searchConditions.join(' OR ');
                    })()
                })
            `
            request.input('searchTerm', sql.NVarChar, `%${search}%`);
        }

      
        const pivotQuery = `
            WITH PivotedData AS (
                SELECT
                    -- Biểu thức trong SELECT và GROUP BY cho cột timestamp phải nhất quán.
                    FORMAT(DATEADD(hour, 7, CAST(sd.recorded_at AS DATETIME2(0))), 'yyyy-MM-dd HH:mm:ss') AS Timestamp,
                    ISNULL(MAX(CASE WHEN s.type = 'temperature' THEN sd.value END), 0) AS temperature,
                    ISNULL(MAX(CASE WHEN s.type = 'humidity' THEN sd.value END), 0) AS humidity,
                    CAST(ISNULL(MAX(CASE WHEN s.type = 'luminosity' THEN sd.value END), 0) AS DECIMAL(10, 2)) AS luminosity
                FROM SensorData sd
                JOIN Sensor s ON sd.sensor_id = s.sensor_id
                ${whereCondition}
                GROUP BY CAST(sd.recorded_at AS DATETIME2(0))
            )
        `;

        
        const countRequest = pool.request();
       
        for (const key in request.parameters) {
            countRequest.input(key, request.parameters[key].type, request.parameters[key].value);
        }
        const countResult = await countRequest.query(`${pivotQuery} SELECT COUNT(*) as total FROM PivotedData ${postPivotWhere}`);

        const totalRecords = countResult.recordset[0].total;
        const totalPages = Math.ceil(totalRecords / limit);

       
        const dataQuery = `
            ${pivotQuery}
            SELECT * FROM PivotedData ${postPivotWhere}
            ORDER BY ${safeSortKey} ${safeSortOrder}
            OFFSET ${offset} ROWS
            FETCH NEXT ${parseInt(limit, 10)} ROWS ONLY
        `;

        const dataResult = await request.query(dataQuery);

      
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

        
    
        const query = `
            SELECT TOP 1
                FORMAT(DATEADD(hour, 7, CAST(sd.recorded_at AS DATETIME2(0))), 'HH:mm:ss') AS time,
                CAST(ISNULL(MAX(CASE WHEN s.type = 'temperature' THEN sd.value END), 0) AS DECIMAL(10, 2)) AS temperature,
                CAST(ISNULL(MAX(CASE WHEN s.type = 'humidity' THEN sd.value END), 0) AS DECIMAL(10, 2)) AS humidity,
                CAST(ISNULL(MAX(CASE WHEN s.type = 'luminosity' THEN sd.value END), 0) AS DECIMAL(10, 2)) AS luminosity
            FROM SensorData sd
            JOIN Sensor s ON sd.sensor_id = s.sensor_id
            GROUP BY CAST(sd.recorded_at AS DATETIME2(0))
            ORDER BY CAST(sd.recorded_at AS DATETIME2(0)) DESC;
        `;

        const result = await pool.request().query(query);

        res.json(result.recordset[0] || null); 

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
                    -- Biểu thức trong SELECT và GROUP BY cho cột timestamp phải nhất quán.
                    FORMAT(DATEADD(hour, 7, CAST(sd.recorded_at AS DATETIME2(0))), 'HH:mm:ss') AS time,
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
    loadSensorMapping,
    getLatestSensorData,
    getHistoricalSensorData,
};