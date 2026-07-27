import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Breadcrumb from "../components/Breadcrumb";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({
    firstName: "", 
    lastName: "", 
    phone: "", 
    email: "", 
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Thêm state loading để UX tốt hơn

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // 1. Kiểm tra mật khẩu dưới 8 ký tự ngay ở phía client
    if (form.password.length < 8) {
      setError("Mật khẩu phải có ít nhất 8 ký tự.");
      return;
    }

    setLoading(true);
    try {
      // 2. Phải có từ khóa 'await' vì register là hàm async
      const result = await register(form);

      if (result.ok) {
        // Đăng ký thành công -> Chuyển hướng về trang login
        navigate("/login");
      } else {
        // 3. Hiển thị thông báo lỗi từ server trả về (Ví dụ: Email đã trùng,...)
        setError(result.message || "Đăng ký thất bại.");
      }
    } catch (err) {
      setError("Đã xảy ra lỗi kết nối đến server.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-color py-10 px-4">
      <div className="max-w-[860px] mx-auto">
        <Breadcrumb
          items={[
            { label: "Trang chủ", path: "/" },
            { label: "Đăng ký tài khoản" },
          ]}
        />

        <h1 className="text-3xl font-black text-snd-bg-color text-center uppercase mb-2">
          Đăng Ký Tài Khoản
        </h1>
        <p className="text-center text-sm text-gray-500 mb-10">
          Bạn đã có tài khoản?{" "}
          <Link to="/login" className="text-main-color font-bold hover:underline">
            Đăng nhập tại đây
          </Link>
        </p>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm border border-snd-bg-color/10">
          <h2 className="text-sm font-black text-snd-bg-color uppercase tracking-widest mb-6 text-center">
            Thông Tin Cá Nhân
          </h2>

          <div className="flex flex-col gap-5 max-w-2xl mx-auto">
            <Field label="Họ" required>
              <input
                type="text"
                placeholder="Họ"
                value={form.firstName}
                onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                required
              />
            </Field>
            <Field label="Tên" required>
              <input
                type="text"
                placeholder="Tên"
                value={form.lastName}
                onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                required
              />
            </Field>
            <Field label="Số điện thoại" required>
              <input
                type="tel"
                placeholder="Số điện thoại"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                required
              />
            </Field>
            <Field label="Email" required>
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                required
              />
            </Field>
            <Field label="Mật khẩu" required>
              <input
                type="password"
                placeholder="Mật khẩu (ít nhất 8 ký tự)"
                value={form.password}
                onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
                required
              />
            </Field>

            {/* Hiển thị lỗi (mật khẩu ngắn hoặc trùng email từ server trả về) */}
            {error && <p className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-lg">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-main-color text-snd-bg-color font-black text-sm py-3.5 rounded-full hover:bg-[#e69200] hover:text-white transition-all cursor-pointer mt-2 disabled:opacity-50"
            >
              {loading ? "Đang xử lý..." : "Đăng ký"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="text-sm font-bold text-snd-bg-color mb-1.5 block">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {React.cloneElement(children, {
        className: "w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-main-color focus:border-main-color",
      })}
    </div>
  );
}