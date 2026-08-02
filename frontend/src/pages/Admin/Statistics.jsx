// src/pages/Admin/Statistics.jsx
import React, { useState, useEffect } from "react";
import {
  FaCalendarAlt,
  FaCoins as FaCoinsIcon,
  FaShoppingBag as FaBagIcon,
  FaChartLine as FaLineIcon,
  FaAward as FaAwardIcon,
} from "react-icons/fa";

import StatCard from "../../components/Admin/StatCard";
import DailyRevenueChart from "../../components/Admin/DailyRevenueChart";
import CategoryChart from "../../components/Admin/CategoryChart";
import CustomerStats from "../../components/Admin/CustomerStats";

import { fetchStatistics } from "../../services/statisticsService"; // Import service gọi API

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
    diamondCustomers: 0,
  });

  const [dailyData, setDailyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Gọi API lấy dữ liệu mỗi khi tháng hoặc năm thay đổi
  const loadData = async () => {
    setLoading(true);
    const data = await fetchStatistics(selectedMonth, selectedYear);
    if (data && data.success) {
      setStats(data.stats);
      setDailyData(data.dailyData);
      setCategoryData(data.categoryData);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
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
            Theo dõi doanh thu, số đơn hàng, danh mục bán chạy và mức chênh lệch giữa các tháng từ hệ thống.
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

      {/* Hiệu ứng đang tải */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 font-medium">Đang đồng bộ dữ liệu từ hệ thống...</div>
      ) : (
        <>
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
              diamondCustomers={stats.diamondCustomers}
            />
          </div>
        </>
      )}
    </div>
  );
}