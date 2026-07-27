import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const [showToolMenu, setShowToolMenu] = useState(false);
  const { user } = useAuth();

  return (
    <nav className="w-full bg-[#14213D] border-b border-[#FCA311]/30 select-none shadow-md">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <ul className="flex items-center justify-between h-[60px] lg:h-[68px]">

          {/* THỰC PHẨM BỔ SUNG */}
          <li className="h-full flex items-center">
            <Link
              to="/category/thuc-pham-bo-sung"
              className="flex items-center gap-1.5 text-[17px] font-semibold text-white/90 hover:text-[#FCA311] transition-colors duration-200"
            >
              Thực Phẩm Bổ Sung
            </Link>
          </li>

          {/* MỤC TIÊU & NHU CẦU */}
          <li className="h-full flex items-center">
            <Link
              to="/category/muc-tieu-nhu-cau"
              className="flex items-center gap-1.5 text-[17px] font-semibold text-white/90 hover:text-[#FCA311] transition-colors duration-200"
            >
              Mục Tiêu & Nhu Cầu
            </Link>
          </li>

          {/* KHUYẾN MÃI */}
          <li className="h-full flex items-center">
            <Link 
              to="/khuyen-mai" 
              className="text-[17px] font-semibold text-white/90 hover:text-[#FCA311] transition-colors duration-200"
            >
              Khuyến Mãi
            </Link>
          </li>

          {/* THƯƠNG HIỆU */}
          <li className="h-full flex items-center">
            <Link 
              to="/brands" 
              className="text-[17px] font-semibold text-white/90 hover:text-[#FCA311] transition-colors duration-200"
            >
              Thương Hiệu
            </Link>
          </li>

          {/* KIẾN THỨC */}
          <li className="h-full flex items-center">
            <Link 
              to="/kien-thuc" 
              className="text-[17px] font-semibold text-white/90 hover:text-[#FCA311] transition-colors duration-200"
            >
              Kiến Thức
            </Link>
          </li>

          {/* CÔNG CỤ (DROPDOWN) */}
          <li
            className="relative h-full flex items-center group cursor-pointer"
            onMouseEnter={() => setShowToolMenu(true)}
            onMouseLeave={() => setShowToolMenu(false)}
          >
            <button 
              type="button"
              className="flex items-center gap-1.5 text-[17px] font-semibold text-white/90 group-hover:text-[#FCA311] transition-colors duration-200 focus:outline-none"
            >
              Công Cụ
              <ChevronIcon isOpen={showToolMenu} />
            </button>

            {/* Menu Thả Xuống */}
            {showToolMenu && (
              <div className="absolute top-full left-0 pt-2 w-[300px] z-50 animate-fadeIn">
                <div className="bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden divide-y divide-gray-100">
                  <Link 
                    to="/tdee" 
                    className="flex items-center gap-3 px-5 py-4 text-gray-800 font-semibold hover:bg-amber-50 hover:text-[#14213D] transition-colors duration-150"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#14213D]/5 flex items-center justify-center text-[#FCA311]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold">Tính TDEE Online</p>
                      <p className="text-xs text-gray-500 font-normal">Tính lượng Calo tiêu thụ hàng ngày</p>
                    </div>
                  </Link>

                  <Link 
                    to="/bmi" 
                    className="flex items-center gap-3 px-5 py-4 text-gray-800 font-semibold hover:bg-amber-50 hover:text-[#14213D] transition-colors duration-150"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#14213D]/5 flex items-center justify-center text-[#FCA311]">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold">Tính BMI Online</p>
                      <p className="text-xs text-gray-500 font-normal">Đánh giá chỉ số khối cơ thể</p>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </li>

          {/* HỆ THỐNG CỬA HÀNG */}
          <li className="h-full flex items-center">
            <Link 
              to="/he-thong-cua-hang" 
              className="text-[17px] font-semibold text-white/90 hover:text-[#FCA311] transition-colors duration-200"
            >
              Hệ Thống Cửa Hàng
            </Link>
          </li>

          {/* TÀI KHOẢN / ĐĂNG NHẬP (ĐIỂM NHẤN HÀNH ĐỘNG) */}
          <li className="h-full flex items-center">
            <Link
              to={
                !user
                  ? "/login"
                  : user.role === "Admin"
                  ? "/admin"
                  : "/profile"
              }
              className="
                flex items-center gap-2 px-4 py-2 rounded-lg
                text-[17px] font-semibold text-white/90
                hover:text-[#FCA311] hover:bg-white/5
                transition-all duration-200
              "
            >
              <UserIcon />
              <span>{user ? (user.name || "Tài Khoản") : "Đăng Nhập"}</span>
            </Link>
          </li>

        </ul>
      </div>
    </nav>
  );
}

// Chevron Icon nâng cấp nét vẽ và hỗ trợ animation xoay
function ChevronIcon({ isOpen }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180 text-[#FCA311]" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

// Icon User riêng biệt cho mục Tài Khoản
function UserIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="w-5 h-5 text-[#FCA311]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

export default Navbar;