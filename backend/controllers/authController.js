const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// ==========================================
// 1. API ĐĂNG NHẬP CHUNG (TỰ ĐỘNG PHÂN QUYỀN ADMIN / CUSTOMER)
// ==========================================
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập Email và Mật khẩu!' });
        }

        // 1. Tìm kiếm user trong bảng Users trước
        const [users] = await db.query(
            `SELECT UserID, Email, Password, FirstName, LastName, Phone, Role, IsActive 
            FROM Users WHERE Email = ?`,
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Email này chưa được đăng ký trong hệ thống!' });
        }

        const user = users[0];

        // 2. Kiểm tra tài khoản có bị khóa không (IsActive = 0)
        if (!user.IsActive) {
            return res.status(403).json({ success: false, message: 'Tài khoản của bạn đang bị khóa!' });
        }

        // 3. Kiểm tra mật khẩu mã hóa bằng bcrypt
        const isMatch = await bcrypt.compare(password, user.Password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác!' });
        }

        // Khai báo các biến lưu thông tin phụ
        let specificId = null;
        let address = '';
        let bio = '';

        // 4. Phân rẽ dữ liệu dựa theo Role trong cơ sở dữ liệu
        if (user.Role === 'Admin') {
            const [adminRows] = await db.query('SELECT AdminID, Address, Bio FROM AdminUsers WHERE UserID = ?', [user.UserID]);
            if (adminRows.length > 0) {
                specificId = adminRows[0].AdminID;
                address = adminRows[0].Address || '';
                bio = adminRows[0].Bio || '';
            }
        } else {
            const [customerRows] = await db.query('SELECT CustomerID, Address FROM Customers WHERE UserID = ?', [user.UserID]);
            if (customerRows.length > 0) {
                specificId = customerRows[0].CustomerID;
                address = customerRows[0].Address || '';
            }
        }

        // 5. Cập nhật thời gian đăng nhập gần nhất
        await db.query('UPDATE Users SET LastLogin = NOW() WHERE UserID = ?', [user.UserID]);

        // 6. Tạo JWT Token
        const tokenPayload = {
            userId: user.UserID,
            email: user.Email,
            role: user.Role
        };
        
        if (user.Role === 'Admin') {
            tokenPayload.adminId = specificId;
        } else {
            tokenPayload.customerId = specificId;
        }

        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET || 'gymbro_secret_key',
            { expiresIn: '7d' }
        );

        // Tạo fullName fallback an toàn nếu FirstName / LastName bị trống
        const calculatedFullName = `${user.FirstName || ''} ${user.LastName || ''}`.trim() || user.Email.split('@')[0];

        // 7. Trả về Response
        return res.status(200).json({
            success: true,
            message: user.Role === 'Admin' ? 'Đăng nhập Admin thành công!' : 'Đăng nhập thành công!',
            token,
            data: {
                id: specificId,
                userID: user.UserID,
                email: user.Email,
                firstName: user.FirstName || '',
                lastName: user.LastName || '',
                fullName: calculatedFullName,
                phone: user.Phone || '',
                role: user.Role,
                address: address,
                ...(user.Role === 'Admin' && { bio })
            }
        });

    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server nội bộ khi đăng nhập!' });
    }
};

// ==========================================
// 2. API LẤY THÔNG TIN CÁ NHÂN (GET /profile)
// ==========================================
exports.getProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Lấy thông tin user từ bảng Users
        const [users] = await db.query(
            `SELECT UserID, Email, FirstName, LastName, Phone, Role, IsActive 
            FROM Users WHERE UserID = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng!' });
        }

        const user = users[0];
        let specificId = null;
        let address = '';
        let bio = '';

        if (user.Role === 'Admin') {
            const [adminRows] = await db.query('SELECT AdminID, Address, Bio FROM AdminUsers WHERE UserID = ?', [userId]);
            if (adminRows.length > 0) {
                specificId = adminRows[0].AdminID;
                address = adminRows[0].Address || '';
                bio = adminRows[0].Bio || '';
            }
        } else {
            const [customerRows] = await db.query('SELECT CustomerID, Address FROM Customers WHERE UserID = ?', [userId]);
            if (customerRows.length > 0) {
                specificId = customerRows[0].CustomerID;
                address = customerRows[0].Address || '';
            }
        }

        const calculatedFullName = `${user.FirstName || ''} ${user.LastName || ''}`.trim() || user.Email.split('@')[0];

        return res.status(200).json({
            success: true,
            data: {
                id: specificId,
                userID: user.UserID,
                email: user.Email,
                firstName: user.FirstName || '',
                lastName: user.LastName || '',
                fullName: calculatedFullName,
                phone: user.Phone || '',
                role: user.Role,
                address: address,
                ...(user.Role === 'Admin' && { bio })
            }
        });
    } catch (error) {
        console.error('Lỗi getProfile:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy thông tin cá nhân!' });
    }
};

// ==========================================
// 3. API CẬP NHẬT THÔNG TIN CÁ NHÂN (Profile)
// ==========================================
exports.updateProfile = async (req, res) => {
    const { firstName, lastName, phone, address, bio } = req.body;
    const { userId, role } = req.user;

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Cập nhật thông tin chung ở bảng Users
        await connection.query(
            `UPDATE Users SET FirstName = ?, LastName = ?, Phone = ? WHERE UserID = ?`,
            [firstName, lastName, phone, userId]
        );

        // Cập nhật thông tin ở bảng phụ tương ứng
        if (role === 'Customer') {
            await connection.query(
                `UPDATE Customers SET Address = ? WHERE UserID = ?`,
                [address, userId]
            );
        } else if (role === 'Admin') {
            await connection.query(
                `UPDATE AdminUsers SET Address = ?, Bio = ? WHERE UserID = ?`,
                [address, bio, userId]
            );
        }

        await connection.commit();
        return res.status(200).json({ success: true, message: 'Cập nhật thông tin thành công!' });
    } catch (error) {
        await connection.rollback();
        console.error('Lỗi Update Profile:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật profile!' });
    } finally {
        connection.release();
    }
};

// ==========================================
// 4. API ĐỔI MẬT KHẨU
// ==========================================
exports.changePassword = async (req, res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.userId;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập mật khẩu cũ và mật khẩu mới!' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 8 ký tự!' });
    }

    try {
        const [users] = await db.query('SELECT Password FROM Users WHERE UserID = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Người dùng không tồn tại!' });
        }

        const user = users[0];

        const isMatch = await bcrypt.compare(oldPassword, user.Password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Mật khẩu cũ không chính xác!' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.query('UPDATE Users SET Password = ? WHERE UserID = ?', [hashedPassword, userId]);

        return res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công!' });
    } catch (error) {
        console.error('Lỗi Change Password:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi đổi mật khẩu!' });
    }
};

// ==========================================
// 5. API ĐĂNG KÝ TÀI KHOẢN KHÁCH HÀNG
// ==========================================
exports.register = async (req, res) => {
    const { email, password, firstName, lastName, phone, address } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ Email và Mật khẩu!' });
    }

    if (password.length < 8) {
        return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 8 ký tự!' });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [existingUsers] = await connection.query('SELECT UserID FROM Users WHERE Email = ?', [email]);
        if (existingUsers.length > 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Email này đã được đăng ký!' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const [userResult] = await connection.query(
            `INSERT INTO Users (Email, Password, FirstName, LastName, Phone, Role, IsActive) 
             VALUES (?, ?, ?, ?, ?, 'Customer', 1)`,
            [email, hashedPassword, firstName || '', lastName || '', phone || '']
        );

        const userId = userResult.insertId;

        await connection.query(
            `INSERT INTO Customers (UserID, Address) VALUES (?, ?)`,
            [userId, address || '']
        );

        await connection.commit();

        return res.status(201).json({
            success: true,
            message: 'Đăng ký tài khoản thành công!'
        });

    } catch (error) {
        await connection.rollback();
        console.error('Lỗi đăng ký tài khoản:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi đăng ký tài khoản!' });
    } finally {
        connection.release();
    }
};

// ==========================================
// 6. API LẤY DANH SÁCH KHÁCH HÀNG CHO ADMIN (ĐÃ CẬP NHẬT KÈM LỊCH SỬ ĐƠN HÀNG)
// ==========================================
exports.getAllCustomers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        // 1. Đếm tổng số khách hàng thỏa mãn điều kiện
        const countQuery = `
            SELECT COUNT(*) as total 
            FROM Users u 
            WHERE u.Role = 'Customer'
        `;
        const [countResult] = await db.query(countQuery);
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit) || 1;

        // 2. Lấy dữ liệu phân trang
        const query = `
            SELECT 
                u.UserID as id,
                c.CustomerID as customerId,
                CONCAT(u.FirstName, ' ', u.LastName) as name,
                u.Email as email,
                u.Phone as phone,
                u.Role as role,
                u.IsActive as status,
                c.Address as address,
                COALESCE(c.TotalOrders, 0) as totalOrders,
                COALESCE(c.TotalSpent, 0) as totalSpent,
                COALESCE(c.Tier, 'Bronze') as tier,
                c.LastOrderDate as lastOrderDate,
                u.CreatedAt as createdAt,
                u.LastLogin as lastLogin
            FROM Users u
            LEFT JOIN Customers c ON u.UserID = c.UserID
            WHERE u.Role = 'Customer'
            ORDER BY u.CreatedAt DESC
            LIMIT ? OFFSET ?
        `;

        const [customers] = await db.query(query, [Number(limit), Number(offset)]);

        // 3. Lấy thêm lịch sử đơn hàng cho từng khách hàng để hiển thị vào Modal
        for (let customer of customers) {
            if (customer.customerId) {
                const [orders] = await db.query(
                    `SELECT OrderID as id, CreatedAt as date, TotalAmount as total, Status as status 
                     FROM Orders 
                     WHERE CustomerID = ? 
                     ORDER BY CreatedAt DESC`,
                    [customer.customerId]
                );
                customer.recentOrders = orders;
            } else {
                customer.recentOrders = [];
            }
        }

        return res.status(200).json({
            success: true,
            data: customers,
            pagination: {
                currentPage: page,
                limit: limit,
                totalItems: totalItems,
                totalPages: totalPages
            }
        });
    } catch (error) {
        console.error('Lỗi lấy danh sách khách hàng:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy danh sách khách hàng!' });
    }
};

// 7. API CẬP NHẬT TRẠNG THÁI KHÁCH HÀNG (Khóa / Mở khóa)
exports.updateCustomerStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    try {
        const [users] = await db.query('SELECT UserID FROM Users WHERE UserID = ?', [id]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng!' });
        }

        // Chuẩn hóa status gửi lên về 1 (Hoạt động) hoặc 0 (Khóa)
        const isActived = (
            status === 1 || 
            status === true || 
            status === '1' || 
            status === 'Active' || 
            status === 'Hoạt động'
        ) ? 1 : 0;

        await db.query('UPDATE Users SET IsActive = ? WHERE UserID = ?', [isActived, id]);

        return res.status(200).json({
            success: true,
            message: 'Cập nhật trạng thái khách hàng thành công!',
            newStatus: isActived
        });
    } catch (error) {
        console.error('Lỗi cập nhật trạng thái khách hàng:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật trạng thái!' });
    }
};

// ==========================================
// 8. API KIỂM TRA EMAIL QUÊN MẬT KHẨU
// ==========================================
exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập email!' });
    }

    try {
        const [users] = await db.query('SELECT UserID, Email FROM Users WHERE Email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Email này chưa được đăng ký trong hệ thống!' });
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Email hợp lệ, vui lòng tiến hành đổi mật khẩu mới.' 
        });
    } catch (error) {
        console.error('Lỗi kiểm tra email quên mật khẩu:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi kiểm tra email!' });
    }
};

// ==========================================
// 9. API ĐẶT LẠI MẬT KHẨU MỚI
// ==========================================
exports.resetPassword = async (req, res) => {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
        return res.status(400).json({ success: false, message: 'Vui lòng nhập đầy đủ thông tin!' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ success: false, message: 'Mật khẩu phải có ít nhất 8 ký tự!' });
    }

    try {
        const [users] = await db.query('SELECT UserID FROM Users WHERE Email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản với email này!' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        await db.query('UPDATE Users SET Password = ? WHERE Email = ?', [hashedPassword, email]);

        return res.status(200).json({ 
            success: true, 
            message: 'Đặt lại mật khẩu thành công!' 
        });
    } catch (error) {
        console.error('Lỗi đặt lại mật khẩu:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi đặt lại mật khẩu!' });
    }
};