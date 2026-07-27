const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Route Đăng ký Khách hàng mới
router.post('/register', authController.register);

// Route Đăng nhập chung (Tự động nhận diện Admin hoặc Customer)
router.post('/login', authController.login);

// Route Cập nhật thông tin cá nhân (Yêu cầu đăng nhập / có Token)
router.put('/profile', verifyToken, authController.updateProfile);

// Route Đổi mật khẩu (Yêu cầu đăng nhập / có Token)
router.put('/change-password', verifyToken, authController.changePassword);

// Route lấy danh sách khách hàng cho Admin
router.get('/admin/customers', verifyToken, authController.getAllCustomers);

// Route cập nhật trạng thái khách hàng (Khóa/Mở khóa) bởi Admin
router.put('/admin/customers/:id/status', verifyToken, authController.updateCustomerStatus);

router.get('/profile', verifyToken, authController.getProfile);

module.exports = router;