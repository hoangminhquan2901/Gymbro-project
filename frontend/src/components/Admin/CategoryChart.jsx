import React from "react";
import { ResponsiveContainer, BarChart, Bar, CartesianGrid, Tooltip, XAxis, YAxis } from "recharts";

export default function CategoryChart({ categoryData, formatVND }) {
  return (
    <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
      <h2 className="text-lg font-bold text-[#14213D] mb-4 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-full bg-[#14213D]"></span>
        Doanh thu theo danh mục
      </h2>

      <div className="h-[260px]">
        {categoryData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            Chưa có dữ liệu danh mục trong tháng này
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#64748b" }} />
              <YAxis tick={{ fontSize: 12, fill: "#64748b" }} unit="M" />
              <Tooltip
                formatter={(val, name, item) => [formatVND(item.payload.rawRevenue), "Doanh thu"]}
                contentStyle={{ backgroundColor: "#14213D", borderRadius: "12px", color: "#fff" }}
              />
              <Bar dataKey="revenue" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}