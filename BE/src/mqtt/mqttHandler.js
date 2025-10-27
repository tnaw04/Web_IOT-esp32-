// src/mqtt/mqttHandler.js
const mqtt = require('mqtt');
require('dotenv').config();
const { createSensorData } = require('../controllers/sensor.controller');
const { poolPromise, sql } = require('../db'); // Import db pool

const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://test.mosquitto.org';
const sensorTopic = process.env.MQTT_TOPIC_SENSOR || 'esp/sensor';
const statusTopic = 'esp/status/+'; // Wildcard để nhận tất cả các status từ ESP32

console.log(`Attempting to connect to MQTT broker at ${brokerUrl}...`); // DÒNG MỚI

const options = {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    reconnectPeriod: 5000, // Thử kết nối lại sau mỗi 5 giây
};
const client = mqtt.connect(brokerUrl, options);

client.on('connect', () => {
    console.log('Connected to MQTT Broker!');
    // Subscribe các topic cần thiết
    client.subscribe([sensorTopic, statusTopic], (err) => {
        if (!err) {
            console.log(`Subscribed to topics: ${sensorTopic}, ${statusTopic}`);
        } else {
            console.error('Subscription error:', err);
        }
    });
});

client.on('message', (receivedTopic, payload) => {
    try {
        const message = payload.toString();
        console.log(`Message received on topic ${receivedTopic}: ${message}`);

        if (receivedTopic === sensorTopic) {
            // Xử lý dữ liệu cảm biến
            const sensorData = JSON.parse(message);
            createSensorData(sensorData);
        } else if (receivedTopic.startsWith('esp/status/')) {
            // Nhận xác nhận từ ESP32 và cập nhật vào CSDL
            const statusData = JSON.parse(message);
            updateDeviceStateFromMqtt(statusData);
        }
    } catch (err) {
        console.error(`Failed to process message on topic ${receivedTopic}:`, err);
    }
});

/**
 * Cập nhật trạng thái thiết bị trong CSDL dựa trên thông điệp xác nhận từ ESP32.
 * @param {object} statusData - Dữ liệu trạng thái, ví dụ: { relay: 'RELAY1', state: 'OFF' }
 */
async function updateDeviceStateFromMqtt(statusData) {
    const { relay, state } = statusData;
    if (!relay || !state) return;

    // Ánh xạ tên relay từ ESP32 sang tên thiết bị trong DB
    const deviceNameMapping = {
        'RELAY1': 'Light',
        'RELAY2': 'Air Conditioner',
        'RELAY3': 'Fan'
    };
    const dbDeviceName = deviceNameMapping[relay];
    const dbDeviceState = (state === 'ON'); // Chuyển 'ON'/'OFF' thành true/false

    if (!dbDeviceName) return;

    try {
        const pool = await poolPromise;
        await pool.request()
            .input('DeviceName', sql.NVarChar, dbDeviceName)
            .input('DeviceState', sql.Bit, dbDeviceState)
            .query('UPDATE Devices SET DeviceState = @DeviceState WHERE DeviceName = @DeviceName');
        console.log(`[MQTT-DB] Confirmed & Updated: ${dbDeviceName} is now ${state}`);
    } catch (err) {
        console.error(`[MQTT-DB] Failed to update state for ${dbDeviceName}:`, err);
    }
}

client.on('error', (err) => {
    console.error('MQTT Connection Error:', err); // THÊM LOG LỖI
});

client.on('reconnect', () => {
    console.log('Reconnecting to MQTT Broker...'); // THÊM LOG KẾT NỐI LẠI
});

module.exports = client;