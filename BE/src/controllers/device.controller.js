const { poolPromise, sql } = require('../db');
const mqttClient = require('../mqtt/mqttHandler'); 

const getDeviceStates = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT DeviceName, DeviceState FROM Devices');
    res.json(result.recordset);
  } catch (err) {
    console.error('SQL Server get device states error:', err);
    res.status(500).send(err.message);
  }
};
const getDeviceHistory = async (req, res) => {
  const { deviceName } = req.params;
  const { page = 1, limit = 10, state, search } = req.query; 

  const offset = (page - 1) * limit;
  try {
    const pool = await poolPromise;
    let whereClauses = ['d.DeviceName = @DeviceName'];
    const request = pool.request().input('DeviceName', sql.NVarChar, deviceName);

    if (state) {
      whereClauses.push('al.Action = @State');
      request.input('State', sql.NVarChar, state);
    }
    if (search) {
      whereClauses.push(`(
        d.DeviceName LIKE @SearchTerm OR 
        al.Action LIKE @SearchTerm OR 
        FORMAT(DATEADD(hour, 7, al.Timestamp), 'dd/MM/yyyy HH:mm:ss') LIKE @SearchTerm
      )`);
      request.input('SearchTerm', sql.NVarChar, `%${search}%`);
    }
    const whereCondition = `WHERE ${whereClauses.join(' AND ')}`;

    // --- Query 1: Lấy tổng số bản ghi để tính toán số trang ---
    const countResult = await request.query(`
        SELECT COUNT(*) as total
        FROM ActionLogs al
        JOIN Devices d ON al.DeviceID = d.DeviceID
        ${whereCondition}
    `);
    const totalRecords = countResult.recordset[0].total;
    const totalPages = Math.ceil(totalRecords / limit);

    // --- Query 2: Lấy dữ liệu đã được phân trang ---
    const dataResult = await request.query(`
        SELECT 
          al.LogID AS HistoryID,
          d.DeviceName,
          al.Action AS State,
          FORMAT(DATEADD(hour, 7, al.Timestamp), 'yyyy-MM-dd HH:mm:ss') AS Timestamp
        FROM ActionLogs al
        JOIN Devices d ON al.DeviceID = d.DeviceID
        ${whereCondition}
        ORDER BY al.Timestamp DESC
        OFFSET ${offset} ROWS 
        FETCH NEXT ${parseInt(limit, 10)} ROWS ONLY
      `);

    res.json({
      totalPages: totalPages,
      data: dataResult.recordset,
    });
  } catch (err) {
    console.error(`SQL Server get history for ${deviceName} error:`, err);
    res.status(500).send(err.message);
  }
};

const getAllDeviceHistory = async (req, res) => {
  const { page = 1, limit = 10, state, search } = req.query;
  const offset = (page - 1) * limit;

  try {
    const pool = await poolPromise;
    const request = pool.request();
    let whereClauses = [];

    if (state) {
      whereClauses.push('al.Action = @State');
      request.input('State', sql.NVarChar, state);
    }
    if (search) {
      whereClauses.push(`(d.DeviceName LIKE @SearchTerm OR al.Action LIKE @SearchTerm OR FORMAT(DATEADD(hour, 7, al.Timestamp), 'dd/MM/yyyy HH:mm:ss') LIKE @SearchTerm)`);
      request.input('SearchTerm', sql.NVarChar, `%${search}%`);
    }

    const whereCondition = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

   
    const countResult = await request.query(`SELECT COUNT(*) as total FROM ActionLogs al JOIN Devices d ON al.DeviceID = d.DeviceID ${whereCondition}`);
    const totalRecords = countResult.recordset[0].total;
    const totalPages = Math.ceil(totalRecords / limit);

   
    const dataResult = await request.query(`
      SELECT 
        d.DeviceName,
        al.LogID AS HistoryID,
        al.Action AS State, 
        FORMAT(DATEADD(hour, 7, al.Timestamp), 'yyyy-MM-dd HH:mm:ss') AS Timestamp
      FROM ActionLogs al
      JOIN Devices d ON al.DeviceID = d.DeviceID
      ${whereCondition}
      ORDER BY al.Timestamp DESC
      OFFSET ${offset} ROWS
      FETCH NEXT ${parseInt(limit, 10)} ROWS ONLY
    `);

    res.json({
      totalPages: totalPages,
      data: dataResult.recordset,
    });
  } catch (err) {
    console.error(`SQL Server get all device history error:`, err);
    res.status(500).send(err.message);
  }
};

const toggleDeviceState = async (req, res) => {
  const { device, state } = req.body;


  const deviceNameMapping = {
    'light': 'Light',
    'ac': 'Air Conditioner',
    'fan': 'Fan'
  };
  const dbDeviceName = deviceNameMapping[device];

  if (!dbDeviceName) {
    return res.status(400).send('Invalid device name.');
  }

  try {
    const pool = await poolPromise;
    const transaction = new sql.Transaction(pool);
    await transaction.begin();
    const request = new sql.Request(transaction);

    
    request
      .input('DeviceName', sql.NVarChar, dbDeviceName)
      .input('DeviceState', sql.Bit, state) 
      .input('ActionString', sql.NVarChar, state ? 'ON' : 'OFF'); 
   
    await request.query(`INSERT INTO ActionLogs (DeviceID, Action) SELECT DeviceID, @ActionString FROM Devices WHERE DeviceName = @DeviceName;`);

    await transaction.commit();

    const controlTopic = process.env.MQTT_CONTROL_TOPIC || 'esp/control';
    let deviceId;
    if (device === 'light') {
      deviceId = 1;
    } else if (device === 'ac') {
      deviceId = 2;
    } else if (device === 'fan') {
      deviceId = 3;
    }

    if (deviceId) {
      const command = `LED${deviceId} ${state ? 'ON' : 'OFF'}`;
      mqttClient.publish(controlTopic, command, (err) => {
        if (err) console.error('MQTT publish error:', err);
        else console.log(`Published to MQTT: ${command}`);
      });
    }

    res.status(200).send({ message: `${dbDeviceName} state updated to ${state}` });
  } catch (err) {
    console.error(`SQL Server toggle state for ${dbDeviceName} error:`, err);
    res.status(500).send(err.message);
  }
};

module.exports = {
  getDeviceStates,
  getDeviceHistory,
  getAllDeviceHistory,
  toggleDeviceState,
};