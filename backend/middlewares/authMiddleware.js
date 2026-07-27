const jwt = require('jsonwebtoken');

// 1. Middleware kiểm tra Token
exports.verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer <TOKEN>"

    if (!token) {
        return res.status(401).json({ success: false, message: 'Bạn chưa đăng nhập!' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gymbro_secret_key');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ success: false, message: 'Token không hợp lệ hoặc đã hết hạn!' });
    }
};

// 2. Middleware kiểm tra quyền Admin
exports.isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'Admin') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Truy cập bị từ chối! Yêu cầu quyền Admin.' });
};