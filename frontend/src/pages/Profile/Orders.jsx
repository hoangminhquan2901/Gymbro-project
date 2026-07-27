import React, { useState, useEffect } from "react";
import ProfileLayout from "./ProfileLayout";
import { useAuth } from "../../context/AuthContext";

const COLUMNS = ["Đơn hàng", "Ngày", "Địa chỉ", "Giá trị đơn hàng", "TT thanh toán", "TT vận chuyển"];

function formatPrice(num) {
  if (num === undefined || num === null || num === "") return "0đ";
  const parsed = typeof num === "number" ? num : parseFloat(String(num).replace(/[^0-9.-]+/g, ""));
  return isNaN(parsed) ? "0đ" : parsed.toLocaleString("vi-VN") + "đ";
}

function getPaymentStatusBadge(status) {
  switch (status) {
    case "Đã thanh toán":
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Đã thanh toán</span>;
    case "Đã hủy / Hoàn tiền":
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">Đã hủy / Hoàn tiền</span>;
    default:
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">{status || "Chờ thanh toán (COD)"}</span>;
  }
}

function getShippingStatusBadge(status) {
  switch (status) {
    case "Đã giao hàng":
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Đã giao hàng</span>;
    case "Đang giao":
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">Đang giao</span>;
    case "Đã hủy":
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">Đã hủy</span>;
    default:
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">{status || "Đang xử lý"}</span>;
  }
}

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);

  const loadOrders = () => {
    try {
      const rawData = localStorage.getItem("gymbro_orders");
      if (!rawData) {
        setOrders([]);
        return;
      }

      const allOrders = JSON.parse(rawData);
      if (!Array.isArray(allOrders)) {
        setOrders([]);
        return;
      }

      const userOrders = allOrders.filter((order) => {
        if (!order.email && !order.customerName) return true;

        if (user) {
          const matchEmail = order.email && user.email && order.email.toLowerCase() === user.email.toLowerCase();
          const fullName = user.fullName || user.name || "";
          const matchName = order.customerName && fullName && order.customerName.toLowerCase() === fullName.toLowerCase();
          
          return matchEmail || matchName;
        }

        return true;
      });

      setOrders(userOrders);
    } catch (error) {
      console.error("Lỗi khi tải danh sách đơn hàng:", error);
      setOrders([]);
    }
  };

  useEffect(() => {
    loadOrders();

    window.addEventListener("ordersChanged", loadOrders);
    window.addEventListener("storage", loadOrders);

    return () => {
      window.removeEventListener("ordersChanged", loadOrders);
      window.removeEventListener("storage", loadOrders);
    };
  }, [user]);

  return (
    <ProfileLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black text-[#14213D] uppercase tracking-wide">
          Đơn Hàng Của Bạn ({orders.length})
        </h2>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-[#14213D]">
              {COLUMNS.map((col) => (
                <th key={col} className="text-left py-3 pr-6 font-bold text-[#14213D] whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders && orders.length > 0 ? (
              orders.map((order, index) => {
                const orderId = order.id || `DH-${index}`;
                const orderDate = order.createdAt || "---";
                const orderAddress = order.address || "---";
                const orderTotal = order.totalAmount ?? order.totalPrice ?? order.total ?? 0;

                return (
                  <tr key={orderId} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 pr-6 text-[#FCA311] font-bold whitespace-nowrap">
                      #{orderId}
                    </td>
                    <td className="py-3 pr-6 text-gray-600 whitespace-nowrap">
                      {orderDate}
                    </td>
                    <td className="py-3 pr-6 text-gray-600 max-w-[220px] truncate" title={orderAddress}>
                      {orderAddress}
                    </td>
                    <td className="py-3 pr-6 font-bold text-[#14213D] whitespace-nowrap">
                      {formatPrice(orderTotal)}
                    </td>
                    <td className="py-3 pr-6 whitespace-nowrap">
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </td>
                    <td className="py-3 whitespace-nowrap">
                      {getShippingStatusBadge(order.shippingStatus)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-400 italic">
                  Không có đơn hàng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </ProfileLayout>
  );
}