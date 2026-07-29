const db = require('./config/db'); // Trỏ đúng đến file kết nối database của bạn
const bcrypt = require('bcryptjs');

async function createAdminAccount() {
    try {
        const email = 'hmq@gmail.com';
        const plainPassword = '12345678';

        console.log('Đang xử lý tạo tài khoản Admin...');

        // 1. Kiểm tra và xóa tài khoản cũ nếu đã tồn tại để tránh trùng lặp
        const [existing] = await db.query('SELECT UserID FROM Users WHERE Email = ?', [email]);
        if (existing.length > 0) {
            await db.query('DELETE FROM Users WHERE Email = ?', [email]);
            console.log('-> Đã xóa tài khoản cũ bị lỗi.');
        }

        // 2. Mã hóa mật khẩu chuẩn 100% bằng bcryptjs của project
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(plainPassword, salt);

        // 3. Thêm vào bảng Users với Role = 'Admin'
        const [userResult] = await db.query(
            `INSERT INTO Users (Email, Password, FirstName, LastName, Phone, Role, IsActive) 
             VALUES (?, ?, 'Quân', 'Hoàng Minh', '', 'Admin', 1)`,
            [email, hashedPassword]
        );

        const userId = userResult.insertId;

        // 4. Thêm hồ sơ vào bảng AdminUsers
        await db.query(
            `INSERT INTO AdminUsers (UserID, Address, Bio) VALUES (?, 'Hà Nội', 'System Administrator')`,
            [userId]
        );

        console.log('--------------------------------------------------');
        console.log('✅ TẠO TÀI KHOẢN ADMIN THÀNH CÔNG!');
        console.log('📧 Email:', email);
        console.log('🔑 Mật khẩu:', plainPassword);
        console.log('--------------------------------------------------');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi khi tạo tài khoản admin:', error);
        process.exit(1);
    }
}

createAdminAccount();