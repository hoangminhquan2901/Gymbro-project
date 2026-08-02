import axios from "axios";

// Đổi URL tùy theo cổng Backend của bạn (ví dụ: http://localhost:5000/api/statistics)
const API_URL = "http://localhost:5000/api/statistics"; 

export const fetchStatistics = async (month, year) => {
  try {
    const response = await axios.get(`${API_URL}?month=${month}&year=${year}`);
    return response.data;
  } catch (error) {
    console.error("Lỗi gọi API thống kê:", error);
    return null;
  }
};