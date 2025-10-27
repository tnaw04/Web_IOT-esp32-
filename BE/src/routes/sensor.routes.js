const express = require('express');
const router = express.Router();

// Import hàm xử lý từ controller
const { getSensorData, getLatestSensorData, getHistoricalSensorData } = require('../controllers/sensor.controller');

// Định nghĩa route cho việc lấy dữ liệu cảm biến
// Khi có request GET đến /api/sensors/data, hàm getSensorData sẽ được gọi
router.get('/data', getSensorData);

// Route để lấy 1 bản ghi mới nhất cho polling
router.get('/latest', getLatestSensorData);

// Route để lấy dữ liệu lịch sử ban đầu cho biểu đồ
router.get('/historical', getHistoricalSensorData);

// Xuất router để có thể sử dụng trong file index.js
module.exports = router;
