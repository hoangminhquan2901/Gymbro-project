const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gymbro_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Kiểm tra kết nối Database khi khởi chạy
pool.getConnection()
    .then(connection => {
        console.log(`✅ Đã kết nối thành công với Database MySQL (${process.env.DB_NAME || 'gymbro_db'})!`);
        connection.release();
    })
    .catch(err => {
        console.error('❌ Lỗi kết nối Database MySQL:', err.message);
    });

module.exports = pool;