const express = require('express');
const cors = require('cors');
require('dotenv').config();

// ==========================================
// IMPORT ROUTE MODULES
// ==========================================
const authRoutes = require('./routes/authRoutes');
const brandRoutes = require('./routes/brandRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const goalRoutes = require('./routes/goalRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const adminActivityRoutes = require('./routes/adminActivityRoutes'); // 👈 Đã đưa lên đầu file
const aiRoutes = require('./routes/aiRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// CẤU HÌNH MIDDLEWARE & CORS
// ==========================================
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: '*',
  credentials: true
}));

app.use(express.json());

// ==========================================
// MOUNT API ROUTES
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', dashboardRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/activities', adminActivityRoutes);
app.use('/api/ai', aiRoutes); // 👈 BỔ SUNG DÒNG NÀY ĐỂ KÍCH HOẠT GEMINI AI

// ==========================================
// KHỞI CHẠY SERVER
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});