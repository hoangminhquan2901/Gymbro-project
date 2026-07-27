const db = require('../config/db');
const createSlug = require('../utils/slug');

// 1. Lấy danh sách tất cả thương hiệu
exports.getAllBrands = async (req, res) => {
    try {
        const sql = `
            SELECT 
                b.BrandID, 
                b.Name, 
                b.Slug, 
                b.Country, 
                b.Description, 
                b.Image, 
                b.Status, 
                b.CreatedAt, 
                b.UpdatedAt,
                COUNT(p.ProductID) AS ProductCount
            FROM Brands b
            LEFT JOIN Products p ON b.BrandID = p.BrandID
            GROUP BY b.BrandID
            ORDER BY b.CreatedAt DESC
        `;

        const [rows] = await db.query(sql);

        res.json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('Lỗi lấy danh sách thương hiệu:', error);
        res.status(500).json({ success: false, message: 'Lỗi server nội bộ' });
    }
};

// 2. Lấy chi tiết 1 thương hiệu theo BrandID
exports.getBrandById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM Brands WHERE BrandID = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thương hiệu!' });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Lỗi lấy chi tiết thương hiệu:', error);
        res.status(500).json({ success: false, message: 'Lỗi server nội bộ' });
    }
};

// 3. Thêm mới thương hiệu
exports.createBrand = async (req, res) => {
    const name = req.body.Name || req.body.name;
    const country = req.body.Country || req.body.country;
    const description = req.body.Description || req.body.description;
    const image = req.body.Image || req.body.image;
    const status = req.body.Status || req.body.status;

    if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Tên thương hiệu không được để trống!' });
    }

    const slug = createSlug(name);

    try {
        const [existing] = await db.query('SELECT BrandID FROM Brands WHERE Name = ? OR Slug = ?', [name.trim(), slug]);
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Thương hiệu "${name.trim()}" đã tồn tại trên hệ thống!`,
            });
        }

        const sql = `
            INSERT INTO Brands (Name, Slug, Country, Description, Image, ProductCount, Status) 
            VALUES (?, ?, ?, ?, ?, 0, ?)
        `;
        const [result] = await db.query(sql, [
            name.trim(), 
            slug, 
            country || 'Hoa Kỳ', 
            description || null, 
            image || null, 
            status || 'active'
        ]);

        return res.status(201).json({
            success: true,
            message: 'Thêm thương hiệu thành công!',
            brandId: result.insertId,
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
            return res.status(400).json({
                success: false,
                message: `Thương hiệu "${name}" đã tồn tại trên hệ thống!`,
            });
        }

        console.error('Lỗi server khi thêm thương hiệu:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống khi thêm thương hiệu.',
        });
    }
};

// 4. Cập nhật thương hiệu
exports.updateBrand = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [existingBrands] = await db.query('SELECT * FROM Brands WHERE BrandID = ?', [id]);
        if (existingBrands.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thương hiệu để cập nhật!' });
        }
        const oldBrand = existingBrands[0];

        const name = (req.body.name || req.body.Name || oldBrand.Name).trim();
        const country = req.body.country !== undefined ? req.body.country : (req.body.Country !== undefined ? req.body.Country : oldBrand.Country);
        const description = req.body.description !== undefined ? req.body.description : (req.body.Description !== undefined ? req.body.Description : oldBrand.Description);
        const image = req.body.image !== undefined ? req.body.image : (req.body.Image !== undefined ? req.body.Image : oldBrand.Image);
        const productCount = req.body.productCount !== undefined ? req.body.productCount : (req.body.ProductCount !== undefined ? req.body.ProductCount : oldBrand.ProductCount);
        const status = req.body.status || req.body.Status || oldBrand.Status;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Tên thương hiệu không được để trống!' });
        }

        const [duplicate] = await db.query('SELECT BrandID FROM Brands WHERE Name = ? AND BrandID != ?', [name, id]);
        if (duplicate.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Tên thương hiệu bị trùng với một thương hiệu khác đã tồn tại!',
            });
        }

        const slug = createSlug(name);

        const query = `
            UPDATE Brands 
            SET Name = ?, Slug = ?, Country = ?, Description = ?, Image = ?, ProductCount = ?, Status = ?
            WHERE BrandID = ?
        `;
        await db.query(query, [
            name, 
            slug, 
            country, 
            description, 
            image, 
            productCount, 
            status, 
            id
        ]);

        res.json({
            success: true,
            message: 'Cập nhật thương hiệu thành công!'
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
            return res.status(400).json({
                success: false,
                message: 'Tên thương hiệu cập nhật bị trùng với thương hiệu khác đã tồn tại!',
            });
        }
        console.error('Lỗi cập nhật thương hiệu:', error);
        res.status(500).json({ success: false, message: 'Lỗi server nội bộ' });
    }
};

// 5. Xóa thương hiệu
exports.deleteBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM Brands WHERE BrandID = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thương hiệu để xóa!' });
        }

        res.json({
            success: true,
            message: 'Xóa thương hiệu thành công!'
        });
    } catch (error) {
        console.error('Lỗi xóa thương hiệu:', error);
        res.status(500).json({ success: false, message: 'Lỗi server nội bộ' });
    }
};