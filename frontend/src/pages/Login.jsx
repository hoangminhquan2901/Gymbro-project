import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Thêm loading để chặn double click

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Phải có await vì login là hàm async
    const result = await login(form.email, form.password);
    
    setLoading(false);

    if (result.ok) {
      // Phân quyền chuyển hướng dựa vào role trả về từ server
      if (result.data?.role === 'Admin') {
        navigate("/admin/dashboard"); // Hoặc trang quản trị của bạn
      } else {
        navigate("/"); // Khách hàng 100% về trang chủ hoặc /profile
      }
    } else {
      setError(result.message);
    }
  }

  return (
    <div className="min-h-screen bg-snd-bg-color flex items-center justify-center px-4 py-12">
      <div className="bg-snd-bg-color/80 backdrop-blur border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl">

        {/* ĐĂNG NHẬP */}
        <h2 className="text-2xl font-black text-white text-center mb-6">Đăng nhập</h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            required
            className="w-full px-4 py-3 rounded-full bg-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-main-color text-sm"
          />
          <input
            type="password"
            placeholder="Mật khẩu"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            required
            className="w-full px-4 py-3 rounded-full bg-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-main-color text-sm"
          />

          {error && <p className="text-red-300 text-xs text-center">{error}</p>}

          <div className="flex items-center justify-between mt-1">
            <button
              type="submit"
              disabled={loading}
              className="bg-white/30 hover:bg-main-color text-white font-bold text-sm px-6 py-2.5 rounded-full transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? "Đang xử lý..." : "Đăng nhập"}
            </button>
            <Link to="/forgot-password" className="text-white font-bold text-sm hover:text-main-color transition">
              Quên mật khẩu?
            </Link>
          </div>
        </form>

        {/* DIVIDER */}
        <div className="my-6 border-t border-white/20" />

        {/* ĐĂNG KÝ */}
        <h3 className="text-xl font-black text-white text-center mb-4">Đăng ký</h3>
        <div className="border border-white/20 rounded-xl p-4 text-center text-sm text-white/80 mb-4">
          Tạo tài khoản để quản lý đơn hàng, và các thông tin thanh toán, gửi hàng một cách đơn giản hơn.
        </div>

        <div className="flex flex-col gap-3">
          <Link
            to="/register"
            className="w-full text-center bg-white/20 hover:bg-white/30 text-white font-bold text-sm py-3 rounded-full transition cursor-pointer"
          >
            Tạo tài khoản
          </Link>
          <Link
            to="/"
            className="w-full text-center bg-white/20 hover:bg-white/30 text-white font-bold text-sm py-3 rounded-full transition cursor-pointer"
          >
            Quay về trang chủ
          </Link>
        </div>

      </div>
    </div>
  );
}