const express = require('express');
const router = express.Router();


const { getSensorData, getLatestSensorData, getHistoricalSensorData, getAlertCount } = require('../controllers/sensor.controller');

router.get('/data', getSensorData);


router.get('/latest', getLatestSensorData);

router.get('/historical', getHistoricalSensorData);

router.get('/alerts', getAlertCount);

module.exports = router;
