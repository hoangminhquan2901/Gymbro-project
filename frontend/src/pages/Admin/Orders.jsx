import React, { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus, deleteOrder } from '../../services/orderService';
import OrderTable from '../../components/Admin/OrderTable';
import OrderDetailModal from '../../components/Admin/OrderDetailModal';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const loadData = () => {
    const data = getOrders();
    setOrders(data);
  };

  useEffect(() => {
    loadData();

    // Lắng nghe thay đổi từ cả ứng dụng lẫn các Tab/Cửa sổ khác nhau
    window.addEventListener('ordersChanged', loadData);
    window.addEventListener('storage', loadData);

    return () => {
      window.removeEventListener('ordersChanged', loadData);
      window.removeEventListener('storage', loadData);
    };
  }, []);

  // Hàm xử lý cập nhật trạng thái đơn hàng linh hoạt
  const handleUpdateStatus = (orderId, newStatus) => {
    updateOrderStatus(orderId, newStatus);
  };

  // Hàm xóa đơn hàng
  const handleDelete = (orderId) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa đơn hàng #${orderId}?`)) {
      deleteOrder(orderId);
    }
  };

  return (
    <div className="p-6 bg-[#F4F5F7] min-h-screen text-gray-800 font-sans">
      {/* Header đồng bộ thiết kế Precision Commerce */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#14213D] tracking-tight">Quản lý Đơn hàng</h1>
          <p className="text-xs text-gray-500 mt-1">
            Theo dõi đơn hàng, cập nhật trạng thái giao hàng và kiểm tra thanh toán theo thời gian thực.
          </p>
        </div>
      </div>

      {/* Component Bảng đơn hàng & Mini Dashboard */}
      <OrderTable
        orders={orders}
        onUpdateStatus={handleUpdateStatus}
        onDeleteOrder={handleDelete}
        onViewDetail={(id) => setSelectedOrderId(id)}
      />

      {/* Modal Chi tiết đơn hàng */}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => setSelectedOrderId(null)}
        />
      )}
    </div>
  );
}