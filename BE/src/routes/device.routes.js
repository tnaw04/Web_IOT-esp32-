const express = require('express');
const router = express.Router();
const {
  getDeviceStates,
  getDeviceHistory,
  getAllDeviceHistory,
  toggleDeviceState,
} = require('../controllers/device.controller');

// Route để lấy trạng thái hiện tại của tất cả các thiết bị
// Route này phải được đặt trước các route động (với tham số) để được ưu tiên
router.get('/states', getDeviceStates);

// Route để lấy lịch sử của TẤT CẢ thiết bị
router.get('/history/all', getAllDeviceHistory);

// Route để bật/tắt một thiết bị
router.post('/toggle', toggleDeviceState);

// Route để lấy lịch sử của một thiết bị cụ thể
router.get('/:deviceName', getDeviceHistory);

module.exports = router;