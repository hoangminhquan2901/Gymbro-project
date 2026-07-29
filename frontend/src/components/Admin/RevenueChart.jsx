import React, { useState, useEffect } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getOrders } from "../../services/orderService";

function RevenueChart() {
  const [chartData, setChartData] = useState([]);

  // Hàm hỗ trợ parse Ngày tháng linh hoạt
  const parseOrderMonth = (dateStr) => {
    if (!dateStr) return new Date().getMonth();

    const parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.getMonth();
    }

    if (typeof dateStr === "string") {
      const parts = dateStr.split(/[\/\-]/);
      if (parts.length >= 2) {
        const month = parseInt(parts[1], 10) - 1;
        if (!isNaN(month) && month >= 0 && month < 12) {
          return month;
        }
      }
    }

    return new Date().getMonth();
  };

  const buildMonthlyData = async () => {
    try {
      const rawOrders = typeof getOrders === "function" ? await getOrders() : [];
      const orders = Array.isArray(rawOrders) ? rawOrders : (rawOrders?.data || []);

      // Mảng 12 tháng
      const monthlyRevenue = Array.from({ length: 12 }, (_, index) => ({
        month: `T${index + 1}`,
        revenue: 0,
        rawRevenue: 0,
      }));

      orders.forEach((order) => {
        const dateStr = order.createdAt || order.date || order.orderDate || order.created_at;
        const monthIndex = parseOrderMonth(dateStr);
        
        const amount = Number(order.totalAmount || order.total || order.price || order.grandTotal || 0);

        if (monthIndex >= 0 && monthIndex < 12) {
          monthlyRevenue[monthIndex].rawRevenue += amount;
          monthlyRevenue[monthIndex].revenue = Number(
            (monthlyRevenue[monthIndex].rawRevenue / 1000000).toFixed(2)
          );
        }
      });

      setChartData(monthlyRevenue);
    } catch (error) {
      console.error("Lỗi khi tính toán dữ liệu biểu đồ doanh thu:", error);
    }
  };

  useEffect(() => {
    buildMonthlyData();

    window.addEventListener("ordersChanged", buildMonthlyData);
    window.addEventListener("storage", buildMonthlyData);

    return () => {
      window.removeEventListener("ordersChanged", buildMonthlyData);
      window.removeEventListener("storage", buildMonthlyData);
    };
  }, []);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const rawValue = payload[0].payload.rawRevenue;
      return (
        <div className="bg-[#14213D] text-white p-3 rounded-xl shadow-lg text-xs font-sans border border-slate-700">
          <p className="font-bold border-b border-slate-600 pb-1 mb-1">Tháng {label.replace("T", "")}</p>
          <p className="text-[#FCA311] font-semibold">
            Doanh thu: {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(rawValue)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#14213D]">
            Doanh thu theo tháng ({new Date().getFullYear()})
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Thống kê doanh thu thực tế phát sinh trong năm
          </p>
        </div>
      </div>

      <div className="h-[360px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 13 }} />
            <YAxis tick={{ fontSize: 13 }} unit="M" domain={[0, 200]} ticks={[0, 50, 100, 150, 200]} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#FCA311"
              strokeWidth={4}
              dot={{ r: 5, fill: "#FCA311" }}
              activeDot={{ r: 8 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default RevenueChart;