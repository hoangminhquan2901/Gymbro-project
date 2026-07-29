const db = require('../config/db');

// Hàm tạo mã đơn hàng ngẫu nhiên duy nhất (VD: ORD-20260330-8A9X)
const generateOrderId = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${dateStr}-${randomStr}`;
};

// ==========================================
// 1. TẠO ĐƠN HÀNG MỚI (CHECKOUT TỪ GIỎ HÀNG)
// ==========================================
exports.createOrder = async (req, res) => {
    const { customerName, phone, email, address, note, paymentMethod } = req.body;
    const userId = req.user.userId || req.user.id || req.user.UserID;
    let customerId = req.user.customerId || req.user.CustomerID || null;

    if (!customerName || !phone || !address) {
        return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ Tên, Số điện thoại và Địa chỉ giao hàng!' });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Tự động tìm CustomerID nếu trong token chưa có
        if (!customerId && userId) {
            const [customers] = await connection.query(
                'SELECT CustomerID FROM Customers WHERE UserID = ?',
                [userId]
            );
            if (customers.length > 0) {
                customerId = customers[0].CustomerID;
            }
        }

        // 1. Lấy CartID của User
        const [carts] = await connection.query('SELECT CartID FROM Cart WHERE UserID = ?', [userId]);
        if (carts.length === 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Giỏ hàng của bạn đang trống!' });
        }
        const cartId = carts[0].CartID;

        // 2. Lấy thông tin chi tiết các món trong Giỏ hàng
        const queryItems = `
            SELECT 
                ci.ProductID,
                ci.FlavorID,
                ci.Quantity,
                ci.Price,
                p.Name AS ProductName,
                pf.FlavorName
            FROM CartItems ci
            JOIN Products p ON ci.ProductID = p.ProductID
            JOIN ProductFlavors pf ON ci.FlavorID = pf.FlavorID
            WHERE ci.CartID = ?
        `;
        const [cartItems] = await connection.query(queryItems, [cartId]);

        if (cartItems.length === 0) {
            await connection.rollback();
            return res.status(400).json({ success: false, message: 'Giỏ hàng của bạn đang trống!' });
        }

        // 3. Tính tổng tiền đơn hàng
        const totalAmount = cartItems.reduce((sum, item) => sum + (item.Quantity * item.Price), 0);
        const orderId = generateOrderId();

        // 4. Lưu thông tin Đơn hàng vào bảng Orders
        await connection.query(
            `INSERT INTO Orders 
            (OrderID, CustomerID, CustomerName, Phone, Email, Address, Note, PaymentMethod, PaymentStatus, ShippingStatus, Status, TotalAmount) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Chưa thanh toán', 'Chờ xử lý', 'Đang xử lý', ?)`,
            [orderId, customerId, customerName, phone, email || req.user.email, address, note || '', paymentMethod || 'COD', totalAmount]
        );

        // 5. Lưu Snapshot danh sách món hàng vào bảng OrderDetails
        for (const item of cartItems) {
            await connection.query(
                `INSERT INTO OrderDetails 
                (OrderID, ProductID, FlavorID, ProductName, FlavorName, Quantity, Price) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [orderId, item.ProductID, item.FlavorID, item.ProductName, item.FlavorName, item.Quantity, item.Price]
            );
        }

        // 6. Xóa toàn bộ sản phẩm trong giỏ hàng sau khi đã đặt hàng thành công
        await connection.query('DELETE FROM CartItems WHERE CartID = ?', [cartId]);

        // 💡 7. CẬP NHẬT TĂNG SỐ ĐƠN & TỔNG CHI TIÊU VÀO BẢNG CUSTOMERS
        if (customerId) {
            await connection.query(
                `UPDATE Customers 
                 SET TotalOrders = TotalOrders + 1,
                     TotalSpent = TotalSpent + ?,
                     LastOrderDate = NOW()
                 WHERE CustomerID = ?`,
                [totalAmount, customerId]
            );
        }

        await connection.commit();

        return res.status(201).json({
            success: true,
            message: 'Đặt hàng thành công!',
            orderId: orderId
        });

    } catch (error) {
        await connection.rollback();
        console.error('Lỗi createOrder:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi đặt hàng!' });
    } finally {
        connection.release();
    }
};

// ==========================================
// 2. LẤY DANH SÁCH ĐƠN HÀNG CỦA KHÁCH HÀNG (MY ORDERS)
// ==========================================
exports.getMyOrders = async (req, res) => {
    try {
        const userId = req.user.userId || req.user.id || req.user.UserID;
        const userEmail = req.user.email || '';
        let customerId = req.user.customerId || req.user.CustomerID;

        // 1. Tự động tìm CustomerID từ UserID nếu chưa có trong token
        if (!customerId && userId) {
            const [customers] = await db.query(
                'SELECT CustomerID FROM Customers WHERE UserID = ?',
                [userId]
            );
            if (customers.length > 0) {
                customerId = customers[0].CustomerID;
            }
        }

        // 2. Tra cứu đơn hàng theo CustomerID HOẶC Email tài khoản
        const [orders] = await db.query(
            `SELECT * FROM Orders 
             WHERE (CustomerID IS NOT NULL AND CustomerID = ?) 
                OR (Email IS NOT NULL AND Email = ?)
             ORDER BY CreatedAt DESC`,
            [customerId || '', userEmail]
        );

        return res.status(200).json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Lỗi getMyOrders:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Lỗi server khi lấy danh sách đơn hàng!' 
        });
    }
};

// ==========================================
// 3. LẤY CHI TIẾT 1 ĐƠN HÀNG (Bao gồm OrderDetails)
// ==========================================
exports.getOrderById = async (req, res) => {
    const { orderId } = req.params;

    try {
        const [orders] = await db.query('SELECT * FROM Orders WHERE OrderID = ?', [orderId]);
        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng!' });
        }

        const [items] = await db.query('SELECT * FROM OrderDetails WHERE OrderID = ?', [orderId]);

        return res.status(200).json({
            success: true,
            data: {
                ...orders[0],
                items
            }
        });
    } catch (error) {
        console.error('Lỗi getOrderById:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy chi tiết đơn hàng!' });
    }
};

// ==========================================
// 4. API DÀNH CHO ADMIN: LẤY TOÀN BỘ ĐƠN HÀNG
// ==========================================
exports.getAllOrdersForAdmin = async (req, res) => {
    try {
        const [orders] = await db.query(`SELECT * FROM Orders ORDER BY CreatedAt DESC`);
        return res.status(200).json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Lỗi getAllOrdersForAdmin:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy tất cả đơn hàng!' });
    }
};

// ==========================================
// 5. API DÀNH CHO ADMIN: CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG
// ==========================================
exports.updateOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const { status, paymentStatus, shippingStatus } = req.body;

    try {
        const [orders] = await db.query('SELECT OrderID FROM Orders WHERE OrderID = ?', [orderId]);
        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng!' });
        }

        await db.query(
            `UPDATE Orders 
            SET Status = COALESCE(?, Status),
                PaymentStatus = COALESCE(?, PaymentStatus),
                ShippingStatus = COALESCE(?, ShippingStatus)
            WHERE OrderID = ?`,
            [status, paymentStatus, shippingStatus, orderId]
        );

        return res.status(200).json({ success: true, message: 'Cập nhật trạng thái đơn hàng thành công!' });
    } catch (error) {
        console.error('Lỗi updateOrderStatus:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật trạng thái đơn hàng!' });
    }
};

// ==========================================
// 6. API DÀNH CHO ADMIN: XÓA VĨNH VIỄN ĐƠN HÀNG
// ==========================================
exports.deleteOrder = async (req, res) => {
    const { orderId } = req.params;

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Lấy thông tin đơn hàng trước khi xóa để biết CustomerID và TotalAmount cần trừ lại
        const [orders] = await connection.query('SELECT CustomerID, TotalAmount FROM Orders WHERE OrderID = ?', [orderId]);
        if (orders.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng!' });
        }

        const { CustomerID, TotalAmount } = orders[0];

        // 2. Xóa đơn hàng (Bảng OrderDetails sẽ tự động xóa theo CASCADE trong CSDL)
        await connection.query('DELETE FROM Orders WHERE OrderID = ?', [orderId]);

        // 💡 3. CẬP NHẬT GIẢM SỐ ĐƠN & TRỪ TIỀN Ở BẢNG CUSTOMERS NẾU CÓ
        if (CustomerID) {
            await connection.query(
                `UPDATE Customers 
                 SET TotalOrders = GREATEST(TotalOrders - 1, 0),
                     TotalSpent = GREATEST(TotalSpent - ?, 0)
                 WHERE CustomerID = ?`,
                [TotalAmount, CustomerID]
            );
        }

        await connection.commit();

        return res.status(200).json({ 
            success: true, 
            message: 'Xóa đơn hàng thành công!' 
        });
    } catch (error) {
        await connection.rollback();
        console.error('Lỗi deleteOrder:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi xóa đơn hàng!' });
    } finally {
        connection.release();
    }
};