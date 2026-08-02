// controllers/adminActivityController.js
const db = require('../config/db');

// Lấy danh sách hoạt động của Admin
exports.getActivities = async (req, res) => {
  try {
    const [activities] = await db.query(`
      SELECT ActivityID AS id, Title AS title, Description AS description, 
             DATE_FORMAT(ActivityTime, '%d/%m/%Y %H:%i') AS time, IconType AS iconType 
      FROM AdminActivities 
      ORDER BY ActivityTime DESC 
      LIMIT 50
    `);
    return res.status(200).json({ success: true, activities });
  } catch (error) {
    console.error("Lỗi lấy lịch sử hoạt động:", error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// Thêm mới một hoạt động
exports.createActivity = async (req, res) => {
  try {
    const { adminId, title, description, iconType } = req.body;
    
    // Nếu chưa truyền adminId, có thể lấy mặc định admin đầu tiên trong bảng AdminUsers
    let currentAdminId = adminId;
    if (!currentAdminId) {
      const [admins] = await db.query('SELECT AdminID FROM AdminUsers LIMIT 1');
      if (admins.length > 0) {
        currentAdminId = admins[0].AdminID;
      } else {
        return res.status(400).json({ success: false, message: "Không tìm thấy tài khoản Admin nào trong hệ thống" });
      }
    }

    await db.query(
      `INSERT INTO AdminActivities (AdminID, Title, Description, IconType, ActivityTime) VALUES (?, ?, ?, ?, NOW())`,
      [currentAdminId, title, description, iconType || 'package']
    );

    return res.status(201).json({ success: true, message: "Ghi log thành công" });
  } catch (error) {
    console.error("Lỗi ghi log hoạt động:", error);
    return res.status(500).json({ success: false, message: "Lỗi server" });
  }
};