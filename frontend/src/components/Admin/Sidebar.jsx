import React from "react";
import { NavLink, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  ChartColumn,
  FolderTree,
  Target,
  BadgePercent,
  Package,
  ShoppingCart,
  Users,
  User,
  House,
} from "lucide-react";

function Sidebar() {
  const navigate = useNavigate();

  const menus = [
    {
      title: "Dashboard",
      path: "/admin/dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    {
      title: "Thống kê",
      path: "/admin/statistics",
      icon: <ChartColumn size={20} />,
    },
    {
      title: "Danh mục",
      path: "/admin/categories",
      icon: <FolderTree size={20} />,
    },
    {
      title: "Nhu cầu",
      path: "/admin/goals",
      icon: <Target size={20} />,
    },
    {
      title: "Thương hiệu",
      path: "/admin/brands",
      icon: <BadgePercent size={20} />,
    },
    {
      title: "Sản phẩm",
      path: "/admin/products",
      icon: <Package size={20} />,
    },
    {
      title: "Đơn hàng",
      path: "/admin/orders",
      icon: <ShoppingCart size={20} />,
    },
    {
      title: "Khách hàng",
      path: "/admin/customers",
      icon: <Users size={20} />,
    },
    {
      title: "Tài khoản",
      path: "/admin/profile",
      icon: <User size={20} />,
    },
  ];

  return (
    <aside className="w-[260px] h-screen bg-[#14213D] text-white flex flex-col">

      {/* Logo */}
        <div className="h-20 border-b border-[#24395F] flex flex-col items-center justify-center">
          <h1 className="text-3xl font-bold text-[#FCA311] leading-none">
            GymBro
          </h1>

          <p className="mt-1 text-xs tracking-wider uppercase text-gray-300">
            Trang quản trị
          </p>
        </div>

      {/* Menu */}
      <div className="flex-1 px-3 py-5 overflow-y-auto">

        {menus.map((menu) => (
          <NavLink
            key={menu.path}
            to={menu.path}
            className={({ isActive }) =>
              `
              flex
              items-center
              gap-3
              px-4
              py-3
              rounded-xl
              mb-2
              transition-all
              duration-200
              cursor-pointer
              ${
                isActive
                  ? "bg-[#FCA311] text-white"
                  : "text-gray-200 hover:bg-[#1E3358]"
              }
            `
            }
          >
            {menu.icon}

            <span className="font-medium">
              {menu.title}
            </span>
          </NavLink>
        ))}

      </div>

      {/* Bottom */}

      <div className="p-3 border-t border-[#24395F]">

        <button
          onClick={() => navigate("/")}
          className="
            w-full
            flex
            items-center
            gap-3
            px-4
            py-3
            rounded-xl
            hover:bg-[#1E3358]
            transition-all
            cursor-pointer
          "
        >
          <House size={20} />

          <span>Về trang chủ</span>

        </button>

      </div>

    </aside>
  );
}

export default Sidebar;