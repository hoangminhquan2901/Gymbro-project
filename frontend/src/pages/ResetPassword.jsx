import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Breadcrumb from "../components/Breadcrumb";

const API_URL = "http://localhost:5000/api";

export default function ResetPassword() {
  const navigate = useNavigate();
  // Nếu là đổi mật khẩu khi đã đăng nhập, thường cần thêm mật khẩu cũ (currentPassword) 
  // hoặc theo form của bạn gồm password mới và confirm. Tùy thuộc vào backend /change-password của bạn.
  const [form, setForm] = useState({ currentPassword: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.password.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }
    if (form.password !== form.confirm) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("admin_token"); // Lấy token đã lưu khi đăng nhập
      const response = await axios.put(
        `${API_URL}/auth/change-password`,
        {
          oldPassword: form.currentPassword, // Nếu backend yêu cầu mật khẩu cũ
          newPassword: form.password,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data && response.data.success) {
        setSuccess("Đổi mật khẩu thành công!");
        setTimeout(() => {
          navigate("/profile");
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Đã có lỗi xảy ra khi đổi mật khẩu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-color py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <Breadcrumb
          items={[
            { label: "Trang chủ", path: "/" },
            { label: "Đổi mật khẩu" },
          ]}
        />

        <h1 className="text-2xl font-black text-snd-bg-color uppercase mb-2">
          Đổi Mật Khẩu
        </h1>
        <p className="text-sm text-gray-500 mb-8">Nhập thông tin mật khẩu mới của bạn</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Nếu backend yêu cầu mật khẩu hiện tại */}
          <div>
            <label className="text-sm font-bold text-snd-bg-color mb-1.5 block">
              Mật khẩu hiện tại <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={form.currentPassword}
              onChange={(e) => setForm((p) => ({ ...p, currentPassword: e.target.value }))}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-main-color"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-snd-bg-color mb-1.5 block">
              Mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-main-color"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-snd-bg-color mb-1.5 block">
              Xác nhận mật khẩu mới <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={form.confirm}
              onChange={(e) => setForm((p) => ({ ...p, confirm: e.target.value }))}
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-main-color"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm font-bold">{success}</p>}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="bg-main-color text-snd-bg-color font-bold text-sm px-6 py-2.5 rounded-lg hover:bg-[#e69200] hover:text-white transition cursor-pointer disabled:opacity-50"
            >
              {loading ? "Đang xử lý..." : "Lưu thay đổi"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="text-sm text-gray-500 hover:text-snd-bg-color underline cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}