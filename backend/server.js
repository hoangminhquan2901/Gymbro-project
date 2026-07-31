const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const brandRoutes = require('./routes/brandRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const goalRoutes = require('./routes/goalRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes'); // 👈 1. Thêm import route dashboard vào đây

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// CẤU HÌNH CORS MỞ RỘNG (CHO PHÉP TẤT CẢ HEADERS)
// ==========================================
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: '*', // Cho phép tất cả Headers (Pragma, Cache-Control, Authorization, v.v.)
  credentials: true
}));

app.use(express.json());

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', dashboardRoutes); // 👈 2. Gắn route dashboard vào đây (kết hợp với /admin trong file route thành /api/admin/dashboard-stats)

// Khởi chạy server
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});