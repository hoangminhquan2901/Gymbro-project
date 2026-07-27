import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // Bước 1: Nhập email, Bước 2: Nhập mật khẩu mới
  const [email, setEmail] = useState("");
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Bước 1: Kiểm tra email qua Backend (hoặc tạm thời qua API check)
  async function handleCheckEmail(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Nếu backend chưa có api check email riêng, bạn có thể tạo hoặc xử lý bước này. 
      // Ở đây giả lập gọi API hoặc chuyển thẳng sang bước 2 nếu backend hỗ trợ đổi mật khẩu trực tiếp bằng email.
      // Tạm thời nếu dùng code cũ chạy localStorage, ta đổi sang gọi API backend.
      // Do backend hiện tại của bạn chưa có route /forgot-password, bạn có thể cân nhắc bổ sung route hoặc làm theo logic API dưới đây:
      
      const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
      if (response.data && response.data.success) {
        setStep(2);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Email này chưa được đăng ký trong hệ thống.");
    } finally {
      setLoading(false);
    }
  }

  // Bước 2: Cập nhật mật khẩu mới qua Backend
  async function handleResetPassword(e) {
    e.preventDefault();
    setError("");

    if (form.password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const response = await axios.put(`${API_URL}/auth/reset-password`, {
        email,
        newPassword: form.password,
      });

      if (response.data && response.data.success) {
        setSuccess("Đặt lại mật khẩu thành công! Đang chuyển hướng đến trang đăng nhập...");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Đã có lỗi xảy ra khi cập nhật mật khẩu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-snd-bg-color flex items-center justify-center px-4 py-12">
      <div className="bg-snd-bg-color/80 backdrop-blur border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h2 className="text-2xl font-black text-white text-center mb-2">Đặt lại mật khẩu</h2>
        
        {step === 1 ? (
          <>
            <p className="text-white/70 text-sm text-center mb-6 border border-white/20 rounded-xl p-3">
              Nhập email tài khoản của bạn để tiến hành thay đổi mật khẩu mới.
            </p>

            <form onSubmit={handleCheckEmail} className="flex flex-col gap-4">
              <input
                type="email"
                placeholder="Nhập email của bạn"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-full bg-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-main-color text-sm"
              />

              {error && <p className="text-red-300 text-xs text-center">{error}</p>}

              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-white/30 hover:bg-main-color text-white font-bold text-sm px-6 py-2.5 rounded-full transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Đang kiểm tra..." : "Tiếp tục"}
                </button>
                <Link to="/login" className="text-white font-bold text-sm hover:text-main-color transition">
                  Hủy
                </Link>
              </div>
            </form>
          </>
        ) : (
          <>
            <p className="text-white/70 text-sm text-center mb-6 border border-white/20 rounded-xl p-3">
              Nhập mật khẩu mới cho tài khoản: <span className="font-bold text-white">{email}</span>
            </p>

            <form onSubmit={handleResetPassword} className="flex flex-col gap-4">
              <input
                type="password"
                placeholder="Mật khẩu mới (ít nhất 8 ký tự)"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                required
                className="w-full px-4 py-3 rounded-full bg-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-main-color text-sm"
              />
              <input
                type="password"
                placeholder="Xác nhận mật khẩu mới"
                value={form.confirm}
                onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
                required
                className="w-full px-4 py-3 rounded-full bg-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-main-color text-sm"
              />

              {error && <p className="text-red-300 text-xs text-center">{error}</p>}
              {success && <p className="text-green-300 text-xs text-center bg-green-900/40 p-2 rounded-lg">{success}</p>}

              <div className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-white/30 hover:bg-main-color text-white font-bold text-sm px-6 py-2.5 rounded-full transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
                </button>
                <Link to="/login" className="text-white font-bold text-sm hover:text-main-color transition">
                  Hủy
                </Link>
              </div>
            </form>
          </>
        )}

        <div className="my-6 border-t border-white/20" />
        <h3 className="text-xl font-black text-white text-center mb-4">Đăng ký</h3>
        <div className="border border-white/20 rounded-xl p-4 text-center text-sm text-white/80 mb-4">
          Tạo tài khoản để quản lý đơn hàng, và các thông tin thanh toán, gửi hàng một cách đơn giản hơn.
        </div>
        <div className="flex flex-col gap-3">
          <Link to="/register" className="w-full text-center bg-white/20 hover:bg-white/30 text-white font-bold text-sm py-3 rounded-full transition cursor-pointer">
            Tạo tài khoản
          </Link>
          <Link to="/" className="w-full text-center bg-white/20 hover:bg-white/30 text-white font-bold text-sm py-3 rounded-full transition cursor-pointer">
            Quay về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}