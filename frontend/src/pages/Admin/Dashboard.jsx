import React, { useState, useEffect } from "react";
import StatCard from "../../components/Admin/StatCard";
import RevenueChart from "../../components/Admin/RevenueChart";
import RecentOrders from "../../components/Admin/RecentOrders";
import { FaDollarSign, FaShoppingCart, FaUsers, FaTags } from "react-icons/fa";
import axiosClient from "../../services/axiosClient"; // Đảm bảo đường dẫn tới file axios của bạn là chính xác

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
  });

  const [orders, setOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [monthlyRevenueData, setMonthlyRevenueData] = useState(Array(12).fill(0));

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        // Gọi đến /admin/dashboard-stats (đã được nối với baseURL /api thành /api/admin/dashboard-stats)
        const response = await axiosClient.get("/admin/dashboard-stats");
        const result = response.data;

        if (!isMounted) return;

        if (result && result.success) {
          const data = result.data;
          
          setStats({
            totalRevenue: data.totalRevenue || 0,
            totalOrders: data.totalOrders || 0,
            totalCustomers: data.totalCustomers || 0,
            totalProducts: data.totalProducts || 0,
          });

          setOrders(data.recentOrders || []);
          setMonthlyRevenueData(data.monthlyRevenue || Array(12).fill(0));
          setTopProducts(data.topProducts || []);
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu Dashboard:", error);
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const formatVND = (amount) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen font-sans">
      <div>
        <h1 className="text-2xl font-bold text-[#14213d] tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Tổng quan hiệu suất kinh doanh và các chỉ số hoạt động chính
        </p>
      </div>

      {/* 4 Thẻ KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Tổng doanh thu"
          value={formatVND(stats.totalRevenue)}
          icon={<FaDollarSign className="text-xl" />}
        />
        <StatCard
          title="Đơn hàng"
          value={stats.totalOrders.toLocaleString("vi-VN")}
          icon={<FaShoppingCart className="text-xl" />}
        />
        <StatCard
          title="Khách hàng"
          value={stats.totalCustomers.toLocaleString("vi-VN")}
          icon={<FaUsers className="text-xl" />}
        />
        <StatCard
          title="Sản phẩm"
          value={stats.totalProducts.toLocaleString("vi-VN")}
          icon={<FaTags className="text-xl" />}
        />
      </div>

      {/* Biểu đồ Doanh thu */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
        <RevenueChart monthlyData={monthlyRevenueData} />
      </div>

      {/* Bố cục bên dưới */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
          <RecentOrders orders={orders} limit={4} />
        </div>

        {/* Top 5 Sản phẩm Bán chạy */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="font-bold text-[#14213d] text-base flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#14213d]"></span>
                Top 5 Sản phẩm Bán chạy
              </h3>
            </div>

            <div className="mt-4 space-y-3 divide-y divide-slate-100">
              {topProducts.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">Chưa có dữ liệu bán hàng</p>
              ) : (
                topProducts.map((product, index) => (
                  <div
                    key={product.id || index}
                    className={`flex items-center justify-between transition-colors rounded-lg ${
                      index !== 0 ? "pt-3" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#14213d] flex items-center justify-center font-bold text-xs">
                        #{index + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800 line-clamp-1">
                          {product.name}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Đã bán: <span className="font-medium text-slate-600">{product.soldCount} sản phẩm</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-bold text-[#14213d]">
                        {formatVND(product.totalRevenue)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}