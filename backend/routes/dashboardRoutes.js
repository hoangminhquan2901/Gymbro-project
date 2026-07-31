const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// Định nghĩa endpoint: /api/admin/dashboard-stats
router.get('/admin/dashboard-stats', verifyToken, isAdmin, dashboardController.getDashboardStats);

module.exports = router;