const db = require('../config/db');

// Hàm hỗ trợ: Lấy hoặc tạo mới CartID cho User
const getOrCreateCartId = async (userId) => {
    const [carts] = await db.query('SELECT CartID FROM Cart WHERE UserID = ?', [userId]);
    if (carts.length > 0) {
        return carts[0].CartID;
    }
    const [result] = await db.query('INSERT INTO Cart (UserID) VALUES (?)', [userId]);
    return result.insertId;
};

// ==========================================
// 1. LẤY GIỎ HÀNG CỦA USER DANG ĐĂNG NHẬP
// ==========================================
exports.getCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const cartId = await getOrCreateCartId(userId);

        const query = `
            SELECT 
                ci.CartItemID,
                ci.ProductID,
                ci.FlavorID,
                ci.Quantity,
                ci.Price,
                p.ProductName,
                p.Image as ProductImage,
                pf.FlavorName,
                (ci.Quantity * ci.Price) AS SubTotal
            FROM CartItems ci
            JOIN Products p ON ci.ProductID = p.ProductID
            JOIN ProductFlavors pf ON ci.FlavorID = pf.FlavorID
            WHERE ci.CartID = ?
            ORDER BY ci.CartItemID DESC
        `;

        const [items] = await db.query(query, [cartId]);

        const totalAmount = items.reduce((sum, item) => sum + Number(item.SubTotal), 0);
        const totalItems = items.reduce((sum, item) => sum + item.Quantity, 0);

        return res.status(200).json({
            success: true,
            data: {
                cartId,
                items,
                totalItems,
                totalAmount
            }
        });
    } catch (error) {
        console.error('Lỗi getCart:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi lấy giỏ hàng!' });
    }
};

// ==========================================
// 2. THÊM SẢN PHẨM VÀO GIỎ HÀNG
// ==========================================
exports.addToCart = async (req, res) => {
    const { productId, flavorId, quantity, price } = req.body;
    const userId = req.user.userId;

    if (!productId || !flavorId || !quantity || quantity <= 0 || !price) {
        return res.status(400).json({ success: false, message: 'Thông tin sản phẩm không hợp lệ!' });
    }

    try {
        const cartId = await getOrCreateCartId(userId);

        // Kiểm tra xem sản phẩm + vị này đã có trong giỏ hàng chưa
        const [existingItems] = await db.query(
            'SELECT CartItemID, Quantity FROM CartItems WHERE CartID = ? AND ProductID = ? AND FlavorID = ?',
            [cartId, productId, flavorId]
        );

        if (existingItems.length > 0) {
            // Nếu đã có -> Cộng dồn số lượng
            const newQuantity = existingItems[0].Quantity + Number(quantity);
            await db.query(
                'UPDATE CartItems SET Quantity = ?, Price = ? WHERE CartItemID = ?',
                [newQuantity, price, existingItems[0].CartItemID]
            );
        } else {
            // Nếu chưa có -> Thêm dòng mới
            await db.query(
                'INSERT INTO CartItems (CartID, ProductID, FlavorID, Quantity, Price) VALUES (?, ?, ?, ?, ?)',
                [cartId, productId, flavorId, quantity, price]
            );
        }

        return res.status(200).json({ success: true, message: 'Thêm vào giỏ hàng thành công!' });
    } catch (error) {
        console.error('Lỗi addToCart:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi thêm sản phẩm vào giỏ hàng!' });
    }
};

// ==========================================
// 3. CẬP NHẬT SỐ LƯỢNG MỘT MÓN TRONG GIỎ HÀNG
// ==========================================
exports.updateCartItem = async (req, res) => {
    const { cartItemId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
        return res.status(400).json({ success: false, message: 'Số lượng phải lớn hơn 0!' });
    }

    try {
        await db.query('UPDATE CartItems SET Quantity = ? WHERE CartItemID = ?', [quantity, cartItemId]);
        return res.status(200).json({ success: true, message: 'Cập nhật số lượng thành công!' });
    } catch (error) {
        console.error('Lỗi updateCartItem:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật giỏ hàng!' });
    }
};

// ==========================================
// 4. XÓA 1 MÓN KHỎI GIỎ HÀNG
// ==========================================
exports.removeCartItem = async (req, res) => {
    const { cartItemId } = req.params;

    try {
        await db.query('DELETE FROM CartItems WHERE CartItemID = ?', [cartItemId]);
        return res.status(200).json({ success: true, message: 'Đã xóa sản phẩm khỏi giỏ hàng!' });
    } catch (error) {
        console.error('Lỗi removeCartItem:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi xóa sản phẩm!' });
    }
};

// ==========================================
// 5. XÓA SẠCH GIỎ HÀNG (CLEAR CART)
// ==========================================
exports.clearCart = async (req, res) => {
    const userId = req.user.userId;

    try {
        const cartId = await getOrCreateCartId(userId);
        await db.query('DELETE FROM CartItems WHERE CartID = ?', [cartId]);
        return res.status(200).json({ success: true, message: 'Đã làm trống giỏ hàng!' });
    } catch (error) {
        console.error('Lỗi clearCart:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server khi xóa giỏ hàng!' });
    }
};