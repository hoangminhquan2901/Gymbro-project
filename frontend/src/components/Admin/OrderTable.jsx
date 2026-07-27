import React, { useState } from 'react';

export default function OrderTable({ orders = [], onUpdateStatus, onDeleteOrder, onViewDetail }) {
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

  // 1. Thống kê Mini Dashboard
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'Chờ xác nhận').length;
  const shippingOrders = orders.filter(o => o.status === 'Đang giao').length;
  const completedOrders = orders.filter(o => o.status === 'Hoàn thành').length;

  const totalRevenue = orders
    .filter(o => o.paymentStatus === 'Đã thanh toán' || o.status === 'Hoàn thành')
    .reduce((sum, o) => sum + parseAmount(o.totalAmount), 0);

  // 2. Bộ lọc đa tầng
  const filteredOrders = orders.filter(o => {
    const idStr = String(o.id || '');
    const nameStr = String(o.customerName || '');
    const phoneStr = String(o.phone || '');
    const matchSearch = (idStr + nameStr + phoneStr).toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchPayment = paymentFilter === 'ALL' || o.paymentStatus === paymentFilter;
    return matchSearch && matchStatus && matchPayment;
  });

  const handleStatusChangeSelect = (orderId, value) => {
    setStatusDrafts(prev => ({ ...prev, [orderId]: value }));
  };

  const handleSaveStatus = (orderId) => {
    const newStatus = statusDrafts[orderId];
    if (newStatus) {
      onUpdateStatus(orderId, newStatus);
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
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/60';
      case 'Đang giao':
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
            <option value="Chờ xác nhận">⏳ Chờ xác nhận</option>
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
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5"
            >
              🔄 Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* Bảng Dữ liệu */}
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
                    Không tìm thấy đơn hàng phù hợp.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const draftVal = statusDrafts[order.id];
                  const currentSelectVal = draftVal !== undefined ? draftVal : order.status;
                  const isChanged = draftVal !== undefined && draftVal !== order.status;
                  return (
                    <tr key={order.id} className="hover:bg-gray-50/60 transition">
                      <td className="py-4 px-4 font-black text-[#14213D]">#{order.id}</td>
                      <td className="py-4 px-4">
                        <p className="font-bold text-gray-900">{order.customerName}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{order.phone}</p>
                      </td>
                      <td className="py-4 px-4 font-black text-gray-900">
                        {parseAmount(order.totalAmount).toLocaleString('vi-VN')}đ
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border inline-flex items-center gap-1 ${getPaymentBadge(order.paymentStatus)}`}>
                          ● {order.paymentStatus}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border inline-flex items-center gap-1 ${getStatusBadge(order.status)}`}>
                          ● {order.status}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <select
                            value={currentSelectVal}
                            onChange={(e) => handleStatusChangeSelect(order.id, e.target.value)}
                            className={`border text-xs rounded-xl px-2.5 py-1.5 outline-none font-semibold transition ${
                              isChanged ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-gray-50/80 border-gray-200 text-gray-700'
                            }`}
                          >
                            <option value="Chờ xác nhận">Chờ xác nhận</option>
                            <option value="Đang giao">Đang giao</option>
                            <option value="Hoàn thành">Hoàn thành</option>
                            <option value="Đã hủy">Đã hủy</option>
                          </select>
                          {isChanged && (
                            <button
                              onClick={() => handleSaveStatus(order.id)}
                              className="bg-[#14213D] hover:bg-black text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-sm transition animate-pulse"
                            >
                              Lưu
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-gray-400 text-[11px]">{order.createdAt}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => onViewDetail(order.id)}
                            className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition"
                            title="Xem chi tiết đơn hàng"
                          >
                            👁
                          </button>
                          <button
                            onClick={() => onDeleteOrder(order.id)}
                            className="p-2 hover:bg-rose-50 rounded-xl text-rose-500 transition"
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
      </div>
    </div>
  );
}