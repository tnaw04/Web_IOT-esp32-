require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { loadSensorMapping } = require('./controllers/sensor.controller');
// Chỉ cần require file này là MQTT client sẽ tự động chạy
require('./mqtt/mqttHandler'); // Kích hoạt lại MQTT Handler

const app = express();
const port = process.env.PORT || 3000;

// Hàm main để khởi tạo các thành phần bất đồng bộ
async function main() {
  // Tải sensor mapping từ CSDL trước khi khởi động server
  await loadSensorMapping();

  app.listen(port, () => {
    console.log(`Express server is running on http://localhost:${port}`);
  });
}

// Import các routes
const sensorRoutes = require('./routes/sensor.routes');
const deviceRoutes = require('./routes/device.routes');
const userRoutes = require('./routes/user.routes'); // Thêm route cho user


// Middlewares
app.use(cors());
app.use(express.json());

// Sử dụng routes
// Tất cả các route trong sensorRoutes sẽ có tiền tố /api
// Ví dụ: GET /api/sensordata
app.use('/api/sensors', sensorRoutes); // API cho cảm biến
app.use('/api/devices', deviceRoutes); // API cho thiết bị
app.use('/api', userRoutes); // API cho user (sẽ khớp với /api/profile)

// Chạy hàm main
main();
