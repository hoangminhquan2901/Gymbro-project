import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Breadcrumb from "../../components/Breadcrumb";
import { useAuth } from "../../context/AuthContext";

const MENU_ITEMS = [
  { label: "Thông tin tài khoản", path: "/profile" },
  { label: "Đơn hàng của bạn", path: "/profile/orders" },
  { label: "Đổi mật khẩu", path: "/profile/password" },
];

const BREADCRUMB_MAP = {
  "/profile": [{ label: "Trang chủ", path: "/" }, { label: "Trang khách hàng" }],
  "/profile/orders": [{ label: "Trang chủ", path: "/" }, { label: "Tài khoản", path: "/profile" }, { label: "Đơn hàng" }],
  "/profile/password": [{ label: "Trang chủ", path: "/" }, { label: "Thay đổi mật khẩu" }],
};

export default function ProfileLayout({ children }) {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const breadcrumbs = BREADCRUMB_MAP[pathname] ?? BREADCRUMB_MAP["/profile"];

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-[#E5E5E5]">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <Breadcrumb items={breadcrumbs} />

        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-8 mt-2">
          {/* SIDEBAR */}
          <aside className="bg-white border border-[#d6d6d6] rounded-xl p-6 shadow-sm h-fit">
            <h2 className="text-base font-black text-[#14213D] uppercase tracking-wider mb-1">
              Trang Tài Khoản
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Xin chào, <span className="text-[#FCA311] font-bold">{user?.fullName || user?.name || "Khách hàng"}</span> !
            </p>

            <nav className="flex flex-col gap-1">
              {MENU_ITEMS.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`text-sm py-2 px-3 rounded-lg transition-all duration-150 ${
                      isActive
                        ? "text-[#FCA311] font-bold bg-[#14213D]/5"
                        : "text-[#14213D] hover:text-[#FCA311] hover:bg-[#14213D]/5"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={handleLogout}
                className="w-full text-left text-sm py-2 px-3 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-150 font-medium cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          </aside>

          {/* CONTENT */}
          <div className="bg-white border border-[#d6d6d6] rounded-xl p-8 shadow-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}