import React, { useState, useEffect } from "react";
import ProfileLayout from "./ProfileLayout";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

const COLUMNS = ["Đơn hàng", "Ngày đặt", "Địa chỉ", "Giá trị đơn hàng", "TT thanh toán", "TT vận chuyển"];

function formatPrice(num) {
  if (num === undefined || num === null || num === "") return "0đ";
  const parsed = typeof num === "number" ? num : parseFloat(String(num).replace(/[^0-9.-]+/g, ""));
  return isNaN(parsed) ? "0đ" : parsed.toLocaleString("vi-VN") + "đ";
}

function formatDate(dateString) {
  if (!dateString) return "---";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getPaymentStatusBadge(status) {
  switch (status) {
    case "Đã thanh toán":
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Đã thanh toán</span>;
    case "Đã hủy / Hoàn tiền":
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">Đã hủy / Hoàn tiền</span>;
    default:
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">{status || "Chưa thanh toán"}</span>;
  }
}

function getShippingStatusBadge(status) {
  switch (status) {
    case "Hoàn thành":
    case "Đã giao hàng":
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">Hoàn thành</span>;
    case "Đang giao":
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">Đang giao</span>;
    case "Đã hủy":
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">Đã hủy</span>;
    default:
      return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">{status || "Chờ xác nhận"}</span>;
  }
}

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || localStorage.getItem("gymbro_token");
      
      const response = await axios.get("http://localhost:5000/api/orders/my-orders", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.success) {
        setOrders(response.data.data);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải danh sách đơn hàng từ API:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadOrders();
    }
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
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-gray-400 italic">
                  Đang tải danh sách đơn hàng...
                </td>
              </tr>
            ) : orders && orders.length > 0 ? (
              orders.map((order, index) => {
                const orderId = order.OrderID || order._id || order.id || `DH-${index}`;
                const orderDate = formatDate(order.CreatedAt || order.createdAt);
                const orderAddress = order.Address || order.address || order.shippingAddress?.address || "---";
                const orderTotal = order.TotalAmount ?? order.totalAmount ?? order.totalPrice ?? order.total ?? 0;

                // Đồng bộ trạng thái vận chuyển và thanh toán khớp với phía Admin
                const shippingStatus = order.Status || order.status || order.ShippingStatus || order.shippingStatus || 'Chờ xác nhận';
                let paymentStatus = order.PaymentStatus || order.paymentStatus || order.payment_status || 'Chưa thanh toán';

                if (shippingStatus === 'Hoàn thành' && paymentStatus === 'Chưa thanh toán') {
                  paymentStatus = 'Đã thanh toán';
                }

                return (
                  <tr key={orderId} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 pr-6 text-[#FCA311] font-bold whitespace-nowrap">
                      #{String(orderId).length > 8 ? String(orderId).slice(-6) : orderId}
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
                      {getPaymentStatusBadge(paymentStatus)}
                    </td>
                    <td className="py-3 whitespace-nowrap">
                      {getShippingStatusBadge(shippingStatus)}
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