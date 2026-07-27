import React from "react";
import { FaUsers, FaCrown } from "react-icons/fa";

export default function CustomerStats({ totalCustomers, vipCustomers }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
      <div>
        <h2 className="text-lg font-bold text-[#14213D] pb-3 border-b border-slate-100 flex items-center gap-2">
          <FaUsers className="text-[#14213D]" />
          Thống kê khách hàng
        </h2>

        <div className="grid grid-cols-1 gap-6 mt-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl">
              <FaUsers />
            </div>
            <div>
              <h4 className="text-3xl font-extrabold text-[#14213D]">{totalCustomers.toLocaleString("vi-VN")}</h4>
              <p className="text-xs font-semibold text-slate-400 mt-1">Tổng khách hàng</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center text-xl">
              <FaCrown />
            </div>
            <div>
              <h4 className="text-3xl font-extrabold text-amber-600">{vipCustomers.toLocaleString("vi-VN")}</h4>
              <p className="text-xs font-semibold text-amber-700/70 mt-1">Khách VIP</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center mt-6 pt-3 border-t border-slate-100">
        Dữ liệu đồng bộ trực tiếp từ hệ thống quản lý người dùng
      </p>
    </div>
  );
}