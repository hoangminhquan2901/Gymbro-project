// src/services/orderService.js
import { decreaseProductStock } from "./adminProductService";
import { logActivity } from "../utils/activityLogger";

const STORAGE_KEY = "gymbro_orders";

const notifyOrderChanges = (updatedOrders) => {
  const payload = JSON.stringify(updatedOrders);
  window.dispatchEvent(new Event("ordersChanged"));
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: STORAGE_KEY,
      newValue: payload,
    })
  );
};

export const getOrders = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Lỗi khi đọc dữ liệu đơn hàng:", error);
    return [];
  }
};

export const getAllOrders = getOrders;

export const getOrderById = (id) => {
  const orders = getOrders();
  return orders.find((order) => String(order.id) === String(id)) || null;
};

// Cập nhật trạng thái đơn hàng, tự động cập nhật thanh toán và trừ tồn kho theo vị (flavor) nếu hoàn thành
export const updateOrderStatus = (orderId, newStatus, isStockDeducted = false) => {
  try {
    const orders = getOrders();
    let stockDeductedFlag = isStockDeducted;
    let targetOrderName = "";

    const updatedOrders = orders.map((order) => {
      if (String(order.id) === String(orderId)) {
        targetOrderName = order.code || order.id;

        // Nếu chuyển sang Hoàn thành và đơn này CHƯA từng trừ kho trước đó
        if (newStatus === "Hoàn thành" && !order.isStockDeducted && !stockDeductedFlag) {
          order.items?.forEach((item) => {
            const targetId = item.productId || item.id || item._id;
            const qty = Number(item.quantity) || 1;
            const flavorName = item.flavor || item.selectedFlavor || null;
            const itemName = item.name || null;

            if (targetId || itemName) {
              decreaseProductStock(targetId, qty, flavorName, itemName);
            }
          });
          stockDeductedFlag = true;
        }

        return {
          ...order,
          status: newStatus,
          paymentStatus: newStatus === "Hoàn thành" ? "Đã thanh toán" : order.paymentStatus,
          isStockDeducted: stockDeductedFlag,
          updatedAt: new Date().toLocaleString("vi-VN"),
        };
      }
      return order;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedOrders));
    notifyOrderChanges(updatedOrders);

    // Ghi log hoạt động cập nhật trạng thái đơn hàng
    logActivity("Cập nhật đơn hàng", `Cập nhật trạng thái đơn hàng #${targetOrderName} thành "${newStatus}"`);

    return updatedOrders;
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
    return [];
  }
};

export const deleteOrder = (id) => {
  const orders = getOrders();
  const orderToDelete = orders.find((order) => String(order.id) === String(id));
  
  const filteredOrders = orders.filter((order) => String(order.id) !== String(id));
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredOrders));
  notifyOrderChanges(filteredOrders);

  // Ghi log hoạt động xóa đơn hàng
  if (orderToDelete) {
    const orderName = orderToDelete.code || orderToDelete.id;
    logActivity("Xóa đơn hàng", `Xóa đơn hàng #${orderName}`);
  }

  return filteredOrders;
};