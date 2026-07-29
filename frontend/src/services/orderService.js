import axiosClient from "./axiosClient";
import { logActivity } from "../utils/activityLogger";

const STORAGE_KEY = "gymbro_orders";

// Hàm lấy dữ liệu dự phòng từ LocalStorage nếu API hỏng hoàn toàn
const getLocalOrders = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
};

// 1. LẤY TOÀN BỘ ĐƠN HÀNG CHO ADMIN
export const getOrders = async () => {
  try {
    // Tự động gắn Token từ localStorage
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
    
    // Gọi đúng endpoint dành cho Admin ở Backend
    const response = await axiosClient.get("/orders/admin/all", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Backend trả về dạng: { success: true, data: [...] }
    if (response.data && response.data.success) {
      return response.data.data;
    }
    if (Array.isArray(response.data)) return response.data;
    return [];
  } catch (error) {
    console.warn("Lỗi khi kết nối API /orders/admin/all, đang dùng dữ liệu LocalStorage dự phòng.", error);
    return getLocalOrders();
  }
};

export const getAllOrders = getOrders;

// 2. LẤY CHI TIẾT 1 ĐƠN HÀNG
export const getOrderById = async (id) => {
  try {
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
    const response = await axiosClient.get(`/orders/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response.data && response.data.success) {
      return response.data.data;
    }
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi tải chi tiết đơn hàng #${id}:`, error);
    const local = getLocalOrders();
    return local.find((order) => String(order.OrderID || order.id) === String(id)) || null;
  }
};

// 3. CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG (DÀNH CHO ADMIN)
export const updateOrderStatus = async (orderId, newStatus, extraData = {}) => {
  try {
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
    
    // Gọi đúng endpoint PUT /orders/admin/:orderId/status
    const response = await axiosClient.put(`/orders/admin/${orderId}/status`, {
      status: newStatus,
      ...extraData
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    window.dispatchEvent(new Event("ordersChanged"));
    logActivity("Cập nhật đơn hàng", `Cập nhật trạng thái đơn hàng #${orderId} thành "${newStatus}"`);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
    throw error;
  }
};

// 4. XÓA ĐƠN HÀNG
export const deleteOrder = async (orderId) => {
  try {
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
    const response = await axiosClient.delete(`/orders/${orderId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi xóa đơn hàng:", error);
    throw error;
  }
};