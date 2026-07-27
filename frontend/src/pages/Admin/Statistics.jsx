// src/pages/Admin/Statistics.jsx
import React, { useState, useEffect } from "react";
import {
  FaCalendarAlt,
  FaCoins as FaCoinsIcon,
  FaShoppingBag as FaBagIcon,
  FaChartLine as FaLineIcon,
  FaAward as FaAwardIcon,
} from "react-icons/fa";

// Import các sub-component đã tách
import StatCard from "../../components/Admin/StatCard";
import DailyRevenueChart from "../../components/Admin/DailyRevenueChart";
import CategoryChart from "../../components/Admin/CategoryChart";
import CustomerStats from "../../components/Admin/CustomerStats";

import { getOrders } from "../../services/orderService";
import { getCustomers } from "../../services/adminCustomerService";

export default function Statistics() {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [stats, setStats] = useState({
    revenueThisMonth: 0,
    ordersThisMonth: 0,
    growthRate: 0,
    bestCategory: "Chưa có",
    bestCategoryQty: 0,
    totalCustomers: 0,
    vipCustomers: 0,
  });

  const [dailyData, setDailyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);

  const loadStatistics = () => {
    try {
      // 1. Lấy dữ liệu đơn hàng
      let orders = [];
      if (typeof getOrders === "function") {
        try { orders = getOrders(); } catch (e) {}
      }
      if (!Array.isArray(orders) || orders.length === 0) {
        orders = JSON.parse(localStorage.getItem("gymbro_orders") || "[]");
      }

      // 2. Lấy dữ liệu khách hàng
      let customers = [];
      if (typeof getCustomers === "function") {
        try { customers = getCustomers(); } catch (e) {}
      }
      if (!Array.isArray(customers) || customers.length === 0) {
        customers = JSON.parse(
          localStorage.getItem("admin_customers_data") ||
          localStorage.getItem("gymbro_users") ||
          "[]"
        );
      }

      // 3. Lấy kho sản phẩm mẫu để tra cứu tên Category nếu item thiếu thông tin
      const allProducts = JSON.parse(localStorage.getItem("gymstore_products") || "[]");

      let revThisMonth = 0;
      let countThisMonth = 0;
      let revLastMonth = 0;

      const lastMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
      const lastMonthYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;

      const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
      const dailyMap = {};
      for (let i = 1; i <= daysInMonth; i++) dailyMap[i] = 0;

      const categoryMap = {};

      orders.forEach((order) => {
        const dateStr = order.createdAt || order.date || order.updatedAt;
        if (!dateStr) return;

        let oDay, oMonth, oYear;

        // Xử lý chuỗi dạng "06:34 23/07/2026" hoặc "23/07/2026"
        if (typeof dateStr === "string" && dateStr.includes("/")) {
          const dateOnly = dateStr.trim().split(" ").pop(); // Lấy "23/07/2026"
          const parts = dateOnly.split("/");
          if (parts.length === 3) {
            oDay = parseInt(parts[0], 10);
            oMonth = parseInt(parts[1], 10);
            oYear = parseInt(parts[2], 10);
          }
        } else {
          // Trường hợp chuẩn ISO Date
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) {
            oDay = d.getDate();
            oMonth = d.getMonth() + 1;
            oYear = d.getFullYear();
          }
        }

        if (!oDay || !oMonth || !oYear) return;

        // Lấy giá trị tổng tiền
        const amount = Number(order.totalAmount || order.totalPrice || order.total || 0);

        // Đơn thuộc Tháng & Năm chọn trên UI
        if (oMonth === selectedMonth && oYear === selectedYear) {
          revThisMonth += amount;
          countThisMonth += 1;

          if (dailyMap[oDay] !== undefined) {
            dailyMap[oDay] += amount;
          }

          // Xử lý các mặt hàng trong đơn
          const items = order.items || order.cartItems || [];
          if (Array.isArray(items)) {
            items.forEach((item) => {
              // Tìm tên category trực tiếp hoặc tra cứu qua kho sản phẩm
              let catName = item.category || item.categoryName || item.product?.category;

              if (!catName || catName === "Khác") {
                const matchedProd = allProducts.find(
                  (p) => String(p.id) === String(item.id || item.productId)
                );
                if (matchedProd && matchedProd.category) {
                  catName = matchedProd.category;
                }
              }

              if (!catName) catName = "Khác";

              const qty = Number(item.quantity || item.qty || item.count || 1);
              const price = Number(item.price || item.unitPrice || 0);

              if (!categoryMap[catName]) {
                categoryMap[catName] = { name: catName, revenue: 0, count: 0 };
              }
              categoryMap[catName].revenue += price * qty;
              categoryMap[catName].count += qty;
            });
          }
        }

        // Đơn thuộc tháng trước
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

      // Lọc ra danh mục bán chạy nhất theo số lượng sản phẩm bán ra
      let topCat = "Chưa có";
      let topQty = 0;
      Object.values(categoryMap).forEach((cat) => {
        if (cat.count > topQty) {
          topQty = cat.count;
          topCat = cat.name;
        }
      });

      setStats({
        revenueThisMonth: revThisMonth,
        ordersThisMonth: countThisMonth,
        growthRate: growth.toFixed(1),
        bestCategory: topCat,
        bestCategoryQty: topQty,
        totalCustomers: customers.length,
        vipCustomers: customers.filter(
          (c) => c.isVip || c.role === "VIP" || Number(c.totalSpent || 0) >= 5000000
        ).length,
      });

      setDailyData(
        Object.keys(dailyMap).map((day) => ({
          day: `N${day}`,
          revenue: Number((dailyMap[day] / 1000000).toFixed(2)),
          rawRevenue: dailyMap[day],
        }))
      );

      setCategoryData(
        Object.values(categoryMap).map((c) => ({
          name: c.name,
          revenue: Number((c.revenue / 1000000).toFixed(2)),
          rawRevenue: c.revenue,
        }))
      );
    } catch (error) {
      console.error("Lỗi khi tải thống kê:", error);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, [selectedMonth, selectedYear]);

  const formatVND = (amount) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  const isPositiveGrowth = Number(stats.growthRate) >= 0;

  return (
    <div className="p-6 space-y-6 bg-[#f8fafc] min-h-screen font-sans text-slate-800">
      {/* 1. HEADER & BỘ LỌC THÁNG */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-[#14213D] tracking-tight">
            Tổng hợp doanh số tháng
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi doanh thu, số đơn hàng, danh mục bán chạy và mức chênh lệch giữa các tháng.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-[#14213D] text-white px-4 py-2 rounded-xl shadow-sm text-sm font-semibold">
          <FaCalendarAlt className="text-[#FCA311]" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-transparent text-white focus:outline-none cursor-pointer"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1} className="text-slate-800">
                Tháng {i + 1}
              </option>
            ))}
          </select>
          <span>/</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-transparent text-white focus:outline-none cursor-pointer"
          >
            {[2024, 2025, 2026, 2027].map((y) => (
              <option key={y} value={y} className="text-slate-800">
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Doanh thu tháng này"
          value={formatVND(stats.revenueThisMonth)}
          icon={<FaCoinsIcon className="text-2xl" />}
          color="text-[#FCA311]"
          bg="bg-[#FFF8EC]"
        />

        <StatCard
          title="Đơn bán tháng này"
          value={`${stats.ordersThisMonth} đơn`}
          icon={<FaBagIcon className="text-2xl" />}
          color="text-[#FCA311]"
          bg="bg-[#FFF8EC]"
        />

        <StatCard
          title="So với tháng trước"
          value={isPositiveGrowth ? `+${stats.growthRate}%` : `${stats.growthRate}%`}
          icon={<FaLineIcon className="text-2xl" />}
          color={isPositiveGrowth ? "text-emerald-600" : "text-rose-600"}
          bg={isPositiveGrowth ? "bg-emerald-50" : "bg-rose-50"}
        />

        <StatCard
          title="Danh mục bán chạy"
          value={
            <span className="line-clamp-1 text-2xl">
              {stats.bestCategory}{" "}
              {stats.bestCategoryQty > 0 && `(${stats.bestCategoryQty})`}
            </span>
          }
          icon={<FaAwardIcon className="text-2xl" />}
          color="text-[#FCA311]"
          bg="bg-[#FFF8EC]"
        />
      </div>

      {/* 3. BIỂU ĐỒ DOANH THU THEO NGÀY */}
      <DailyRevenueChart
        dailyData={dailyData}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        formatVND={formatVND}
      />

      {/* 4. HÀNG DƯỚI: DANH MỤC & THỐNG KÊ KHÁCH HÀNG */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CategoryChart categoryData={categoryData} formatVND={formatVND} />
        <CustomerStats
          totalCustomers={stats.totalCustomers}
          vipCustomers={stats.vipCustomers}
        />
      </div>
    </div>
  );
}