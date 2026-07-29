import React, { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus, deleteOrder } from '../../services/orderService';
import OrderTable from '../../components/Admin/OrderTable';
import OrderDetailModal from '../../components/Admin/OrderDetailModal';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hàm tải dữ liệu bất đồng bộ từ API / Database
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getOrders();
      
      // Đảm bảo dữ liệu nhận được luôn là mảng an toàn
      const orderList = Array.isArray(data) ? data : (data?.data || data?.orders || []);
      setOrders(orderList);
    } catch (error) {
      console.error("Lỗi khi tải danh sách đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Lắng nghe sự kiện cập nhật đơn hàng từ các phần khác trong ứng dụng
    window.addEventListener('ordersChanged', loadData);

    return () => {
      window.removeEventListener('ordersChanged', loadData);
    };
  }, []);

  // Hàm xử lý cập nhật trạng thái đơn hàng linh hoạt
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      await loadData(); // Reload lại danh sách mới nhất từ server
    } catch (error) {
      alert("Cập nhật trạng thái đơn hàng thất bại!");
      console.error(error);
    }
  };

  // Hàm xóa đơn hàng
  const handleDelete = async (orderId) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa đơn hàng #${orderId}?`)) {
      try {
        await deleteOrder(orderId);
        await loadData(); // Reload lại danh sách sau khi xóa thành công
      } catch (error) {
        alert("Xóa đơn hàng thất bại!");
        console.error(error);
      }
    }
  };

  return (
    <div className="p-6 bg-[#F4F5F7] min-h-screen text-gray-800 font-sans">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#14213D] tracking-tight">Quản lý Đơn hàng</h1>
          <p className="text-xs text-gray-500 mt-1">
            Theo dõi đơn hàng, cập nhật trạng thái giao hàng và kiểm tra thanh toán theo thời gian thực.
          </p>
        </div>
      </div>

      {/* Component Bảng đơn hàng & Mini Dashboard */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-500 font-medium shadow-sm">
          <div className="inline-block w-8 h-8 border-4 border-[#14213D] border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-xs">Đang tải danh sách đơn hàng từ Database...</p>
        </div>
      ) : (
        <OrderTable
          orders={orders}
          onUpdateStatus={handleUpdateStatus}
          onDeleteOrder={handleDelete}
          onViewDetail={(id) => setSelectedOrderId(id)}
        />
      )}

      {/* Modal Chi tiết đơn hàng */}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => {
            setSelectedOrderId(null);
            loadData(); // Cập nhật lại danh sách khi đóng modal
          }}
        />
      )}
    </div>
  );
}