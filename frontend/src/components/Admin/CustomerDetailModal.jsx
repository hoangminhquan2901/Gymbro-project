import React from "react";
import { X, ShoppingBag, Calendar, Phone, Mail, User } from "lucide-react";

export default function CustomerDetailModal({ customer, onClose, onToggleStatus }) {
  if (!customer) return null;

  const displayName = customer.name || customer.fullName || customer.username || "Khách hàng";
  const displayPhone = customer.phone || customer.phoneNumber || "Chưa cập nhật";
  const displayId = customer.id || customer._id || customer.customerId || "N/A";
  const displayJoinDate = customer.joinDate || customer.createdAt || customer.createdDate || "Vừa đăng ký";

  const totalOrders = Number(customer.totalOrders || 0);
  const totalSpent = Number(customer.totalSpent || 0);
  const avgSpent = totalOrders > 0 ? Math.round(totalSpent / totalOrders) : 0;

  // Lấy danh sách đơn hàng linh hoạt từ nhiều tên biến khác nhau mà backend có thể trả về
  const listOrders = customer.recentOrders || customer.orders || customer.listOrders || [];

  // Cập nhật logic kiểm tra trạng thái linh hoạt theo dữ liệu DB MySQL (1/0)
  const checkIsActive = (cus) => {
    const val = cus.isActive !== undefined ? cus.isActive : cus.status;
    if (val === 1 || val === true || val === "1") return true;
    if (val === 0 || val === false || val === "0") return false;

    const statusStr = String(val || "").toLowerCase();
    return statusStr === "hoạt động" || statusStr === "active" || statusStr === "true";
  };

  const isActive = checkIsActive(customer);

  const getTierBadge = (tier) => {
    switch (tier?.toUpperCase()) {
      case "DIAMOND":
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

  const getOrderStatusStyle = (status) => {
    switch (status?.toLowerCase()) {
      case "hoàn thành":
      case "đã hoàn thành":
      case "completed":
        return "bg-emerald-50 text-emerald-700 border border-emerald-200/50";
      case "đang giao":
      case "shipping":
        return "bg-blue-50 text-blue-700 border border-blue-200/50";
      case "đã hủy":
      case "cancelled":
        return "bg-red-50 text-red-700 border border-red-200/50";
      default:
        return "bg-amber-50 text-amber-700 border border-amber-200/50";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
          <div>
            <h3 className="text-lg font-bold text-[#0B132B]">Chi tiết tài khoản khách hàng</h3>
            <p className="text-xs text-gray-400 font-mono">Mã tài khoản: {displayId}</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-gray-50/30">
          
          {/* Top Summary Stats */}
          <div className="flex flex-col md:flex-row items-center gap-6 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                <h4 className="text-xl font-bold text-gray-900">{displayName}</h4>
                <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide ${getTierBadge(customer.tier)}`}>
                  {customer.tier || "Bronze"}
                </span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                  {isActive ? "Hoạt động" : "Tạm khóa"}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1 flex items-center justify-center md:justify-start gap-4 flex-wrap">
                <span className="flex items-center gap-1"><Mail size={14} className="text-gray-400" /> {customer.email || "N/A"}</span>
                <span className="flex items-center gap-1"><Phone size={14} className="text-gray-400" /> {displayPhone}</span>
              </p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-3 text-center border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
              <div className="bg-gray-50/80 p-3 rounded-xl border border-gray-100/80">
                <p className="text-[11px] text-gray-400 font-medium">Tổng đơn</p>
                <div className="flex items-center justify-center gap-1 mt-1 font-bold text-gray-800 text-sm">
                  <ShoppingBag size={14} className="text-[#0B132B]" />
                  <span>{totalOrders}</span>
                </div>
              </div>
              <div className="bg-emerald-50/40 p-3 rounded-xl border border-emerald-100/60">
                <p className="text-[11px] text-emerald-600/80 font-medium">Tổng chi tiêu</p>
                <p className="mt-1 font-bold text-emerald-600 text-sm">
                  {totalSpent.toLocaleString("vi-VN")}đ
                </p>
              </div>
              <div className="bg-blue-50/40 p-3 rounded-xl border border-blue-100/60">
                <p className="text-[11px] text-blue-600/80 font-medium">Trung bình/đơn</p>
                <p className="mt-1 font-bold text-blue-600 text-sm">
                  {avgSpent.toLocaleString("vi-VN")}đ
                </p>
              </div>
            </div>
          </div>

          {/* Two Columns Info & Recent Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Cột Thông tin cá nhân */}
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between">
              <div>
                <h5 className="font-bold text-[#0B132B] mb-4 text-xs uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#0B132B]" />
                  Thông tin đăng ký & Tài khoản
                </h5>

                <div className="space-y-3.5 text-sm">
                  <div className="grid grid-cols-12 gap-2 pt-1 items-baseline">
                    <span className="col-span-4 text-gray-400">Email đăng ký:</span>
                    <span className="col-span-8 font-medium text-gray-800 break-all">{customer.email || "N/A"}</span>
                  </div>

                  <div className="grid grid-cols-12 gap-2 pt-2 border-t border-gray-50 items-baseline">
                    <span className="col-span-4 text-gray-400">Số điện thoại:</span>
                    <span className="col-span-8 font-medium text-gray-800">{displayPhone}</span>
                  </div>

                  <div className="grid grid-cols-12 gap-2 pt-2 border-t border-gray-50 items-baseline">
                    <span className="col-span-4 text-gray-400">Địa chỉ giao hàng:</span>
                    <span className="col-span-8 font-medium text-gray-800 leading-relaxed break-words">
                      {customer.address || "Chưa cập nhật"}
                    </span>
                  </div>

                  <div className="grid grid-cols-12 gap-2 pt-2 border-t border-gray-50 items-baseline">
                    <span className="col-span-4 text-gray-400">Ngày đăng ký:</span>
                    <span className="col-span-8 font-medium text-gray-800">{displayJoinDate}</span>
                  </div>

                  <div className="grid grid-cols-12 gap-2 pt-2 border-t border-gray-50 items-baseline">
                    <span className="col-span-4 text-gray-400">Đơn hàng cuối:</span>
                    <span className="col-span-8 font-medium text-gray-800">{customer.lastOrderDate || "Chưa có đơn hàng"}</span>
                  </div>
                </div>
              </div>

              {/* Nút thao tác trạng thái tài khoản */}
              {onToggleStatus && (
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">Trạng thái tài khoản:</span>
                  <select
                    value={isActive ? "1" : "0"}
                    onChange={(e) => onToggleStatus(displayId, Number(e.target.value))}
                    className="text-xs border border-gray-200 rounded-xl px-3 py-1.5 bg-gray-50 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#0B132B]/20 cursor-pointer"
                  >
                    <option value="1">Hoạt động</option>
                    <option value="0">Tạm khóa</option>
                  </select>
                </div>
              )}
            </div>

            {/* Cột Lịch sử đơn hàng (Hiển thị đầy đủ danh sách đặt hàng) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h5 className="font-bold text-[#0B132B] text-xs uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Lịch sử mua hàng
                </h5>
                <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
                  {listOrders.length} đơn
                </span>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 flex-1">
                {listOrders.length > 0 ? (
                  listOrders.map((ord, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3.5 bg-gray-50/70 hover:bg-gray-50 rounded-xl border border-gray-100/60 transition-all">
                      <div>
                        <p className="font-bold text-sm text-gray-900 font-mono">#{ord.id || ord.orderId || ord._id}</p>
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <Calendar size={12} /> {ord.date || ord.createdAt || ord.orderDate}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold mb-1 ${getOrderStatusStyle(ord.status)}`}>
                          {ord.status || "Chờ xử lý"}
                        </span>
                        <p className="font-bold text-sm text-emerald-600">
                          {Number(ord.total || ord.totalAmount || 0).toLocaleString("vi-VN")}đ
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    <ShoppingBag size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">Chưa có lịch sử đơn hàng</p>
                    <p className="text-xs text-gray-400 mt-0.5">Tài khoản này chưa thực hiện giao dịch nào trên hệ thống.</p>
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Footer */}
        <div className="flex justify-end px-6 py-4 border-t border-gray-100 bg-white">
          <button 
            onClick={onClose} 
            className="px-5 py-2.5 bg-[#0B132B] hover:bg-[#0B132B]/90 text-white font-medium rounded-xl transition-colors cursor-pointer text-sm shadow-xs"
          >
            Đóng cửa sổ
          </button>
        </div>

      </div>
    </div>
  );
}