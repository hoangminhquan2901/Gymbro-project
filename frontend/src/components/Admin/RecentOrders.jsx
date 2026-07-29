import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getOrders } from "../../services/orderService";

export default function RecentOrders({ limit = 4 }) {
  const [recentOrders, setRecentOrders] = useState([]);

  useEffect(() => {
    const fetchRecentOrders = async () => {
      try {
        const rawOrders = typeof getOrders === "function" ? await getOrders() : [];
        const orders = Array.isArray(rawOrders) ? rawOrders : (rawOrders?.data || []);
        
        // Lấy danh sách đơn hàng gần đây nhất và giới hạn theo prop limit
        const sortedOrders = [...orders].reverse().slice(0, limit);
        setRecentOrders(sortedOrders);
      } catch (error) {
        console.error("Lỗi khi tải đơn hàng gần đây:", error);
      }
    };

    fetchRecentOrders();

    window.addEventListener("ordersChanged", fetchRecentOrders);
    window.addEventListener("storage", fetchRecentOrders);

    return () => {
      window.removeEventListener("ordersChanged", fetchRecentOrders);
      window.removeEventListener("storage", fetchRecentOrders);
    };
  }, [limit]);

  const formatVND = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount || 0);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-[#14213d] flex items-center gap-2 text-base">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
          Đơn hàng gần đây
        </h3>
        <Link
          to="/admin/orders"
          className="text-xs text-blue-600 font-medium hover:underline cursor-pointer"
        >
          Xem tất cả →
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-xs text-slate-400 uppercase">
              <th className="py-2 font-semibold">Mã đơn</th>
              <th className="py-2 font-semibold">Khách hàng</th>
              <th className="py-2 font-semibold">Giá trị</th>
              <th className="py-2 font-semibold">Trạng thái</th>
              <th className="py-2 font-semibold">Ngày</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-sm">
            {recentOrders.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-4 text-center text-xs text-slate-400">
                  Chưa có đơn hàng nào
                </td>
              </tr>
            ) : (
              recentOrders.map((order) => (
                <tr key={order.id || order._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 font-medium text-blue-600">
                    #{order.code || order.id || order._id}
                  </td>
                  <td className="py-3 text-slate-700">
                    {order.customerName || order.shippingAddress?.fullName || "Khách vãng lai"}
                  </td>
                  <td className="py-3 font-semibold text-slate-800">
                    {formatVND(order.totalAmount || order.total || order.price)}
                  </td>
                  <td className="py-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600">
                      {order.status || "Đang xử lý"}
                    </span>
                  </td>
                  <td className="py-3 text-slate-500 text-xs">
                    {order.createdAt || order.updatedAt || "Vừa xong"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}