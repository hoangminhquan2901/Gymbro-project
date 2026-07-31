import React from "react";
import { Eye, ShoppingBag, UserCheck, ChevronLeft, ChevronRight } from "lucide-react";

export default function CustomerTable({ 
  customers, 
  onViewDetail, 
  onToggleStatus,
  currentPage,
  totalPages,
  totalItems,
  limit,
  onPageChange
}) {
  const registeredCustomers = (customers || []).filter(
    (cus) => !cus.role || ["CUSTOMER", "USER", "KHÁCH HÀNG"].includes(cus.role.toUpperCase())
  );

  const checkIsActive = (cus) => {
    const val = cus.isActive !== undefined ? cus.isActive : cus.status;
    if (val === 1 || val === true || val === "1") return true;
    if (val === 0 || val === false || val === "0") return false;
    
    const statusStr = String(val || "").toLowerCase();
    return statusStr === "hoạt động" || statusStr === "active" || statusStr === "true";
  };

  // Tạo mảng danh sách các số trang hiển thị
  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="py-4 px-6">Khách hàng</th>
              <th className="py-4 px-6">Thông tin liên hệ</th>
              <th className="py-4 px-6">Cấp độ</th>
              <th className="py-4 px-6">Đơn hàng</th>
              <th className="py-4 px-6">Tổng chi tiêu</th>
              <th className="py-4 px-6">Đơn hàng cuối</th>
              <th className="py-4 px-6">Trạng thái</th>
              <th className="py-4 px-6 text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm">
            {registeredCustomers.length > 0 ? (
              registeredCustomers.map((cus) => {
                const isActive = checkIsActive(cus);
                const displayName = cus.name || cus.fullName || cus.username || "Khách hàng";
                const displayPhone = cus.phone || cus.phoneNumber || "Chưa cập nhật";
                const displayId = cus.id || cus._id || "N/A";
                const totalOrders = Number(cus.totalOrders || 0);
                const totalSpent = Number(cus.totalSpent || 0);

                return (
                  <tr key={displayId} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-[#0B132B] transition-colors flex items-center gap-1.5">
                            {displayName}
                            {totalOrders === 0 && (
                              <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-normal border border-blue-100">
                                Mới đăng ký
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400 font-mono">{displayId}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <p className="text-gray-800 font-medium">{cus.email || "N/A"}</p>
                      <p className="text-xs text-gray-400">{displayPhone}</p>
                    </td>

                    <td className="py-4 px-6">
                      <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-emerald-100 text-emerald-700 border border-emerald-200/60">
                        {cus.tier || "Bronze"}
                      </span>
                    </td>

                    <td className="py-4 px-6 font-semibold text-gray-700">
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag size={14} className="text-gray-400" />
                        <span>{totalOrders}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6 font-bold text-emerald-600">
                      {totalSpent.toLocaleString("vi-VN")}đ
                    </td>

                    <td className="py-4 px-6 text-gray-500 text-xs">
                      {cus.lastOrderDate ? cus.lastOrderDate : <span className="text-gray-400 italic">Chưa mua hàng</span>}
                    </td>

                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                        isActive ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" : "bg-red-50 text-red-700 border border-red-200/50"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                        {isActive ? "Hoạt động" : "Tạm khóa"}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onViewDetail(cus)}
                          title="Xem chi tiết"
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer"
                        >
                          <Eye size={18} />
                        </button>
                        <select
                          value={isActive ? "1" : "0"}
                          onChange={(e) => onToggleStatus && onToggleStatus(displayId, Number(e.target.value))}
                          className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#0B132B]/20 cursor-pointer shadow-xs"
                        >
                          <option value="1">Hoạt động</option>
                          <option value="0">Tạm khóa</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" className="text-center py-12 text-gray-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <UserCheck size={36} className="text-gray-300" />
                    <p className="text-sm font-medium">Không tìm thấy khách hàng nào.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Thanh Phân Trang Offset-Based (Số trang) */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30 gap-4">
        <div className="text-xs text-gray-500">
          Hiển thị từ <span className="font-semibold text-gray-700">{totalItems === 0 ? 0 : (currentPage - 1) * limit + 1}</span> đến{" "}
          <span className="font-semibold text-gray-700">{Math.min(currentPage * limit, totalItems)}</span> trong tổng số{" "}
          <span className="font-semibold text-gray-700">{totalItems}</span> khách hàng
        </div>

        <div className="flex items-center gap-1.5">
          {/* Nút Trước */}
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
          >
            <ChevronLeft size={14} /> Trước
          </button>

          {/* Các nút số trang */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((num) => (
              <button
                key={num}
                onClick={() => onPageChange(num)}
                className={`w-8 h-8 text-xs font-semibold rounded-lg transition-colors ${
                  currentPage === num
                    ? "bg-[#0B132B] text-white shadow-xs"
                    : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          {/* Nút Sau */}
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || totalPages === 0}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
          >
            Sau <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}