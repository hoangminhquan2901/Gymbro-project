import React, { useMemo } from "react";
import { Globe, Calendar, Check, X, Eye, Pencil, Trash2 } from "lucide-react";

// Hàm chuẩn hóa ngày giờ sang giờ Việt Nam (UTC+7)
function formatDate(dateString) {
  if (!dateString) return "Chưa cập nhật";
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

function BrandTable({ brands = [], onDetail, onEdit, onDelete, onToggleStatus }) {
  // Sắp xếp danh sách brands theo tên từ A -> Z
  const sortedBrands = useMemo(() => {
    return [...brands].sort((a, b) => 
      (a.name || "").localeCompare(b.name || "", "vi", { sensitivity: "base" })
    );
  }, [brands]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        {/* THEAD */}
        <thead className="bg-gray-50/80 border-b border-gray-100">
          <tr className="text-gray-500 text-xs uppercase tracking-wider">
            <th className="px-6 py-4 font-semibold w-20 text-center">Logo</th>
            <th className="px-6 py-4 font-semibold">Thương hiệu</th>
            <th className="px-6 py-4 font-semibold">Quốc gia</th>
            <th className="px-6 py-4 font-semibold text-center">Sản phẩm</th>
            <th className="px-6 py-4 font-semibold">Trạng thái</th>
            <th className="px-6 py-4 font-semibold">Cập nhật</th>
            <th className="px-6 py-4 text-center font-semibold w-36">Thao tác</th>
          </tr>
        </thead>

        {/* TBODY */}
        <tbody className="divide-y divide-gray-100 text-sm">
          {sortedBrands.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 text-center text-gray-400 italic">
                Không tìm thấy thương hiệu nào phù hợp.
              </td>
            </tr>
          ) : (
            sortedBrands.map((brand) => {
              const isActive = brand.status === "active";
              const productCount = brand.productCount ?? 0;

              return (
                <tr
                  key={brand.id}
                  className="hover:bg-gray-50/60 transition-colors duration-150"
                >
                  {/* Cột Logo */}
                  <td className="px-6 py-3.5 text-center">
                    <div className="w-12 h-12 mx-auto bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100 overflow-hidden shadow-2xs group">
                      {brand.image ? (
                        <img
                          src={brand.image}
                          alt={brand.name}
                          className="w-full h-full object-contain p-1 transition-transform duration-200 group-hover:scale-105"
                        />
                      ) : (
                        <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-tight">
                          GymBro
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Cột Tên thương hiệu & Slug */}
                  <td className="px-6 py-3.5">
                    <div className="font-bold text-[#14213D] leading-snug">
                      {brand.name}
                    </div>
                    {brand.slug && (
                      <div className="text-[11px] font-mono text-gray-400 mt-0.5 tracking-tight">
                        {brand.slug}
                      </div>
                    )}
                  </td>

                  {/* Cột Quốc gia */}
                  <td className="px-6 py-3.5 text-gray-600">
                    <div className="flex items-center gap-1.5 text-xs">
                      <Globe size={14} className="text-gray-400 shrink-0" />
                      <span className="font-medium">
                        {brand.country || "Chưa xác định"}
                      </span>
                    </div>
                  </td>

                  {/* Cột Số sản phẩm */}
                  <td className="px-6 py-3.5 text-center">
                    <span
                      className={`inline-flex items-center justify-center min-w-8 px-2 py-1 rounded-lg text-xs font-semibold ${
                        productCount > 0
                          ? "bg-amber-50 text-amber-700 border border-amber-200/50"
                          : "bg-gray-100 text-gray-400 border border-gray-200/50"
                      }`}
                    >
                      {productCount}
                    </span>
                  </td>

                  {/* Cột Trạng thái */}
                  <td className="px-6 py-3.5">
                    <button
                      type="button"
                      onClick={() => onToggleStatus?.(brand.id, brand.status)}
                      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                          : "bg-gray-100 text-gray-500 border border-gray-200/60"
                      }`}
                      title={isActive ? "Nhấp để ẩn" : "Nhấp để hiện"}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full flex items-center justify-center transition-transform ${
                          isActive ? "bg-emerald-600" : "bg-gray-400"
                        }`}
                      >
                        {isActive ? (
                          <Check size={9} className="text-white" />
                        ) : (
                          <X size={9} className="text-white" />
                        )}
                      </span>
                      <span>{isActive ? "Đang hiện" : "Đã ẩn"}</span>
                    </button>
                  </td>

                  {/* Cột Ngày cập nhật */}
                  <td className="px-6 py-3.5 text-gray-500 text-xs">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={13} className="text-gray-400 shrink-0" />
                      <span>{formatDate(brand.updatedAt || brand.UpdatedAt)}</span>
                    </div>
                  </td>

                  {/* Cột Thao tác */}
                  <td className="px-6 py-3.5">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onDetail(brand)}
                        className="p-1.5 rounded-lg text-sky-600 hover:bg-sky-50 active:scale-95 transition cursor-pointer"
                        title="Xem chi tiết"
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onEdit(brand)}
                        className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 active:scale-95 transition cursor-pointer"
                        title="Chỉnh sửa"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(brand)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 active:scale-95 transition cursor-pointer"
                        title="Xóa thương hiệu"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default BrandTable;