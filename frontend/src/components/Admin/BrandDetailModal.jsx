import React, { useEffect } from "react";
import { X, Globe, Calendar, Package, Hash, FileText } from "lucide-react";

// Hàm chuẩn hóa ngày giờ sang giờ Việt Nam (UTC+7)
function formatDate(dateString) {
  if (!dateString) return "Chưa có thông tin";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function BrandDetailModal({ open, brand, onClose, onToggleStatus }) {
  // Đóng modal bằng phím ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !brand) return null;

  const isActive = brand.status === "active";

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex justify-center items-center z-50 p-4 transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Modal Container */}
      <div
        className="bg-white rounded-2xl shadow-2xl w-[680px] max-w-full overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-[#14213D]">
              Chi tiết thương hiệu
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Mã thương hiệu: <span className="font-mono text-gray-600">#{brand.id || "N/A"}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            title="Đóng (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
          {/* Preview Logo */}
          <div className="flex justify-center">
            <div className="relative w-48 h-48 bg-gray-50/80 rounded-2xl border border-gray-100 p-4 flex items-center justify-center shadow-inner group overflow-hidden">
              {brand.image ? (
                <img
                  src={brand.image}
                  alt={brand.name}
                  className="max-h-full max-w-full object-contain drop-shadow-sm transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-gray-300">
                  <Globe size={56} strokeWidth={1.5} />
                  <span className="text-xs font-semibold mt-2 text-gray-400 uppercase tracking-wider">
                    GymBro Partner
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bảng thông tin dạng Grid */}
          <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100 text-sm">
            
            {/* Tên thương hiệu */}
            <InfoGridRow icon={<Hash size={16} className="text-gray-400" />} title="Tên thương hiệu">
              <span className="font-bold text-[#14213D] text-base">
                {brand.name}
              </span>
            </InfoGridRow>

            {/* Slug */}
            <InfoGridRow icon={<Hash size={16} className="text-gray-400" />} title="Slug (URL)">
              <span className="font-mono text-xs text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md inline-block">
                {brand.slug || "chua-tao-slug"}
              </span>
            </InfoGridRow>

            {/* Quốc gia */}
            <InfoGridRow icon={<Globe size={16} className="text-gray-400" />} title="Quốc gia">
              <span className="font-medium text-gray-700">
                {brand.country || "Chưa xác định"}
              </span>
            </InfoGridRow>

            {/* Số lượng sản phẩm */}
            <InfoGridRow icon={<Package size={16} className="text-gray-400" />} title="Sản phẩm">
              <span className="inline-flex items-center gap-1.5 font-semibold text-[#14213D]">
                <span className="px-2.5 py-0.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/60 text-xs">
                  {brand.productCount ?? 0} sản phẩm
                </span>
              </span>
            </InfoGridRow>

            {/* Trạng thái hoạt động */}
            <InfoGridRow icon={<Globe size={16} className="text-gray-400" />} title="Trạng thái">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onToggleStatus?.(brand.id, brand.status)}
                  className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ease-in-out cursor-pointer focus:outline-none ${
                    isActive ? "bg-[#2EC4B6]" : "bg-gray-300"
                  }`}
                  title="Nhấp để chuyển trạng thái"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                      isActive ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
                <span
                  className={`text-xs font-semibold ${
                    isActive ? "text-[#2EC4B6]" : "text-gray-400"
                  }`}
                >
                  {isActive ? "Đang hoạt động (Hiện)" : "Tạm ngưng (Ẩn)"}
                </span>
              </div>
            </InfoGridRow>

            {/* Ngày cập nhật */}
            <InfoGridRow icon={<Calendar size={16} className="text-gray-400" />} title="Cập nhật gần nhất">
              <span className="text-gray-500 text-xs font-medium">
                {formatDate(brand.updatedAt || brand.UpdatedAt)}
              </span>
            </InfoGridRow>

          </div>

          {/* Khối Mô tả chi tiết */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <FileText size={14} className="text-gray-400" />
              <span>Mô tả chi tiết</span>
            </div>
            <div className="p-4 bg-gray-50/70 border border-gray-100 rounded-xl text-sm text-gray-600 leading-relaxed min-h-[90px] whitespace-pre-line">
              {brand.description || (
                <span className="text-gray-400 italic">
                  Chưa có mô tả chi tiết cho nhà cung cấp này.
                </span>
              )}
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="border-t border-gray-100 px-6 py-4 flex justify-end bg-gray-50/30">
          <button
            type="button"
            onClick={onClose}
            className="bg-[#14213D] hover:bg-[#0d1629] text-white px-6 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer active:scale-95 shadow-xs"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}

// Component phụ dựng cấu trúc hàng Grid khoa học
function InfoGridRow({ icon, title, children }) {
  return (
    <div className="grid grid-cols-[170px_1fr] items-center min-h-[44px]">
      <div className="bg-gray-50/80 px-4 py-3 text-xs font-semibold text-gray-500 flex items-center gap-2 h-full border-r border-gray-100">
        {icon}
        <span>{title}</span>
      </div>
      <div className="px-4 py-2.5 flex items-center">{children}</div>
    </div>
  );
}

export default BrandDetailModal;