import axios from "axios";

const API_URL = "http://localhost:5000/api/auth";

export const getCustomers = async (page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${API_URL}/admin/customers?page=${page}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("admin_token")}` 
      }
    });
    
    if (response.data && response.data.success) {
      return response.data; // Trả về cả { success, data, pagination }
    }
    return { data: [], pagination: {} };
  } catch (error) {
    console.error("Lỗi khi tải danh sách khách hàng từ Database:", error);
    return { data: [], pagination: {} };
  }
};

export const updateCustomerStatus = async (customerId, status) => {
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
    return response.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái khách hàng:", error);
    throw error;
  }
};