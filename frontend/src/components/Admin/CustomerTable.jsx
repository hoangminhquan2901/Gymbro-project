import React from "react";
import { Eye, ShoppingBag, UserCheck } from "lucide-react";

export default function CustomerTable({ customers, onViewDetail, onToggleStatus }) {
  // Lọc chỉ lấy những người dùng là Khách hàng (Role CUSTOMER / USER hoặc không khai báo)
  const registeredCustomers = (customers || []).filter(
    (cus) => !cus.role || ["CUSTOMER", "USER", "KHÁCH HÀNG"].includes(cus.role.toUpperCase())
  );

  const getTierBadge = (tier) => {
    switch (tier?.toUpperCase()) {
      case "VIP":
        return "bg-purple-100 text-purple-700 border border-purple-200/60";
      case "GOLD":
        return "bg-amber-100 text-amber-700 border border-amber-200/60";
      case "SILVER":
        return "bg-blue-100 text-blue-700 border border-blue-200/60";
      default:
        return "bg-emerald-100 text-emerald-700 border border-emerald-200/60";
    }
  };

  // Cập nhật hàm kiểm tra IsActive hỗ trợ cả kiểu Number (1/0) từ MySQL
  const checkIsActive = (cus) => {
    const val = cus.isActive !== undefined ? cus.isActive : cus.status;
    if (val === 1 || val === true || val === "1") return true;
    if (val === 0 || val === false || val === "0") return false;
    
    const statusStr = String(val || "").toLowerCase();
    return statusStr === "hoạt động" || statusStr === "active" || statusStr === "true";
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
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
                    {/* Thông tin khách hàng */}
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

                    {/* Liên hệ */}
                    <td className="py-4 px-6">
                      <p className="text-gray-800 font-medium">{cus.email || "N/A"}</p>
                      <p className="text-xs text-gray-400">{displayPhone}</p>
                    </td>

                    {/* Cấp độ */}
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${getTierBadge(cus.tier)}`}>
                        {cus.tier || "Bronze"}
                      </span>
                    </td>

                    {/* Số lượng đơn hàng */}
                    <td className="py-4 px-6 font-semibold text-gray-700">
                      <div className="flex items-center gap-1.5">
                        <ShoppingBag size={14} className="text-gray-400" />
                        <span>{totalOrders}</span>
                      </div>
                    </td>

                    {/* Tổng chi tiêu */}
                    <td className="py-4 px-6 font-bold text-emerald-600">
                      {totalSpent.toLocaleString("vi-VN")}đ
                    </td>

                    {/* Đơn hàng cuối / Ngày đăng ký */}
                    <td className="py-4 px-6 text-gray-500 text-xs">
                      {cus.lastOrderDate ? (
                        cus.lastOrderDate
                      ) : (
                        <span className="text-gray-400 italic">Chưa mua hàng</span>
                      )}
                    </td>

                    {/* Trạng thái */}
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
                            : "bg-red-50 text-red-700 border border-red-200/50"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isActive ? "bg-emerald-500 animate-pulse" : "bg-red-500"
                          }`}
                        />
                        {isActive ? "Hoạt động" : "Tạm khóa"}
                      </span>
                    </td>

                    {/* Thao tác */}
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
                          className="text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 bg-white text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#0B132B]/20 focus:border-[#0B132B] cursor-pointer shadow-xs"
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
                    <p className="text-sm font-medium">Chưa có khách hàng nào đăng ký tài khoản.</p>
                    <p className="text-xs text-gray-400">Danh sách sẽ tự động cập nhật khi có người dùng mới tạo tài khoản.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}