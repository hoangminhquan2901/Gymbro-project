import React, { useState, useEffect } from "react";
import StatCard from "../../components/Admin/StatCard";
import RevenueChart from "../../components/Admin/RevenueChart";
import RecentOrders from "../../components/Admin/RecentOrders";

// Import các Icon từ react-icons (FontAwesome)
import { FaDollarSign, FaShoppingCart, FaUsers, FaTags } from "react-icons/fa";

// Import các hàm lấy dữ liệu từ Services
import { getAllProducts } from "../../services/adminProductService"; 
import { getCustomers } from "../../services/adminCustomerService";
import { getOrders } from "../../services/orderService";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
  });

  const [topProducts, setTopProducts] = useState([]);

  // Chuyển hàm thành async để chờ API/Database trả về dữ liệu
  const loadDashboardData = async () => {
    try {
      // 1. Lấy danh sách sản phẩm
      const rawProducts = typeof getAllProducts === "function" ? await getAllProducts() : [];
      const products = Array.isArray(rawProducts) ? rawProducts : (rawProducts?.data || []);

      // 2. Lấy đơn hàng & Tính tổng doanh thu
      const rawOrders = typeof getOrders === "function" ? await getOrders() : [];
      const orders = Array.isArray(rawOrders) ? rawOrders : (rawOrders?.data || []);
      const totalOrdersCount = orders.length;

      const totalRevenueSum = orders.reduce((sum, order) => {
        return sum + Number(order.totalAmount || order.total || order.price || 0);
      }, 0);

      // 3. Lấy danh sách khách hàng
      const rawCustomers = typeof getCustomers === "function" ? await getCustomers() : [];
      const customers = Array.isArray(rawCustomers) ? rawCustomers : (rawCustomers?.data || []);

      // Cập nhật các thẻ KPI
      setStats({
        totalRevenue: totalRevenueSum,
        totalOrders: totalOrdersCount,
        totalCustomers: customers.length,
        totalProducts: products.length,
      });

      // 4. Top 5 sản phẩm bán chạy
      const salesMap = {};
      orders.forEach((order) => {
        const items = order.items || order.cartItems || order.products || [];
        if (Array.isArray(items)) {
          items.forEach((item) => {
            const pId = item.productId || item.id || item.name;
            const pName = item.name || "Sản phẩm";
            const qty = Number(item.quantity || item.qty || 1);
            const itemPrice = Number(item.price || 0);

            if (!salesMap[pId]) {
              salesMap[pId] = {
                id: pId,
                name: pName,
                soldCount: 0,
                totalRevenue: 0,
              };
            }
            salesMap[pId].soldCount += qty;
            salesMap[pId].totalRevenue += itemPrice * qty;
          });
        }
      });

      const sortedTopProducts = Object.values(salesMap)
        .sort((a, b) => b.soldCount - a.soldCount)
        .slice(0, 5);

      setTopProducts(sortedTopProducts);
    } catch (error) {
      console.error("Lỗi đồng bộ Dashboard:", error);
    }
  };

  useEffect(() => {
    loadDashboardData();

    window.addEventListener("productsChanged", loadDashboardData);
    window.addEventListener("storage", loadDashboardData);
    window.addEventListener("ordersChanged", loadDashboardData);

    return () => {
      window.removeEventListener("productsChanged", loadDashboardData);
      window.removeEventListener("storage", loadDashboardData);
      window.removeEventListener("ordersChanged", loadDashboardData);
    };
  }, []);

  const formatVND = (amount) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-screen font-sans">
      {/* Header */}
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
        <RevenueChart />
      </div>

      {/* Bố cục bên dưới */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
          <RecentOrders limit={4} />
        </div>

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