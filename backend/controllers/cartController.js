const db = require('../config/db');

// 1. LẤY GIỎ HÀNG CỦA USER
exports.getCart = async (req, res) => {
    try {
        const userId = req.user?.UserID || req.user?.id || req.user?.userId;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Người dùng chưa xác thực!' });
        }

        // Tự động tạo Cart cho User nếu chưa có
        let [carts] = await db.query('SELECT CartID FROM Cart WHERE UserID = ?', [userId]);
        let cartId;

        if (carts.length === 0) {
            const [result] = await db.query('INSERT INTO Cart (UserID) VALUES (?)', [userId]);
            cartId = result.insertId;
        } else {
            cartId = carts[0].CartID;
        }

        // Query lấy danh sách sản phẩm
        const sql = `
            SELECT 
                ci.CartItemID,
                ci.ProductID,
                ci.FlavorID,
                ci.Quantity,
                ci.Price,
                p.Name AS ProductName,
                p.Image AS ProductImage,
                pf.FlavorName,
                (ci.Quantity * ci.Price) AS SubTotal
            FROM CartItems ci
            LEFT JOIN Products p ON ci.ProductID = p.ProductID
            LEFT JOIN ProductFlavors pf ON ci.FlavorID = pf.FlavorID
            WHERE ci.CartID = ?
            ORDER BY ci.CartItemID DESC
        `;

        const [items] = await db.query(sql, [cartId]);

        // Tính tổng tiền toàn bộ giỏ hàng
        const totalAmount = items.reduce((sum, item) => sum + Number(item.SubTotal || 0), 0);

        return res.status(200).json({
            success: true,
            cartId: cartId,
            items: items,
            totalAmount: totalAmount
        });

    } catch (error) {
        console.error('Lỗi getCart:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lấy giỏ hàng!', error: error.message });
    }
};

// 2. THÊM SẢN PHẨM VÀO GIỎ HÀNG
exports.addToCart = async (req, res) => {
    try {
        const userId = req.user?.UserID || req.user?.id || req.user?.userId;
        const { productId, flavorId, quantity, price } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin ProductID!' });
        }

        // Lấy hoặc tạo CartID
        let [carts] = await db.query('SELECT CartID FROM Cart WHERE UserID = ?', [userId]);
        let cartId;

        if (carts.length === 0) {
            const [result] = await db.query('INSERT INTO Cart (UserID) VALUES (?)', [userId]);
            cartId = result.insertId;
        } else {
            cartId = carts[0].CartID;
        }

        const addQty = Number(quantity) || 1;
        const addPrice = Number(price) || 0;
        const currentFlavorId = flavorId || null;

        // Kiểm tra xem sản phẩm + hương vị này đã có trong CartItems chưa
        let checkSql = 'SELECT CartItemID, Quantity FROM CartItems WHERE CartID = ? AND ProductID = ?';
        let queryParams = [cartId, productId];

        if (currentFlavorId !== null) {
            checkSql += ' AND FlavorID = ?';
            queryParams.push(currentFlavorId);
        } else {
            checkSql += ' AND FlavorID IS NULL';
        }

        const [existing] = await db.query(checkSql, queryParams);

        if (existing.length > 0) {
            // Đã có -> Cộng dồn số lượng
            const newQty = existing[0].Quantity + addQty;
            await db.query(
                'UPDATE CartItems SET Quantity = ?, Price = ? WHERE CartItemID = ?',
                [newQty, addPrice, existing[0].CartItemID]
            );
        } else {
            // Chưa có -> Thêm mới bản ghi
            await db.query(
                'INSERT INTO CartItems (CartID, ProductID, FlavorID, Quantity, Price) VALUES (?, ?, ?, ?, ?)',
                [cartId, productId, currentFlavorId, addQty, addPrice]
            );
        }

        return res.status(200).json({ success: true, message: 'Đã thêm sản phẩm vào giỏ hàng thành công!' });

    } catch (error) {
        console.error('Lỗi addToCart:', error);
        return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi thêm giỏ hàng!', error: error.message });
    }
};

// 3. CẬP NHẬT SỐ LƯỢNG MỘT MÓN TRONG GIỎ HÀNG (ĐÃ SỬA CÂU SQL CÓ DẤU _)
exports.updateCartItem = async (req, res) => {
    try {
        const cartItemId = req.params.cartItemId || req.params.id;
        const quantity = req.body.quantity ?? req.body.Quantity;

        console.log(`\n--- [DEBUG UPDATE] ---`);
        console.log(`CartItemID nhận được:`, cartItemId);
        console.log(`Quantity mới nhận được:`, quantity);

        if (!cartItemId || quantity === undefined) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin cartItemId hoặc quantity' });
        }

        if (Number(quantity) <= 0) {
            return exports.removeCartItem(req, res);
        }

        // ✅ ĐÃ SỬA: Đổi cart_items -> CartItems, cart_item_id -> CartItemID, quantity -> Quantity
        const [result] = await db.query(
            'UPDATE CartItems SET Quantity = ? WHERE CartItemID = ?',
            [quantity, cartItemId]
        );

        console.log(`Số dòng thực sự được cập nhật trong DB (affectedRows):`, result.affectedRows);

        return res.status(200).json({
            success: true,
            message: 'Cập nhật thành công',
            affectedRows: result.affectedRows
        });
    } catch (error) {
        console.error('Lỗi updateCartItem:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 4. XÓA MỘT MÓN KHỎI GIỎ HÀNG (ĐÃ SỬA CÂU SQL CÓ DẤU _)
exports.removeCartItem = async (req, res) => {
    try {
        const cartItemId = req.params.cartItemId || req.params.id;

        console.log(`\n--- [DEBUG DELETE] ---`);
        console.log(`CartItemID muốn xóa:`, cartItemId);

        if (!cartItemId) {
            return res.status(400).json({ success: false, message: 'Thiếu cartItemId' });
        }

        // ✅ ĐÃ SỬA: Đổi cart_items -> CartItems, cart_item_id -> CartItemID
        const [result] = await db.query(
            'DELETE FROM CartItems WHERE CartItemID = ?',
            [cartItemId]
        );

        console.log(`Số dòng thực sự bị xóa trong DB (affectedRows):`, result.affectedRows);

        return res.status(200).json({
            success: true,
            message: 'Xóa thành công',
            affectedRows: result.affectedRows
        });
    } catch (error) {
        console.error('Lỗi removeCartItem:', error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 5. XÓA SẠCH GIỎ HÀNG CỦA USER
exports.clearCart = async (req, res) => {
    try {
        const userId = req.user?.UserID || req.user?.id || req.user?.userId;

        const [carts] = await db.query('SELECT CartID FROM Cart WHERE UserID = ?', [userId]);

        if (carts.length > 0) {
            await db.query('DELETE FROM CartItems WHERE CartID = ?', [carts[0].CartID]);
        }

        return res.status(200).json({ success: true, message: 'Đã dọn sạch giỏ hàng!' });
    } catch (error) {
        console.error('Lỗi clearCart:', error);
        return res.status(500).json({ success: false, message: 'Lỗi dọn giỏ hàng!', error: error.message });
    }
};