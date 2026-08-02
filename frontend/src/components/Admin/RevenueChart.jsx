import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function RevenueChart({ monthlyData = [] }) {
  // Chuyển đổi mảng số liệu 12 tháng từ backend thành định dạng mà Recharts yêu cầu
  const chartData = Array.from({ length: 12 }, (_, index) => ({
    month: `T${index + 1}`,
    revenue: monthlyData[index] || 0,
  }));

  const formatVND = (value) => {
    if (value === 0) return "0đ";
    if (value >= 1e6) return `${(value / 1e6).toFixed(0)}tr`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
    return `${value}đ`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-[#14213d] text-base">Doanh thu theo tháng (2026)</h3>
          <p className="text-xs text-slate-400 mt-0.5">Thống kê doanh thu thực tế phát sinh trong năm</p>
        </div>
      </div>

      <div className="h-[280px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="55%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={formatVND} domain={[0, 500000000]} và ticks={[0, 100000000, 200000000, 300000000, 400000000, 500000000]} />
            <Tooltip
              formatter={(value) => [
                new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(value),
                "Doanh thu",
              ]}
              contentStyle={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0" }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#f59e0b"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorRevenue)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}