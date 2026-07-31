const db = require('../config/db');

exports.getDashboardStats = async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();

        const [
            revenueResult,
            orderCountResult,
            customerCountResult,
            productCountResult,
            monthlyResult,
            recentOrdersResult,
            topProductsResult
        ] = await Promise.all([
            db.query(`SELECT SUM(TotalAmount) / 10 AS totalRevenue FROM Orders`),
            db.query(`SELECT COUNT(*) AS totalOrders FROM Orders`),
            db.query(`SELECT COUNT(*) AS totalCustomers FROM Users WHERE Role = 'Customer'`),
            db.query(`SELECT COUNT(*) AS totalProducts FROM Products`),
            // Sửa lỗi ONLY_FULL_GROUP_BY bằng cách nhóm trực tiếp theo hàm MONTH(CreatedAt)
            db.query(`
                SELECT MONTH(CreatedAt) AS month, SUM(TotalAmount) / 10 AS revenue
                FROM Orders
                WHERE YEAR(CreatedAt) = ?
                GROUP BY MONTH(CreatedAt)
            `, [currentYear]),
            db.query(`
                SELECT OrderID as id, CustomerName as customerName, (TotalAmount / 10) as totalAmount, Status as status, CreatedAt as createdAt
                FROM Orders
                ORDER BY CreatedAt DESC
                LIMIT 4
            `),
            db.query(`
                SELECT od.ProductID as id, od.ProductName as name, SUM(od.Quantity) AS soldCount, SUM(od.Quantity * od.Price) / 10 AS totalRevenue
                FROM OrderDetails od
                JOIN Orders o ON od.OrderID = o.OrderID
                GROUP BY od.ProductID, od.ProductName
                ORDER BY soldCount DESC
                LIMIT 5
            `)
        ]);

        const totalRevenue = revenueResult[0]?.[0]?.totalRevenue || 0;
        const totalOrders = orderCountResult[0]?.[0]?.totalOrders || 0;
        const totalCustomers = customerCountResult[0]?.[0]?.totalCustomers || 0;
        const totalProducts = productCountResult[0]?.[0]?.totalProducts || 0;

        // Xây dựng mảng doanh thu 12 tháng chính xác
        const monthlyRevenue = Array(12).fill(0);
        if (monthlyResult && monthlyResult[0]) {
            monthlyResult[0].forEach(row => {
                const monthIndex = Number(row.month) - 1; // Tháng 8 tương ứng index 7
                if (monthIndex >= 0 && monthIndex < 12) {
                    monthlyRevenue[monthIndex] = Number(row.revenue) || 0;
                }
            });
        }

        const recentOrders = recentOrdersResult[0] || [];
        const topProducts = topProductsResult[0] || [];

        return res.status(200).json({
            success: true,
            data: {
                totalRevenue: Number(totalRevenue),
                totalOrders: Number(totalOrders),
                totalCustomers: Number(totalCustomers),
                totalProducts: Number(totalProducts),
                monthlyRevenue,
                recentOrders,
                topProducts
            }
        });
    } catch (error) {
        console.error('Lỗi API Dashboard:', error);
        return res.status(500).json({ success: false, message: 'Lỗi server thống kê dashboard', error: error.message });
    }
};