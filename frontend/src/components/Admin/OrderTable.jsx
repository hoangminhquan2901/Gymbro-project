import React, { useState } from 'react';

export default function OrderTable({ 
  orders = [], 
  onUpdateStatus, 
  onDeleteOrder, 
  onViewDetail, 
  currentPage = 1, 
  totalPages = 1, 
  onPageChange 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');
  const [statusDrafts, setStatusDrafts] = useState({});

  // Parse tiền tệ an toàn
  const parseAmount = (val) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const cleanStr = val.replace(/[^0-9]/g, '');
      return Number(cleanStr) || 0;
    }
    return 0;
  };

  // Định dạng ngày từ Database (ISO string -> HH:mm DD/MM/YYYY)
  const formatDate = (dateStr) => {
    if (!dateStr) return '---';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(dateStr);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return String(dateStr);
    }
  };

  // Thống kê Mini Dashboard (Hỗ trợ gộp Chờ xác nhận & Đang xử lý)
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => {
    const s = o.Status || o.status;
    return s === 'Chờ xác nhận' || s === 'Đang xử lý';
  }).length;
  const shippingOrders = orders.filter(o => {
    const s = o.Status || o.status;
    return s === 'Đang giao' || s === 'Đang vận chuyển';
  }).length;
  const completedOrders = orders.filter(o => {
    const s = o.Status || o.status;
    return s === 'Hoàn thành' || s === 'Đã giao hàng';
  }).length;

  const totalRevenue = orders
    .filter(o => (o.PaymentStatus || o.paymentStatus) === 'Đã thanh toán' || (o.Status || o.status) === 'Hoàn thành')
    .reduce((sum, o) => sum + parseAmount(o.TotalAmount || o.totalAmount || o.totalPrice || o.total), 0);

  // Bộ lọc đa tầng 
  const filteredOrders = orders.filter(o => {
    const rawId = o.OrderID || o._id || o.id || o.orderCode || '';
    const idStr = String(rawId);
    const nameStr = String(o.CustomerName || o.customerName || o.shippingAddress?.fullName || o.user?.fullName || '');
    const phoneStr = String(o.Phone || o.phone || o.shippingAddress?.phone || '');
    
    const currentStatus = o.Status || o.status || 'Chờ xác nhận';
    let currentPayment = o.PaymentStatus || o.paymentStatus || o.payment_status || 'Chưa thanh toán';
    
    // Đồng bộ điều kiện lọc theo trạng thái hoàn thành
    if (currentStatus === 'Hoàn thành' && currentPayment === 'Chưa thanh toán') {
      currentPayment = 'Đã thanh toán';
    }

    const matchSearch = (idStr + nameStr + phoneStr).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = statusFilter === 'ALL' || 
      (statusFilter === 'Chờ xác nhận' 
        ? (currentStatus === 'Chờ xác nhận' || currentStatus === 'Đang xử lý') 
        : currentStatus === statusFilter);
        
    const matchPayment = paymentFilter === 'ALL' || currentPayment === paymentFilter;
    
    return matchSearch && matchStatus && matchPayment;
  });

  const handleStatusChangeSelect = (orderId, value) => {
    setStatusDrafts(prev => ({ ...prev, [orderId]: value }));
  };

  const handleSaveStatus = async (orderId) => {
    const newStatus = statusDrafts[orderId];
    if (newStatus) {
      await onUpdateStatus(orderId, newStatus);
      setStatusDrafts(prev => {
        const copy = { ...prev };
        delete copy[orderId];
        return copy;
      });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Hoàn thành':
      case 'Đã giao hàng':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
      case 'Đang giao':
      case 'Đang vận chuyển':
        return 'bg-blue-50 text-blue-700 border-blue-200/60';
      case 'Đã hủy':
        return 'bg-rose-50 text-rose-700 border-rose-200/60';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200/60';
    }
  };

  const getPaymentBadge = (paymentStatus) => {
    return paymentStatus === 'Đã thanh toán'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
      : 'bg-amber-50 text-amber-700 border-amber-200/60';
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Mini 5 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100/80 flex items-center justify-between hover:border-gray-200 transition">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-bold text-gray-400">Tổng đơn hàng</p>
            <h3 className="text-2xl font-black text-[#14213D] mt-1">{totalOrders}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center text-lg text-gray-700">🛒</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100/80 flex items-center justify-between hover:border-amber-200 transition">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-bold text-amber-600">Chờ xác nhận</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{pendingOrders}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 flex items-center justify-center text-lg text-amber-600">⏳</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100/80 flex items-center justify-between hover:border-blue-200 transition">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-bold text-blue-600">Đang vận chuyển</p>
            <h3 className="text-2xl font-black text-blue-600 mt-1">{shippingOrders}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center text-lg text-blue-600">🚚</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100/80 flex items-center justify-between hover:border-emerald-200 transition">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-bold text-emerald-600">Đã hoàn thành</p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1">{completedOrders}</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-lg text-emerald-600">✓</div>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100/80 flex items-center justify-between hover:border-emerald-200 transition">
          <div>
            <p className="text-[11px] uppercase tracking-wider font-bold text-emerald-700">Doanh thu thực tế</p>
            <h3 className="text-xl font-black text-emerald-700 mt-1">{totalRevenue.toLocaleString('vi-VN')}đ</h3>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center text-lg text-emerald-700">💰</div>
        </div>
      </div>

      {/* Bộ lọc */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100/80 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex-1 min-w-[260px] relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
          <input
            type="text"
            placeholder="Tìm theo mã đơn, tên khách, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50/80 border border-gray-200/80 rounded-xl pl-9 pr-4 py-2 text-xs font-medium outline-none focus:bg-white focus:border-[#14213D] transition"
          />
        </div>
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50/80 border border-gray-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 outline-none focus:bg-white focus:border-[#14213D] cursor-pointer"
          >
            <option value="ALL">📦 Tất cả trạng thái vận chuyển</option>
            <option value="Chờ xác nhận">⏳ Chờ xác nhận / Đang xử lý</option>
            <option value="Đang giao">🚚 Đang giao</option>
            <option value="Hoàn thành">✓ Hoàn thành</option>
            <option value="Đã hủy">✕ Đã hủy</option>
          </select>
          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="bg-gray-50/80 border border-gray-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 outline-none focus:bg-white focus:border-[#14213D] cursor-pointer"
          >
            <option value="ALL">💳 Tất cả thanh toán</option>
            <option value="Đã thanh toán">🟢 Đã thanh toán</option>
            <option value="Chưa thanh toán">🟡 Chưa thanh toán</option>
          </select>
          {(searchTerm || statusFilter !== 'ALL' || paymentFilter !== 'ALL') && (
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); setPaymentFilter('ALL'); }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              🔄 Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* Bảng Dữ liệu & Phân trang */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-4 px-4">Mã đơn</th>
                <th className="py-4 px-4">Khách hàng</th>
                <th className="py-4 px-4">Tổng tiền</th>
                <th className="py-4 px-4">Thanh toán</th>
                <th className="py-4 px-4">Trạng thái</th>
                <th className="py-4 px-4">Cập nhật nhanh</th>
                <th className="py-4 px-4">Ngày đặt</th>
                <th className="py-4 px-4 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 font-medium">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-gray-400">
                    Không tìm thấy đơn hàng phù hợp từ Database.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order, idx) => {
                  const rawOrderId = order.OrderID || order._id || order.id || `UNKNOWN_${idx}`;
                  const orderIdStr = String(rawOrderId);
                  
                  const statusVal = order.Status || order.status || 'Chờ xác nhận';
                  const draftVal = statusDrafts[rawOrderId];
                  const currentSelectVal = draftVal !== undefined ? draftVal : statusVal;
                  const isChanged = draftVal !== undefined && draftVal !== statusVal;

                  const customerName = order.CustomerName || order.customerName || order.shippingAddress?.fullName || order.user?.fullName || 'Khách vãng lai';
                  const phone = order.Phone || order.phone || order.shippingAddress?.phone || '---';
                  const totalAmount = parseAmount(order.TotalAmount || order.totalAmount || order.totalPrice || order.total);
                  
                  let paymentStatus = order.PaymentStatus || order.paymentStatus || order.payment_status || 'Chưa thanh toán';
                  if ((statusVal === 'Hoàn thành' || currentSelectVal === 'Hoàn thành') && paymentStatus === 'Chưa thanh toán') {
                    paymentStatus = 'Đã thanh toán';
                  }

                  const createdAt = order.CreatedAt || order.createdAt;

                  return (
                    <tr key={orderIdStr} className="hover:bg-gray-50/60 transition">
                      <td className="py-4 px-4 font-black text-[#14213D]">
                        #{orderIdStr.length > 6 ? orderIdStr.slice(-6) : orderIdStr}
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-bold text-gray-900">{customerName}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{phone}</p>
                      </td>
                      <td className="py-4 px-4 font-black text-gray-900">
                        {totalAmount.toLocaleString('vi-VN')}đ
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border inline-flex items-center gap-1 ${getPaymentBadge(paymentStatus)}`}>
                          ● {paymentStatus}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border inline-flex items-center gap-1 ${getStatusBadge(statusVal)}`}>
                          ● {statusVal}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={currentSelectVal}
                            onChange={(e) => handleStatusChangeSelect(rawOrderId, e.target.value)}
                            className={`border text-xs rounded-xl px-2.5 py-1.5 outline-none font-semibold transition ${
                              isChanged ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-gray-50/80 border-gray-200 text-gray-700'
                            }`}
                          >
                            <option value="Chờ xác nhận">Chờ xác nhận</option>
                            <option value="Đang xử lý">Đang xử lý</option>
                            <option value="Đang giao">Đang giao</option>
                            <option value="Hoàn thành">Hoàn thành</option>
                            <option value="Đã hủy">Đã hủy</option>
                          </select>
                          {isChanged && (
                            <button
                              onClick={() => handleSaveStatus(rawOrderId)}
                              className="bg-[#14213D] hover:bg-black text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-sm transition animate-pulse cursor-pointer"
                            >
                              Lưu
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-400 text-[11px]">{formatDate(createdAt)}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onViewDetail(rawOrderId)}
                            className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition cursor-pointer"
                            title="Xem chi tiết đơn hàng"
                          >
                            👁
                          </button>
                          <button
                            onClick={() => onDeleteOrder(rawOrderId)}
                            className="p-2 hover:bg-rose-50 rounded-xl text-rose-500 transition cursor-pointer"
                            title="Xóa đơn hàng"
                          >
                            🗑
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Thanh Phân Trang (Trước / Sau) */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/50">
            <span className="text-xs text-gray-500 font-medium">
              Trang <strong className="text-[#14213D]">{currentPage}</strong> / {totalPages}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition shadow-sm cursor-pointer"
              >
                Trước
              </button>

              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-xs font-bold rounded-xl border border-gray-200 bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 transition shadow-sm cursor-pointer"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}