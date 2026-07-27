import React from "react";
import ProfileLayout from "./ProfileLayout";
import { useAuth } from "../../context/AuthContext";

export default function ProfileInfo() {
  const { user } = useAuth();
  console.log(">>> DỮ LIỆU USER TRONG CONTEXT:", user);

  // Xử lý ghép họ tên linh hoạt từ nhiều trường khác nhau mà backend có thể trả về
  const fullName = 
    user?.fullName || 
    user?.name || 
    (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : null) ||
    user?.firstName || 
    "—";

  // Xử lý số điện thoại từ các tên biến phổ biến
  const phone = user?.phone || user?.phoneNumber || user?.sdt || "—";

  // Xử lý địa chỉ
  const address = user?.address || "—";

  return (
    <ProfileLayout>
      <h2 className="text-xl font-black text-[#14213D] uppercase tracking-wide mb-8">
        Thông Tin Tài Khoản
      </h2>

      <div className="flex flex-col gap-5">
        <InfoRow label="Họ tên" value={fullName} />
        <InfoRow label="Email" value={user?.email || "—"} />
        <InfoRow label="Điện thoại" value={phone} />
        <InfoRow label="Địa chỉ" value={address} />
      </div>
    </ProfileLayout>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex gap-2 text-sm border-b border-gray-100 pb-4">
      <span className="font-bold text-[#14213D] min-w-[120px]">{label}:</span>
      <span className="text-gray-700">{value}</span>
    </div>
  );
}