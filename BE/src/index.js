require('dotenv').config();

const express = require('express');
const cors = require('cors');

const { loadSensorMapping } = require('./controllers/sensor.controller');

require('./mqtt/mqttHandler'); 

const app = express();
const port = process.env.PORT || 3000;


async function main() {
  
  await loadSensorMapping();

  app.listen(port, () => {
    console.log(`Express server is running on http://localhost:${port}`);
  });
}

// dinh nghia routes
// import file định nghĩa các đường dẫn routes cho ...
const sensorRoutes = require('./routes/sensor.routes');
const deviceRoutes = require('./routes/device.routes'); 
const userRoutes = require('./routes/user.routes'); 



app.use(cors());
app.use(express.json());


app.use('/api/sensors', sensorRoutes); // gán routes dữ liệu cho api/sensor 
app.use('/api/devices', deviceRoutes); // gán routes thiết bị cho api/devices
app.use('/api', userRoutes); // gán routes người dùng 


main();