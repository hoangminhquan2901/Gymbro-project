import React from "react";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

export default function DailyRevenueChart({ dailyData, selectedMonth, selectedYear, formatVND }) {
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
            <YAxis tick={{ fontSize: 12, fill: "#64748b" }} unit="M" domain={[0, 5]} ticks={[0, 1, 2, 3, 4 ,5]} />
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