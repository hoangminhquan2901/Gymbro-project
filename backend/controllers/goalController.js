const db = require('../config/db');
const createSlug = require('../utils/slug');

// 1. Lấy danh sách tất cả mục tiêu
exports.getAllGoals = async (req, res) => {
    try {
        const sql = `
            SELECT 
                g.GoalID, 
                g.Name, 
                g.Slug, 
                g.Description, 
                g.Image, 
                g.CreatedAt, 
                g.UpdatedAt,
                COUNT(DISTINCT pg.ProductID) AS productCount
            FROM Goals g
            LEFT JOIN ProductGoals pg ON g.GoalID = pg.GoalID
            GROUP BY g.GoalID
            ORDER BY g.CreatedAt ASC
        `;

        const [rows] = await db.query(sql);

        res.json({
            success: true,
            count: rows.length,
            data: rows
        });
    } catch (error) {
        console.error('Lỗi lấy danh sách mục tiêu:', error);
        res.status(500).json({ success: false, message: 'Lỗi server nội bộ' });
    }
};

// 2. Lấy chi tiết 1 mục tiêu theo GoalID
exports.getGoalById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query('SELECT * FROM Goals WHERE GoalID = ?', [id]);

        if (rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy mục tiêu!' });
        }

        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Lỗi lấy chi tiết mục tiêu:', error);
        res.status(500).json({ success: false, message: 'Lỗi server nội bộ' });
    }
};

// 3. Thêm mới mục tiêu
exports.createGoal = async (req, res) => {
    try {
        const rawName = req.body.Name || req.body.name || '';
        const rawDesc = req.body.Description ?? req.body.description ?? '';
        const rawImg = req.body.Image ?? req.body.image ?? '';

        const name = rawName.trim();
        const slug = req.body.Slug || req.body.slug || createSlug(name);
        const description = rawDesc.trim() ? rawDesc.trim() : null;
        const image = rawImg.trim() ? rawImg.trim() : null;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Tên mục tiêu không được để trống!' });
        }

        const [existing] = await db.query('SELECT GoalID FROM Goals WHERE Name = ? OR Slug = ?', [name, slug]);
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Mục tiêu "${name}" hoặc Slug đã tồn tại!`,
            });
        }

        const sql = `
            INSERT INTO Goals (Name, Slug, Description, Image) 
            VALUES (?, ?, ?, ?)
        `;
        const [result] = await db.query(sql, [name, slug, description, image]);

        return res.status(201).json({
            success: true,
            message: 'Thêm mục tiêu thành công!',
            data: {
                GoalID: result.insertId,
                Name: name,
                Slug: slug,
                Description: description,
                Image: image
            }
        });

    } catch (error) {
        console.error('Lỗi server khi thêm mục tiêu:', error);
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống khi thêm mục tiêu.' });
    }
};

// 4. Cập nhật mục tiêu
exports.updateGoal = async (req, res) => {
    try {
        const { id } = req.params;

        const [existingGoals] = await db.query('SELECT * FROM Goals WHERE GoalID = ?', [id]);
        if (existingGoals.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy mục tiêu!' });
        }
        const oldGoal = existingGoals[0];

        const rawName = req.body.name || req.body.Name || oldGoal.Name;
        const name = rawName.trim();
        const slug = createSlug(name);

        const rawDesc = req.body.description !== undefined ? req.body.description : req.body.Description;
        const description = (rawDesc !== undefined && rawDesc !== null && rawDesc.trim() !== '') 
            ? rawDesc.trim() 
            : null;

        const rawImg = req.body.image !== undefined ? req.body.image : req.body.Image;
        const image = (rawImg !== undefined && rawImg !== null && rawImg.trim() !== '') 
            ? rawImg.trim() 
            : null;

        if (!name) {
            return res.status(400).json({ success: false, message: 'Tên mục tiêu không được để trống!' });
        }

        const [duplicate] = await db.query(
            'SELECT GoalID FROM Goals WHERE (Name = ? OR Slug = ?) AND GoalID != ?', 
            [name, slug, id]
        );
        if (duplicate.length > 0) {
            return res.status(400).json({ success: false, message: `Mục tiêu "${name}" hoặc Slug đã tồn tại!` });
        }

        const query = `
            UPDATE Goals 
            SET Name = ?, Slug = ?, Description = ?, Image = ?
            WHERE GoalID = ?
        `;
        await db.query(query, [name, slug, description, image, id]);

        return res.json({
            success: true,
            message: 'Cập nhật mục tiêu thành công!'
        });

    } catch (error) {
        console.error('Lỗi server khi cập nhật mục tiêu:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server nội bộ' });
    }
};

// 5. Xóa mục tiêu
exports.deleteGoal = async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM Goals WHERE GoalID = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy mục tiêu để xóa!' });
        }

        res.json({
            success: true,
            message: 'Xóa mục tiêu thành công!'
        });
    } catch (error) {
        console.error('Lỗi xóa mục tiêu:', error);
        if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa! Mục tiêu này đang chứa sản phẩm liên kết.'
            });
        }
        res.status(500).json({ success: false, message: 'Lỗi server nội bộ' });
    }
};