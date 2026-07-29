const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware'); // 👈 Import thêm isAdmin

// Tất cả các route đơn hàng đều bắt buộc đăng nhập
router.use(verifyToken);

// Client Routes
router.post('/checkout', orderController.createOrder);
router.get('/my-orders', orderController.getMyOrders); 
router.get('/:orderId', orderController.getOrderById); // Đặt sau /my-orders là chuẩn rồi!

// Admin Routes (Thêm middleware isAdmin để chặn Client thường)
router.get('/admin/all', isAdmin, orderController.getAllOrdersForAdmin);
router.put('/admin/:orderId/status', isAdmin, orderController.updateOrderStatus);
router.delete('/:orderId', isAdmin, orderController.deleteOrder); 

module.exports = router;