import React from "react";

export default function RecentOrders({ orders = [], limit = 4 }) {
  const displayOrders = orders.slice(0, limit);

  const formatVND = (amount) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);

  return (
    <div>
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 className="font-bold text-[#14213d] text-base">Đơn hàng gần đây</h3>
      </div>
      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-xs text-slate-400 border-b border-slate-100">
              <th className="pb-3 font-semibold">MÃ ĐƠN</th>
              <th className="pb-3 font-semibold">KHÁCH HÀNG</th>
              <th className="pb-3 font-semibold">GIÁ TRỊ</th>
              <th className="pb-3 font-semibold">TRẠNG THÁI</th>
              <th className="pb-3 font-semibold">NGÀY</th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-100">
            {displayOrders.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center py-4 text-slate-400 text-xs">
                  Chưa có đơn hàng nào
                </td>
              </tr>
            ) : (
              displayOrders.map((order, index) => (
                <tr key={order.OrderID || order.id || index}>
                  <td className="py-3 font-medium text-[#14213d]">
                    #{order.OrderID || order.id || index + 1}
                  </td>
                  <td className="py-3 text-slate-600">
                    {order.CustomerName || order.customerName || order.customer?.name || "Khách vãng lai"}
                  </td>
                  <td className="py-3 font-semibold text-[#14213d]">
                    {formatVND(order.TotalAmount || order.totalAmount || order.total || 0)}
                  </td>
                  <td className="py-3">
                    <span className="px-2.5 py-1 text-xs rounded-full bg-amber-50 text-amber-600 font-medium">
                      {order.Status || order.status || "Đang xử lý"}
                    </span>
                  </td>
                  <td className="py-3 text-slate-400 text-xs">
                    {order.CreatedAt || order.createdAt 
                      ? new Date(order.CreatedAt || order.createdAt).toLocaleDateString("vi-VN") 
                      : "Vừa xong"}
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