const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Tất cả các route đơn hàng đều bắt buộc đăng nhập
router.use(verifyToken);

// Client Routes
router.post('/checkout', orderController.createOrder);
router.get('/my-orders', orderController.getMyOrders);
router.get('/:orderId', orderController.getOrderById);

// Admin Routes
router.get('/admin/all', orderController.getAllOrdersForAdmin);
router.put('/admin/:orderId/status', orderController.updateOrderStatus);

module.exports = router;