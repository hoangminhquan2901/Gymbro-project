import React, { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus, deleteOrder } from '../../services/orderService';
import OrderTable from '../../components/Admin/OrderTable';
import OrderDetailModal from '../../components/Admin/OrderDetailModal';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [loading, setLoading] = useState(true);

  // State phân trang Admin
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 12; // Số lượng đơn hàng trên mỗi trang của admin

  // Hàm tải dữ liệu bất đồng bộ từ API / Database
  const loadData = async (page = 1) => {
    try {
      setLoading(true);
      const res = dataTypeSafely(await getOrders(page, limit));
      
      setOrders(res.orders);
      setCurrentPage(res.pagination.currentPage);
      setTotalPages(res.pagination.totalPages);
      setTotalItems(res.pagination.totalItems);
    } catch (error) {
      console.error("Lỗi khi tải danh sách đơn hàng:", error);
    } finally {
      setLoading(false);
    }
  };

  // Helper bóc tách dữ liệu linh hoạt đề phòng fallback localStorage
  const dataTypeSafely = (data) => {
    if (data && data.success && Array.isArray(data.data)) {
      return {
        orders: data.data,
        pagination: data.pagination || { currentPage: 1, totalPages: 1, totalItems: data.data.length }
      };
    }
    const list = Array.isArray(data) ? data : (data?.data || data?.orders || []);
    return {
      orders: list,
      pagination: { currentPage: 1, totalPages: 1, totalItems: list.length }
    };
  };

  useEffect(() => {
    loadData(currentPage);

    // Lắng nghe sự kiện cập nhật đơn hàng
    window.addEventListener('ordersChanged', () => loadData(currentPage));

    return () => {
      window.removeEventListener('ordersChanged', () => loadData(currentPage));
    };
  }, [currentPage]);

  // Hàm xử lý cập nhật trạng thái đơn hàng linh hoạt
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      await loadData(currentPage); 
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
        await loadData(currentPage); 
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
          <h1 className="text-2xl font-black text-[#14213D] tracking-tight">Quản lý Đơn hàng ({totalItems})</h1>
          <p className="text-xs text-gray-500 mt-1">
            Theo dõi đơn hàng, cập nhật trạng thái giao hàng và kiểm tra thanh toán theo thời gian thực.
          </p>
        </div>
      </div>

      {/* Component Bảng đơn hàng & Phân trang */}
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
          // Truyền thông tin và hàm đổi trang xuống bảng
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(newPage) => setCurrentPage(newPage)}
        />
      )}

      {/* Modal Chi tiết đơn hàng */}
      {selectedOrderId && (
        <OrderDetailModal
          orderId={selectedOrderId}
          onClose={() => {
            setSelectedOrderId(null);
            loadData(currentPage); 
          }}
        />
      )}
    </div>
  );
}