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


const sensorRoutes = require('./routes/sensor.routes');
const deviceRoutes = require('./routes/device.routes');
const userRoutes = require('./routes/user.routes'); 



app.use(cors());
app.use(express.json());


app.use('/api/sensors', sensorRoutes); 
app.use('/api/devices', deviceRoutes);
app.use('/api', userRoutes); 


main();