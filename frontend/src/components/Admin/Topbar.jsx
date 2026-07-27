import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { UserCircle, LogOut, ChevronDown } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function Topbar() {
  const { logout } = useAuth();

  const [open, setOpen] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  return (
    <header className="h-[72px] bg-white border-b border-gray-200 flex items-center justify-end px-8 shadow-sm">

      <div
        className="relative"
        ref={dropdownRef}
      >
        <button
          onClick={() => setOpen(!open)}
          className="
            flex
            items-center
            gap-2
            px-4
            py-2
            rounded-xl
            hover:bg-gray-100
            transition
            cursor-pointer
          "
        >
          <UserCircle
            size={34}
            className="text-[#14213D]"
          />

          <span className="font-semibold text-[#14213D]">
            GymBro Admin
          </span>

          <ChevronDown size={18} />
        </button>

        {open && (
          <div
            className="
              absolute
              right-0
              mt-3
              w-56
              bg-white
              rounded-xl
              shadow-xl
              border
              border-gray-200
              overflow-hidden
              z-50
            "
          >

            <Link
              to="/admin/profile"
              className="
                flex
                items-center
                gap-3
                px-5
                py-4
                hover:bg-gray-100
                cursor-pointer
              "
              onClick={() => setOpen(false)}
            >
              <UserCircle size={20} />

              <span>
                Thông tin cá nhân
              </span>
            </Link>

            <button
              onClick={() => {
                logout();
                setOpen(false);
                window.location.href = "/";
              }}
              className="
                w-full
                flex
                items-center
                gap-3
                px-5
                py-4
                hover:bg-red-50
                text-red-600
                cursor-pointer
              "
            >
              <LogOut size={20} />

              <span>
                Đăng xuất
              </span>

            </button>

          </div>
        )}

      </div>

    </header>
  );
}

export default Topbar;