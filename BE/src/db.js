
const sql = require('mssql');
require('dotenv').config();

const config = {
    user: process.env.DB_USER || 'sa',
    password: process.env.DB_PASS || 'Nam562004@',
    server: process.env.DB_SERVER || 'LAPTOP-L0C9IQ6J\\TUANNAM',
    database: process.env.DB_DATABASE || 'IOT_DB', 
    options: { 
        encrypt: false,
        trustServerCertificate: true,
        useUTC: false
    }
};


const poolPromise = new sql.ConnectionPool(config)
    .connect()
    .then(pool => {
        console.log('Kết nối tới SQL Server thành công!');
        return pool;
    })
    .catch(err => console.error('Lỗi kết nối SQL Server:', err));

module.exports = {
    sql,
    poolPromise
};