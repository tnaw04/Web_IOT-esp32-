const express = require('express');
const router = express.Router();
const { getProfile } = require('../controllers/user.controller');

// Định nghĩa route để lấy thông tin profile
router.get('/profile', getProfile);

module.exports = router;