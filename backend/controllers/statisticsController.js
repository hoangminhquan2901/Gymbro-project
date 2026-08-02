// controllers/statisticsController.js
const db = require('../config/db');

exports.getStatistics = async (req, res) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();

    // 1. Lấy tất cả đơn hàng từ MySQL
    const [orders] = await db.query('SELECT * FROM Orders');
    
    // 2. Lấy danh sách khách hàng từ MySQL
    const [customers] = await db.query('SELECT * FROM Customers');

    // 3. Lấy chi tiết sản phẩm JOIN với Products và Categories để lấy đúng tên danh mục
    const [orderDetails] = await db.query(`
      SELECT od.*, p.CategoryID, c.Name AS CategoryName 
      FROM OrderDetails od 
      LEFT JOIN Products p ON od.ProductID = p.ProductID
      LEFT JOIN Categories c ON p.CategoryID = c.CategoryID
    `);

    // Gom nhóm OrderDetails theo OrderID
    const orderItemsMap = {};
    orderDetails.forEach((item) => {
      if (!orderItemsMap[item.OrderID]) {
        orderItemsMap[item.OrderID] = [];
      }
      orderItemsMap[item.OrderID].push(item);
    });

    let revThisMonth = 0;
    let countThisMonth = 0;
    let revLastMonth = 0;

    const lastMonth = month === 1 ? 12 : month - 1;
    const lastMonthYear = month === 1 ? year - 1 : year;

    // Số ngày trong tháng được chọn
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyMap = {};
    for (let i = 1; i <= daysInMonth; i++) dailyMap[i] = 0;

    const categoryMap = {};

    orders.forEach((order) => {
      const dateStr = order.CreatedAt;
      if (!dateStr) return;

      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;

      const oDay = d.getDate();
      const oMonth = d.getMonth() + 1;
      const oYear = d.getFullYear();

      // Chia 10 để khớp với thực tế dữ liệu của bạn
      const amount = Number(order.TotalAmount || 0) / 10;

      // Đơn thuộc tháng & năm đang chọn
      if (oMonth === month && oYear === year) {
        revThisMonth += amount;
        countThisMonth += 1;

        if (dailyMap[oDay] !== undefined) {
          dailyMap[oDay] += amount;
        }

        // Xử lý danh mục sản phẩm trong đơn
        const items = orderItemsMap[order.OrderID] || [];
        items.forEach((item) => {
          // Lấy đúng tên danh mục từ bảng Categories (fallback về "Khác" nếu không có)
          let catName = item.CategoryName || "Khác";
          const qty = Number(item.Quantity || 1);
          const price = (Number(item.Price || 0)) / 10; // Chia 10 giá sản phẩm

          if (!categoryMap[catName]) {
            categoryMap[catName] = { name: catName, revenue: 0, count: 0 };
          }
          categoryMap[catName].revenue += price * qty;
          categoryMap[catName].count += qty;
        });
      }

      // Đơn thuộc tháng trước (để tính tăng trưởng)
      if (oMonth === lastMonth && oYear === lastMonthYear) {
        revLastMonth += amount;
      }
    });

    // Tính % tăng trưởng
    let growth = 0;
    if (revLastMonth > 0) {
      growth = ((revThisMonth - revLastMonth) / revLastMonth) * 100;
    } else if (revThisMonth > 0) {
      growth = 100;
    }

    // Tìm danh mục bán chạy nhất
    let topCat = "Chưa có";
    let topQty = 0;
    Object.values(categoryMap).forEach((cat) => {
      if (cat.count > topQty) {
        topQty = cat.count;
        topCat = cat.name;
      }
    });

    // Thống kê khách hàng VIP
    const vipCount = customers.filter(
      (c) => c.Tier === 'Diamond' 
    ).length;

    // Chuẩn hóa dữ liệu biểu đồ theo ngày (đổi sang đơn vị Triệu VND)
    const dailyData = Object.keys(dailyMap).map((day) => ({
      day: `N${day}`,
      revenue: Number((dailyMap[day] / 1000000).toFixed(2)),
      rawRevenue: dailyMap[day],
    }));

    // Chuẩn hóa dữ liệu biểu đồ danh mục
    const categoryData = Object.values(categoryMap).map((c) => ({
      name: c.name,
      revenue: Number((c.revenue / 1000000).toFixed(2)),
      rawRevenue: c.revenue,
    }));

    return res.status(200).json({
      success: true,
      stats: {
        revenueThisMonth: revThisMonth,
        ordersThisMonth: countThisMonth,
        growthRate: growth.toFixed(1),
        bestCategory: topCat,
        bestCategoryQty: topQty,
        totalCustomers: customers.length,
        diamondCustomers: vipCount,
      },
      dailyData,
      categoryData,
    });
  } catch (error) {
    console.error("Lỗi API thống kê:", error);
    return res.status(500).json({ success: false, message: "Lỗi server khi lấy dữ liệu thống kê" });
  }
};