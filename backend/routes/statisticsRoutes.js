const express = require('express');
const router = express.Router();
const { getStatistics } = require('../controllers/statisticsController');

router.get('/', getStatistics);

// ❌ Xóa dòng app.use đi, thay bằng module.exports để server.js nhận diện được router này
module.exports = router;