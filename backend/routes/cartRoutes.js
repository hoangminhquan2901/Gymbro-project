const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { verifyToken } = require('../middlewares/authMiddleware');

// Tất cả thao tác giỏ hàng đều yêu cầu đăng nhập
router.use(verifyToken);

router.get('/', cartController.getCart);
router.post('/add', cartController.addToCart);
router.put('/items/:cartItemId', cartController.updateCartItem);
router.delete('/items/:cartItemId', cartController.removeCartItem);
router.delete('/clear', cartController.clearCart);

module.exports = router;