import React from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

export default function DailyRevenueChart({ dailyData, selectedMonth, selectedYear, formatVND }) {
  // Hàm định dạng nhãn trục tung cho biểu đồ ngày (tính theo triệu)
  const formatYAxis = (value) => {
    if (value === 0) return "0đ";
    return `${value}tr`;
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-[#14213D]">
            Doanh thu theo ngày trong tháng {selectedMonth}/{selectedYear}
          </h2>
        </div>
      </div>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dailyData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748b" }} />
            
            {/* Cập nhật domain, ticks và tickFormatter cho YAxis */}
            <YAxis 
              tick={{ fontSize: 12, fill: "#64748b" }} 
              domain={[0, 50]} 
              ticks={[0, 10, 20, 30, 40, 50]} 
              tickFormatter={formatYAxis}
            />

            <Tooltip
              formatter={(val, name, item) => [formatVND(item.payload.rawRevenue), "Doanh thu"]}
              contentStyle={{ backgroundColor: "#14213D", borderRadius: "12px", color: "#fff", border: "none" }}
            />
            <Line type="monotone" dataKey="revenue" stroke="#FCA311" strokeWidth={3} dot={{ r: 4, fill: "#FCA311" }} activeDot={{ r: 7 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}