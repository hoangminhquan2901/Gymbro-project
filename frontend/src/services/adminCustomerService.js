import axios from "axios";

// Đổi API_URL bao gồm cả prefix /auth
const API_URL = "http://localhost:5000/api/auth";

export const getCustomers = async () => {
  try {
    const response = await axios.get(`${API_URL}/admin/customers`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("admin_token")}` 
      }
    });
    
    if (response.data && response.data.success) {
      return response.data.data;
    }
    return [];
  } catch (error) {
    console.error("Lỗi khi tải danh sách khách hàng từ Database:", error);
    return [];
  }
};

// 2. Cập nhật trạng thái khách hàng (Khóa / Hoạt động)
export const updateCustomerStatus = async (customerId, status) => {
  try {
    const response = await axios.put(
      `${API_URL}/admin/customers/${customerId}/status`,
      { status }, // status gửi lên backend: 1 (hoạt động) hoặc 0 (khóa)
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("admin_token")}`
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái khách hàng:", error);
    throw error;
  }
};