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

        // 3.1. KIỂM TRA VÀ TRỪ TỒN KHO TRONG BẢNG ProductFlavors
        for (const item of cartItems) {
            const [flavorRows] = await connection.query(
                'SELECT Stock FROM ProductFlavors WHERE FlavorID = ?',
                [item.FlavorID]
            );

            if (flavorRows.length === 0) {
                await connection.rollback();
                return res.status(400).json({ 
                    success: false, 
                    message: `Không tìm thấy thông tin phân loại của sản phẩm!` 
                });
            }

            const currentStock = flavorRows[0].Stock;

            if (currentStock < item.Quantity) {
                await connection.rollback();
                return res.status(400).json({ 
                    success: false, 
                    message: `Sản phẩm "${item.ProductName} (${item.FlavorName})" không đủ số lượng trong kho (Chỉ còn ${currentStock} sản phẩm)!` 
                });
            }

            await connection.query(
                'UPDATE ProductFlavors SET Stock = Stock - ? WHERE FlavorID = ?',
                [item.Quantity, item.FlavorID]
            );
        }

        // 4. Lưu thông tin Đơn hàng vào bảng Orders (Mặc định ban đầu: Chưa thanh toán)
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

        // 💡 LƯU Ý: Đã gỡ bỏ logic cộng tiền/đơn hàng ở đây. 
        // Hệ thống sẽ chỉ cộng dồn khi Admin duyệt đơn sang trạng thái "Đã thanh toán".

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

        if (!customerId && userId) {
            const [customers] = await db.query(
                'SELECT CustomerID FROM Customers WHERE UserID = ?',
                [userId]
            );
            if (customers.length > 0) {
                customerId = customers[0].CustomerID;
            }
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const offset = (page - 1) * limit;

        const whereClause = `WHERE (CustomerID IS NOT NULL AND CustomerID = ?) OR (Email IS NOT NULL AND Email = ?)`;
        const queryParams = [customerId || '', userEmail];

        const [countResult] = await db.query(
            `SELECT COUNT(*) AS total FROM Orders ${whereClause}`,
            queryParams
        );
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit) || 1;

        const [orders] = await db.query(
            `SELECT * FROM Orders 
             ${whereClause}
             ORDER BY CreatedAt DESC 
             LIMIT ? OFFSET ?`,
            [...queryParams, Number(limit), Number(offset)]
        );

        return res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                currentPage: page,
                limit: limit,
                totalItems: totalItems,
                totalPages: totalPages
            }
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
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const [countResult] = await db.query(`SELECT COUNT(*) AS total FROM Orders`);
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit) || 1;

        const [orders] = await db.query(
            `SELECT * FROM Orders ORDER BY CreatedAt DESC LIMIT ? OFFSET ?`,
            [Number(limit), Number(offset)]
        );

        return res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                currentPage: page,
                limit: limit,
                totalItems: totalItems,
                totalPages: totalPages
            }
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

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Lấy thông tin cũ của đơn hàng
        const [orders] = await connection.query(
            'SELECT OrderID, CustomerID, TotalAmount, PaymentStatus, Status FROM Orders WHERE OrderID = ?', 
            [orderId]
        );
        if (orders.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng!' });
        }

        const currentOrder = orders[0];
        const customerId = currentOrder.CustomerID;
        const totalAmount = Number(currentOrder.TotalAmount) || 0;
        const oldPaymentStatus = currentOrder.PaymentStatus;
        const oldStatus = currentOrder.Status;

        const newPaymentStatus = paymentStatus !== undefined ? paymentStatus : oldPaymentStatus;
        const newStatus = status !== undefined ? status : oldStatus;

        // 2. Thực hiện cập nhật trạng thái đơn hàng
        await connection.query(
            `UPDATE Orders 
            SET Status = COALESCE(?, Status),
                PaymentStatus = COALESCE(?, PaymentStatus),
                ShippingStatus = COALESCE(?, ShippingStatus)
            WHERE OrderID = ?`,
            [status, paymentStatus, shippingStatus, orderId]
        );

        // 3. Kiểm tra điều kiện cộng tiền
        const successKeywords = ['Đã thanh toán', 'Hoàn thành', 'Đã hoàn thành'];
        const isNowPaid = successKeywords.includes(newPaymentStatus) || successKeywords.includes(newStatus);
        const wasPaidBefore = successKeywords.includes(oldPaymentStatus) || successKeywords.includes(oldStatus);

        if (!wasPaidBefore && isNowPaid) {
            if (customerId) {
                console.log(`--> Đơn hàng ${orderId} đã hoàn thành/thanh toán! Đang cộng ${totalAmount} cho CustomerID: ${customerId}`);
                
                // 💡 ĐÃ SỬA 'VIP' THÀNH 'Diamond' CHO KHỚP VỚI CẤU TRÚC ENUM CỦA BẠN
                await connection.query(
                    `UPDATE Customers 
                     SET TotalOrders = COALESCE(TotalOrders, 0) + 1,
                         TotalSpent = COALESCE(TotalSpent, 0) + ?,
                         LastOrderDate = NOW(),
                         Tier = CASE 
                             WHEN (COALESCE(TotalSpent, 0) + ?) >= 10000000 THEN 'Diamond'
                             WHEN (COALESCE(TotalSpent, 0) + ?) >= 5000000 THEN 'Gold'
                             WHEN (COALESCE(TotalSpent, 0) + ?) >= 1000000 THEN 'Silver'
                             ELSE 'Bronze'
                         END
                     WHERE CustomerID = ?`,
                    [totalAmount, totalAmount, totalAmount, totalAmount, customerId]
                );
            } else {
                console.log("--> Đơn hàng này có CustomerID là NULL nên không thể cộng tiền vào bảng khách hàng.");
            }
        }

        await connection.commit();
        return res.status(200).json({ success: true, message: 'Cập nhật trạng thái đơn hàng thành công!' });
    } catch (error) {
        await connection.rollback();
        console.error('Lỗi updateOrderStatus:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật trạng thái đơn hàng!' });
    } finally {
        connection.release();
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

        // 1. Lấy thông tin đơn hàng trước khi xóa để kiểm tra xem đã thanh toán chưa
        const [orders] = await connection.query(
            'SELECT CustomerID, TotalAmount, PaymentStatus FROM Orders WHERE OrderID = ?', 
            [orderId]
        );
        if (orders.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng!' });
        }

        const { CustomerID, TotalAmount, PaymentStatus } = orders[0];

        // 2. Xóa đơn hàng (Bảng OrderDetails tự động xóa theo CASCADE)
        await connection.query('DELETE FROM Orders WHERE OrderID = ?', [orderId]);

        // 💡 3. CHỈ TRỪ LẠI TIỀN VÀ SỐ ĐƠN NẾU ĐƠN HÀNG ĐÓ ĐÃ TỪNG ĐƯỢC THANH TOÁN
        if (CustomerID && PaymentStatus === 'Đã thanh toán') {
            await connection.query(
                `UPDATE Customers 
                 SET TotalOrders = GREATEST(TotalOrders - 1, 0),
                     TotalSpent = GREATEST(TotalSpent - ?, 0),
                     Tier = CASE 
                         WHEN TotalSpent - ? >= 10000000 THEN 'VIP'
                         WHEN TotalSpent - ? >= 5000000 THEN 'Gold'
                         WHEN TotalSpent - ? >= 1000000 THEN 'Silver'
                         ELSE 'Bronze'
                     END
                 WHERE CustomerID = ?`,
                [TotalAmount, TotalAmount, TotalAmount, TotalAmount, CustomerID]
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

// ==========================================
// 7. API DÀNH CHO ADMIN: LẤY LỊCH SỬ ĐƠN HÀNG THEO CUSTOMER ID
// ==========================================
exports.getOrdersByCustomerId = async (req, res) => {
    const { customerId } = req.params;

    try {
        const [orders] = await db.query(
            `SELECT 
                OrderID as id, 
                CreatedAt as date, 
                TotalAmount as total, 
                Status as status,
                PaymentStatus as paymentStatus,
                ShippingStatus as shippingStatus
             FROM Orders 
             WHERE CustomerID = ? 
             ORDER BY CreatedAt DESC`,
            [customerId]
        );

        return res.status(200).json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.error('Lỗi getOrdersByCustomerId:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Lỗi server khi lấy lịch sử đơn hàng của khách hàng!' 
        });
    }
};

// ==========================================
// API XÓA ĐƠN HÀNG VÀ TỰ ĐỘNG ĐỒNG BỘ LẠI THÔNG TIN KHÁCH HÀNG
// ==========================================
exports.deleteOrder = async (req, res) => {
    const { orderId } = req.params;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Lấy thông tin đơn hàng trước khi xóa để biết thuộc khách nào
        const [orders] = await connection.query(
            'SELECT OrderID, CustomerID FROM Orders WHERE OrderID = ?', 
            [orderId]
        );

        if (orders.length === 0) {
            await connection.rollback();
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng!' });
        }

        const customerId = orders[0].CustomerID;

        // 2. Xóa chi tiết đơn hàng trước (tránh lỗi khóa ngoại nếu có bảng OrderDetails)
        await connection.query('DELETE FROM OrderDetails WHERE OrderID = ?', [orderId]);

        // 3. Xóa đơn hàng chính
        await connection.query('DELETE FROM Orders WHERE OrderID = ?', [orderId]);

        // 4. Nếu đơn hàng này thuộc về một khách hàng, tiến hành TÍNH LẠI TOÀN BỘ chỉ số của khách đó
        if (customerId) {
            // Lấy tất cả các đơn hàng thành công/đã thanh toán CÒN LẠI của khách này
            // (Lưu ý: Nếu bảng Orders của bạn lưu ngày tạo bằng cột 'OrderDate' thay vì 'CreatedAt', bạn hãy sửa lại cho khớp)
            const [remainingOrders] = await connection.query(
                `SELECT TotalAmount, CreatedAt FROM Orders 
                 WHERE CustomerID = ? AND (Status IN ('Hoàn thành', 'Đã hoàn thành') OR PaymentStatus IN ('Đã thanh toán', 'Hoàn thành', 'Đã hoàn thành'))`,
                [customerId]
            );

            const totalOrders = remainingOrders.length;
            const totalSpent = remainingOrders.reduce((sum, order) => sum + Number(order.TotalAmount || 0), 0);

            // Tìm ngày của đơn hàng gần nhất trong số các đơn còn lại
            let lastOrderDate = null;
            if (totalOrders > 0) {
                // Sắp xếp giảm dần theo ngày tạo để lấy đơn mới nhất
                remainingOrders.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
                lastOrderDate = remainingOrders[0].CreatedAt;
            }

            // Tính toán lại Cấp độ (Tier) dựa trên tổng chi tiêu mới
            let tier = 'Bronze';
            if (totalSpent >= 10000000) {
                tier = 'Diamond';
            } else if (totalSpent >= 5000000) {
                tier = 'Gold';
            } else if (totalSpent >= 1000000) {
                tier = 'Silver';
            }

            // 5. Cập nhật lại toàn bộ thông tin vào bảng Customers
            await connection.query(
                `UPDATE Customers 
                 SET TotalOrders = ?, 
                     TotalSpent = ?, 
                     LastOrderDate = ?, 
                     Tier = ? 
                 WHERE CustomerID = ?`,
                [totalOrders, totalSpent, lastOrderDate, tier, customerId]
            );
        }

        await connection.commit();
        return res.status(200).json({ success: true, message: 'Xóa đơn hàng và cập nhật lại thông tin khách hàng thành công!' });

    } catch (error) {
        await connection.rollback();
        console.error('Lỗi khi xóa đơn hàng:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi xóa đơn hàng!' });
    } finally {
        connection.release();
    }
};