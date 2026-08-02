import axios from "axios";
import { logActivity } from "../utils/activityLogger";

const API_URL = "http://localhost:5000/api/auth";

export const getCustomers = async (page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${API_URL}/admin/customers?page=${page}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("admin_token")}` 
      }
    });
    
    if (response.data && response.data.success) {
      return response.data; 
    }
    return { data: [], pagination: {} };
  } catch (error) {
    console.error("Lỗi khi tải danh sách khách hàng từ Database:", error);
    return { data: [], pagination: {} };
  }
};

// Đã bổ sung thêm tham số customerName vào hàm
export const updateCustomerStatus = async (customerId, status, customerName = "") => {
  try {
    const response = await axios.put(
      `${API_URL}/admin/customers/${customerId}/status`,
      { status },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`
        }
      }
    );

    const actionText = (status === 1 || status === true || status === "1") ? "Mở khóa tài khoản" : "Khóa tài khoản";
    
    // Sử dụng biến customerName an toàn
    const targetDesc = customerName ? `${actionText} khách hàng "${customerName}"` : `${actionText} khách hàng ID: ${customerId}`;
    logActivity("TOGGLE_CUSTOMER_STATUS", targetDesc);
    
    return response.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái khách hàng:", error);
    throw error;
  }
};