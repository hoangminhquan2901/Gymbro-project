import React, { useState } from "react";
import ProfileLayout from "./ProfileLayout";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";

const API_URL = "http://localhost:5000/api";
const TOKEN_KEY = "admin_token";

export default function Password() {
  const { user } = useAuth();
  const [form, setForm] = useState({ old: "", new: "", confirm: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.new.length < 8) {
      setError("Mật khẩu mới phải có ít nhất 8 ký tự.");
      return;
    }
    if (form.new !== form.confirm) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await axios.put(
        `${API_URL}/auth/change-password`,
        {
          oldPassword: form.old,
          newPassword: form.new,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data && response.data.success) {
        setSuccess("Đổi mật khẩu thành công!");
        setForm({ old: "", new: "", confirm: "" });
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Đã có lỗi xảy ra trong quá trình đổi mật khẩu.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ProfileLayout>
      <h2 className="text-xl font-black text-[#14213D] uppercase tracking-wide mb-2">
        Đổi Mật Khẩu
      </h2>
      <p className="text-sm text-gray-500 mb-8">
        Để đảm bảo tính bảo mật vui lòng đặt mật khẩu với ít nhất 8 ký tự
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 max-w-md">
        <PasswordField
          label="Mật khẩu cũ"
          value={form.old}
          onChange={(v) => setForm((p) => ({ ...p, old: v }))}
          required
        />
        <PasswordField
          label="Mật khẩu mới"
          value={form.new}
          onChange={(v) => setForm((p) => ({ ...p, new: v }))}
          required
        />
        <PasswordField
          label="Xác nhận lại mật khẩu"
          value={form.confirm}
          onChange={(v) => setForm((p) => ({ ...p, confirm: v }))}
          required
        />

        {error && <p className="text-sm text-red-500 font-medium">{error}</p>}
        {success && <p className="text-sm text-green-600 font-medium">{success}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-fit bg-[#FCA311] text-white font-bold text-sm px-6 py-2.5 rounded-lg hover:bg-[#e69200] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
        >
          {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
        </button>
      </form>
    </ProfileLayout>
  );
}

function PasswordField({ label, value, onChange, required }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="text-sm font-bold text-[#14213D] mb-1.5 block">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FCA311] focus:border-[#FCA311] pr-12"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#14213D] cursor-pointer text-xs select-none"
        >
          {show ? "Ẩn" : "Hiện"}
        </button>
      </div>
    </div>
  );
}