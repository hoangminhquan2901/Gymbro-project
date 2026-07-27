const db = require('../config/db');
const createSlug = require('../utils/slug');

// 1. Lấy danh sách tất cả danh mục
exports.getAllCategories = async (req, res) => {
    try {
        const sql = `
            SELECT 
                c.CategoryID, 
                c.Name, 
                c.Slug, 
                c.ParentCategoryID, 
                c.Description, 
                c.Image, 
                c.CreatedAt, 
                c.UpdatedAt,
                COUNT(DISTINCT p.ProductID) AS ProductCount
            FROM Categories c
            LEFT JOIN Products p 
                ON p.CategoryID = c.CategoryID 
                OR p.SubCategoryID = c.CategoryID
            GROUP BY c.CategoryID
            ORDER BY c.CreatedAt DESC
        `;

        const [rows] = await db.query(sql);

        res.json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('Lỗi lấy danh sách danh mục:', error);
        res.status(500).json({ success: false, message: 'Lỗi server nội bộ' });
    }
};

// 2. Lấy chi tiết 1 danh mục theo CategoryID
exports.getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM Categories WHERE CategoryID = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục!' });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Lỗi lấy chi tiết danh mục:', error);
        res.status(500).json({ success: false, message: 'Lỗi server nội bộ' });
    }
};

// 3. Thêm mới danh mục
exports.createCategory = async (req, res) => {
    try {
        const Name = (req.body.Name || req.body.name || "").trim();
        const Slug = req.body.Slug || req.body.slug || createSlug(Name);
        const Description = req.body.Description ?? req.body.description ?? null;
        const Image = req.body.Image ?? req.body.image ?? null;
        
        let ParentCategoryID = req.body.ParentCategoryID ?? req.body.parentCategoryId ?? req.body.parent ?? null;
        if (ParentCategoryID === "Gốc" || ParentCategoryID === "goc" || !ParentCategoryID) {
            ParentCategoryID = null;
        } else {
            ParentCategoryID = Number(ParentCategoryID);
        }

        if (!Name) {
            return res.status(400).json({
                success: false,
                message: "Tên danh mục không được để trống!",
            });
        }

        const sql = `
            INSERT INTO Categories (Name, Slug, Description, Image, ParentCategoryID) 
            VALUES (?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(sql, [Name, Slug, Description, Image, ParentCategoryID]);

        return res.status(201).json({
            success: true,
            message: "Thêm danh mục thành công!",
            data: {
                CategoryID: result.insertId,
                Name,
                Slug,
                Description,
                Image,
                ParentCategoryID,
            },
        });
    } catch (error) {
        console.error("Lỗi khi thêm danh mục:", error);

        // Bắt lỗi trùng Tên / Slug (MySQL error code 1062)
        if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
            return res.status(400).json({
                success: false,
                message: "Tên hoặc Slug danh mục này đã tồn tại!",
            });
        }

        return res.status(500).json({
            success: false,
            message: "Lỗi hệ thống khi thêm danh mục.",
        });
    }
};

// 4. Cập nhật danh mục
exports.updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Kiểm tra tồn tại
        const [existingCategories] = await db.query('SELECT * FROM Categories WHERE CategoryID = ?', [id]);
        if (existingCategories.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục để cập nhật!' });
        }
        const oldCategory = existingCategories[0];

        // Lấy dữ liệu mới
        const name = (req.body.name || req.body.Name || oldCategory.Name).trim();
        const description = req.body.description !== undefined ? req.body.description : (req.body.Description !== undefined ? req.body.Description : oldCategory.Description);
        const image = req.body.image !== undefined ? req.body.image : (req.body.Image !== undefined ? req.body.Image : oldCategory.Image);
        
        // XỬ LÝ CHUẨN PARENTCATEGORYID (Cho phép nhận NULL để làm danh mục gốc)
        let parentCategoryID;
        
        const rawParent = 'ParentCategoryID' in req.body 
            ? req.body.ParentCategoryID 
            : ('parentCategoryId' in req.body 
                ? req.body.parentCategoryId 
                : ('parent' in req.body ? req.body.parent : oldCategory.ParentCategoryID));

        if (rawParent === null || rawParent === "Gốc" || rawParent === "goc" || rawParent === "" || rawParent === 0 || rawParent === "0") {
            parentCategoryID = null;
        } else {
            parentCategoryID = Number(rawParent);
        }

        if (!name) {
            return res.status(400).json({ success: false, message: 'Tên danh mục không được để trống!' });
        }

        const slug = createSlug(name);

        const query = `
            UPDATE Categories 
            SET Name = ?, Slug = ?, Description = ?, Image = ?, ParentCategoryID = ?
            WHERE CategoryID = ?
        `;
        await db.query(query, [
            name, 
            slug, 
            description, 
            image, 
            parentCategoryID, 
            id
        ]);

        res.json({
            success: true,
            message: 'Cập nhật danh mục thành công!'
        });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY' || error.errno === 1062) {
            return res.status(400).json({
                success: false,
                message: 'Tên danh mục bị trùng với danh mục khác đã tồn tại!',
            });
        }
        console.error('Lỗi cập nhật danh mục:', error);
        res.status(500).json({ success: false, message: 'Lỗi server nội bộ' });
    }
};

// 5. Xóa danh mục
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [result] = await db.query('DELETE FROM Categories WHERE CategoryID = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy danh mục để xóa!' 
            });
        }

        return res.json({
            success: true,
            message: 'Xóa danh mục thành công!'
        });

    } catch (error) {
        console.error('Lỗi xóa danh mục:', error);

        // Bắt lỗi ràng buộc khóa ngoại từ MySQL (Mã 1451)
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa! Danh mục này đang chứa sản phẩm hoặc có liên kết dữ liệu quan trọng.'
            });
        }

        return res.status(500).json({ 
            success: false, 
            message: 'Lỗi server nội bộ' 
        });
    }
};