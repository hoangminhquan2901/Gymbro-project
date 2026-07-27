import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);
const API_URL = "http://localhost:5000/api";

const CURRENT_USER_KEY = "gymbro_current_user";
const TOKEN_KEY = "admin_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(CURRENT_USER_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(true);

  // Lưu hoặc xóa thông tin User & Token vào localStorage
  const setCurrentUser = (userData, token = null) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userData));
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      }
    } else {
      localStorage.removeItem(CURRENT_USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  };

  // 1. Hàm lấy thông tin mới nhất từ API /auth/profile
  const fetchProfile = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.success) {
        // Cập nhật lại thông tin mới nhất vào State và LocalStorage
        setCurrentUser(response.data.data, token);
      }
    } catch (error) {
      console.error("Lỗi xác thực Token hoặc lấy Profile:", error);
      // Nếu Token hết hạn hoặc không hợp lệ (401/403) thì tự động Logout
      if (error.response?.status === 401 || error.response?.status === 403) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  // 2. Tự động đồng bộ dữ liệu người dùng khi F5 / mở ứng dụng
  useEffect(() => {
    fetchProfile();
  }, []);

  // 3. ĐĂNG NHẬP
  async function login(email, password) {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      if (response.data && response.data.success) {
        const { token, data } = response.data;
        setCurrentUser(data, token);
        return { ok: true, data };
      }
      return { ok: false, message: response.data.message || "Đăng nhập thất bại." };
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      const errorMsg = error.response?.data?.message || "Email hoặc mật khẩu không đúng.";
      return { ok: false, message: errorMsg };
    }
  }

  // 4. ĐĂNG KÝ
  async function register(data) {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        address: data.address || "",
      });

      if (response.data && response.data.success) {
        return { ok: true, message: response.data.message };
      }
      return { ok: false, message: response.data.message || "Đăng ký thất bại." };
    } catch (error) {
      console.error("Lỗi đăng ký:", error);
      const errorMsg = error.response?.data?.message || "Lỗi server khi đăng ký tài khoản.";
      return { ok: false, message: errorMsg };
    }
  }

  // 5. CẬP NHẬT THÔNG TIN CÁ NHÂN
  async function updateProfile(profileData) {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await axios.put(`${API_URL}/auth/profile`, profileData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data && response.data.success) {
        // Cập nhật xong thì kéo lại dữ liệu profile mới nhất về Context
        await fetchProfile();
        return { ok: true, message: response.data.message };
      }
      return { ok: false, message: response.data.message || "Cập nhật thất bại." };
    } catch (error) {
      console.error("Lỗi cập nhật Profile:", error);
      const errorMsg = error.response?.data?.message || "Lỗi server khi cập nhật profile.";
      return { ok: false, message: errorMsg };
    }
  }

  // 6. ĐĂNG XUẤT
  function logout() {
    setCurrentUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        updateProfile,
        fetchProfile,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth phải dùng trong AuthProvider");
  return context;
}