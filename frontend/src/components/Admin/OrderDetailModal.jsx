import React, { useState, useEffect } from 'react';
import { getOrderById, updateOrderStatus } from '../../services/orderService';
import { decreaseProductStock } from '../../services/adminProductService';

export default function OrderDetailModal({ orderId, onClose }) {
  const [order, setOrder] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  // Gọi API lấy dữ liệu chi tiết của 1 Đơn hàng
  useEffect(() => {
    const fetchOrderDetail = async () => {
      if (orderId) {
        try {
          setLoading(true);
          const response = await getOrderById(orderId);
          const data = response?.data || response;
          console.log("📦 DỮ LIỆU ĐƠN HÀNG TỪ API:", data); // Kiểm tra cấu trúc ở F12 -> Console
          if (data) {
            setOrder(data);
            setCurrentStatus(data.status || data.Status || data.ShippingStatus || 'Chờ xác nhận');
          }
        } catch (error) {
          console.error("Lỗi khi tải chi tiết đơn hàng:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchOrderDetail();
  }, [orderId]);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
          <div className="w-8 h-8 border-4 border-[#14213D] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-bold text-gray-700">Đang tải chi tiết đơn hàng #{orderId}...</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const realOrderId = order.OrderID || order._id || order.id || orderId;

  // Tính trạng thái thanh toán
  const computedPaymentStatus = currentStatus === 'Hoàn thành' 
    ? 'Đã thanh toán' 
    : (order.PaymentStatus || order.paymentStatus || order.payment_status || 'Chưa thanh toán');

  const parseAmount = (val) => {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') return Number(val.replace(/[^0-9]/g, '')) || 0;
    return 0;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '---';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Hoàn thành':
      case 'Đã giao hàng':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      case 'Đang giao':
      case 'Đang vận chuyển':
        return 'bg-blue-50 text-blue-700 border-blue-200/80';
      case 'Đã hủy':
        return 'bg-rose-50 text-rose-700 border-rose-200/80';
      case 'Đang xử lý':
        return 'bg-amber-50 text-amber-700 border-amber-200/80';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200/80';
    }
  };

  const getPaymentBadge = (paymentStatus) => {
    return paymentStatus === 'Đã thanh toán'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
      : 'bg-amber-50 text-amber-700 border-amber-200/80';
  };

  // Logic Xử Lý Lưu & Trừ Tồn Kho
  const handleUpdateStatus = async () => {
    try {
      let hasDeducted = order.isStockDeducted || false;

      if (currentStatus === 'Hoàn thành' && !order.isStockDeducted) {
        const itemsList = order.orderDetails || order.OrderDetails || order.items || order.orderItems || [];
        if (Array.isArray(itemsList)) {
          itemsList.forEach((item) => {
            const targetId = item.ProductID || item.productId || item.product?._id || item.product || item.id || item._id;
            const qty = Number(item.Quantity || item.quantity || item.qty || item.amount) || 1;

            if (targetId) {
              decreaseProductStock(targetId, qty);
            }
          });
        }
        hasDeducted = true;
      }

      await updateOrderStatus(realOrderId, currentStatus, hasDeducted);

      setIsSaved(true);
      setTimeout(() => {
        setIsSaved(false);
        onClose();
      }, 500);
    } catch (error) {
      alert("Cập nhật đơn hàng thất bại!");
      console.error(error);
    }
  };

  const customerName = order.CustomerName || order.customerName || order.shippingAddress?.fullName || order.user?.fullName || 'Chưa cập nhật';
  const phone = order.Phone || order.phone || order.shippingAddress?.phone || 'Chưa cập nhật';
  const address = order.Address || order.address || order.shippingAddress?.address || 'Chưa cập nhật';
  const totalAmount = parseAmount(order.TotalAmount || order.totalAmount || order.totalPrice || order.total);

  // Lấy danh sách sản phẩm từ mọi tên trường có thể có (ưu tiên chuẩn DB OrderDetails của bạn)
  const productList = order.orderDetails || order.OrderDetails || order.items || order.orderItems || [];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-[#F4F5F7] rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative border border-gray-200/80">
        
        {/* Header Modal */}
        <div className="flex justify-between items-start mb-6 pb-4 border-b border-gray-200/60">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-[#14213D] tracking-tight">
                Chi tiết đơn hàng #{realOrderId.toString().slice(-6)}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(currentStatus)}`}>
                ● {currentStatus}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Kiểm tra thông tin khách hàng, thanh toán, biến thể sản phẩm và cập nhật vận chuyển.
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-white hover:bg-gray-100 text-gray-700 text-xs px-4 py-2 rounded-xl font-bold border border-gray-200 shadow-sm transition flex items-center gap-1 cursor-pointer"
          >
            ✕ Đóng
          </button>
        </div>

        {/* Card tóm tắt */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-6">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase font-extrabold tracking-wider">Mã đơn hàng</p>
            <h4 className="text-base font-black text-[#14213D] mt-1">#{realOrderId.toString().slice(-6)}</h4>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase font-extrabold tracking-wider">Thanh toán</p>
            <div className="mt-1">
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${getPaymentBadge(computedPaymentStatus)}`}>
                {computedPaymentStatus}
              </span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase font-extrabold tracking-wider">Trạng thái vận chuyển</p>
            <div className="mt-1">
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${getStatusBadge(currentStatus)}`}>
                {currentStatus}
              </span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-[10px] text-gray-400 uppercase font-extrabold tracking-wider">Tổng giá trị</p>
            <h4 className="text-base font-black text-emerald-600 mt-1">
              {totalAmount.toLocaleString('vi-VN')}đ
            </h4>
          </div>
        </div>

        {/* Thông tin Chi tiết */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#14213D] mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <span>👤</span> Thông tin khách hàng
            </h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-400 font-bold block text-[10px] uppercase">Họ và tên</span>
                <span className="font-bold text-gray-900 mt-0.5 block">{customerName}</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold block text-[10px] uppercase">Số điện thoại</span>
                <span className="font-bold text-gray-900 mt-0.5 block">{phone}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400 font-bold block text-[10px] uppercase">Địa chỉ giao hàng</span>
                <span className="font-medium text-gray-700 mt-0.5 block leading-relaxed">{address}</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold block text-[10px] uppercase">Ngày khởi tạo</span>
                <span className="font-medium text-gray-600 mt-0.5 block">{formatDate(order.CreatedAt || order.createdAt)}</span>
              </div>
              <div>
                <span className="text-gray-400 font-bold block text-[10px] uppercase">Cập nhật gần nhất</span>
                <span className="font-medium text-gray-600 mt-0.5 block">{formatDate(order.UpdatedAt || order.updatedAt || order.CreatedAt)}</span>
              </div>
              <div className="col-span-2 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <span className="text-gray-400 font-bold block text-[10px] uppercase">Ghi chú từ khách</span>
                <span className="font-medium text-gray-700 mt-0.5 block italic">
                  {order.Note || order.note ? `"${order.Note || order.note}"` : 'Không có ghi chú'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#14213D] mb-4 pb-2 border-b border-gray-100 flex items-center gap-2">
              <span>💳</span> Thanh toán & Giao hàng
            </h3>
            <div className="space-y-4 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-400 font-bold text-[10px] uppercase">Phương thức thanh toán</span>
                <span className="font-extrabold text-gray-800 bg-gray-100 px-2.5 py-1 rounded-lg">
                  {order.PaymentMethod || order.paymentMethod || order.payment_method || 'COD (Thanh toán khi nhận)'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-400 font-bold text-[10px] uppercase">Trạng thái tiền hàng</span>
                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getPaymentBadge(computedPaymentStatus)}`}>
                  ● {computedPaymentStatus}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-400 font-bold text-[10px] uppercase">Tình trạng đơn hàng</span>
                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${getStatusBadge(currentStatus)}`}>
                  ● {currentStatus}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Danh sách sản phẩm */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6">
          <h3 className="font-extrabold text-xs uppercase tracking-wider text-[#14213D] mb-4 flex items-center gap-2">
            <span>📦</span> Danh sách sản phẩm đặt mua ({productList.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-400 uppercase text-[10px] font-extrabold tracking-wider">
                  <th className="py-3 px-3">Tên sản phẩm</th>
                  <th className="py-3 px-3">Hương vị</th>
                  <th className="py-3 px-3">Đơn giá</th>
                  <th className="py-3 px-3 text-center">SL</th>
                  <th className="py-3 px-3 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 font-medium">
                {productList.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-6 text-gray-400 italic">
                      Không tìm thấy danh sách sản phẩm trong đơn hàng này (Kiểm tra lại API Backend JOIN bảng OrderDetails).
                    </td>
                  </tr>
                ) : (
                  productList.map((item, idx) => {
                    // Ánh xạ chính xác các cột từ bảng OrderDetails trong MySQL của bạn
                    const name = item.ProductName || item.productName || item.name || item.title || item.product?.name || 'Sản phẩm';
                    const unitPrice = parseAmount(item.Price || item.price || item.unitPrice || 0);
                    const qty = Number(item.Quantity || item.quantity || item.qty || 1);
                    const itemTotal = item.total ? parseAmount(item.total) : unitPrice * qty;
                    const flavorVal = item.FlavorName || item.flavorName || item.flavor || item.variant;

                    return (
                      <tr key={idx} className="hover:bg-gray-50/50 transition">
                        <td className="py-3.5 px-3 font-bold text-gray-900">{name}</td>
                        <td className="py-3.5 px-3">
                          {flavorVal ? (
                            <span className="px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 font-bold text-[11px] border border-amber-200/80">
                              {flavorVal}
                            </span>
                          ) : (
                            <span className="text-gray-400 italic">Mặc định</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 text-gray-600">{unitPrice.toLocaleString('vi-VN')}đ</td>
                        <td className="py-3.5 px-3 text-center font-bold text-gray-900">{qty}</td>
                        <td className="py-3.5 px-3 text-right font-black text-gray-900">
                          {itemTotal.toLocaleString('vi-VN')}đ
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-[#14213D] text-[#FFFFFF] p-4 rounded-2xl flex justify-between items-center mt-5 shadow-lg shadow-[#14213D]/10">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="font-extrabold text-xs uppercase tracking-wider text-gray-200">
                Tổng thanh toán thực tế
              </span>
            </div>
            <span className="text-xl font-black text-[#FFFFFF] tracking-tight">
              {totalAmount.toLocaleString('vi-VN')} VNĐ
            </span>
          </div>
        </div>

        {/* Chân Modal */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-xs font-bold text-gray-700 whitespace-nowrap">Cập nhật trạng thái đơn:</span>
            <select
              value={currentStatus}
              onChange={(e) => setCurrentStatus(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-xs rounded-xl px-4 py-2.5 outline-none font-bold text-[#14213D] focus:bg-white focus:border-[#14213D] transition w-full sm:w-auto cursor-pointer"
            >
              <option value="Chờ xác nhận">⏳ Chờ xác nhận</option>
              <option value="Đang xử lý">🔄 Đang xử lý</option>
              <option value="Đang giao">🚚 Đang giao</option>
              <option value="Hoàn thành">✓ Hoàn thành</option>
              <option value="Đã hủy">✕ Đã hủy</option>
            </select>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleUpdateStatus}
              disabled={isSaved}
              className={`w-full sm:w-auto text-xs font-bold px-6 py-2.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                isSaved 
                  ? 'bg-emerald-600 text-white' 
                  : 'bg-[#14213D] hover:bg-black text-white active:scale-95'
              }`}
            >
              {isSaved ? '✓ Đã cập nhật thành công!' : '💾 Lưu thay đổi'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}