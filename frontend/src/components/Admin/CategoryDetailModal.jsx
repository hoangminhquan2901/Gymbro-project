import React, { useEffect } from "react";
import {
  X,
  FolderTree,
  Package,
  Calendar,
  Clock,
  Layers,
  AlignLeft,
  Tag,
} from "lucide-react";

import { slugify } from "../../utils/slugify";

function CategoryDetailModal({ open, category, categories = [], onClose }) {
  // Đóng modal khi bấm phím ESC
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open || !category) return null;

  // 🛠️ 1. CHUẨN HÓA DỮ LIỆU CỦA CATEGORY (Fallback cả PascalCase & camelCase)
  const name = category.Name || category.name || "Chưa đặt tên";
  const image = category.Image || category.image;
  const description = category.Description || category.description;
  const productCount = category.ProductCount ?? category.productCount ?? 0;
  const slug = category.Slug || category.slug || (name ? slugify(name) : "");

  // Xử lý ngày tháng
  const createdAtRaw = category.CreatedAt || category.createdAt;
  const updatedAtRaw = category.UpdatedAt || category.updatedAt;
  const createdAt = createdAtRaw
    ? new Date(createdAtRaw).toLocaleDateString("vi-VN")
    : "Chưa ghi nhận";
  const updatedAt = updatedAtRaw
    ? new Date(updatedAtRaw).toLocaleDateString("vi-VN")
    : "Chưa ghi nhận";

  // 🛠️ 2. XỬ LÝ DANH MỤC CHA
  const parentId =
    category.ParentCategoryID ??
    category.parentCategoryID ??
    category.parentId ??
    category.parent;

  const directParentName =
    category.ParentName ||
    category.parentName ||
    (typeof category.parent === "string" ? category.parent : null);

  const isChild =
    parentId !== null &&
    parentId !== undefined &&
    parentId !== "" &&
    parentId !== 0 &&
    parentId !== "0" &&
    parentId !== "Gốc";

  let parentName = "Gốc";
  if (isChild) {
    if (directParentName && directParentName !== "Gốc") {
      parentName = directParentName;
    } else {
      // Tìm trong mảng danh mục truyền vào prop
      const parentObj = categories.find(
        (c) => String(c.CategoryID || c.id || c._id) === String(parentId)
      );
      parentName = parentObj
        ? parentObj.Name || parentObj.name
        : (directParentName || `ID: ${parentId}`);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-[#14213D]/40 backdrop-blur-xs flex justify-center items-center z-50 p-4 transition-all"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-[#FCA311]">
              <FolderTree size={22} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#14213D]">
                Chi tiết danh mục
              </h2>
              <p className="text-xs text-gray-500">
                Thông tin cấu hình và thống kê danh mục sản phẩm
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
            title="Đóng cửa sổ"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
          {/* KHU VỰC ẢNH VÀ THÔNG TIN CHÍNH */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-slate-50/80 border border-slate-100">
            {/* Display Image */}
            <div className="shrink-0">
              {image ? (
                <div className="w-36 h-36 rounded-xl border border-gray-200 bg-white p-2 flex items-center justify-center shadow-xs overflow-hidden">
                  <img
                    src={image}
                    alt={name}
                    className="w-full h-full object-contain hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ) : (
                <div className="w-36 h-36 rounded-xl border border-dashed border-gray-300 bg-white flex flex-col items-center justify-center text-gray-400">
                  <FolderTree size={44} className="stroke-[1.5] mb-1" />
                  <span className="text-[11px] font-medium">Không có ảnh</span>
                </div>
              )}
            </div>

            {/* Quick Header Info */}
            <div className="flex-1 text-center sm:text-left space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-200/60 text-slate-700 text-xs font-mono">
                <Tag size={12} className="text-slate-500" />
                <span>/{slug || "chua-co-slug"}</span>
              </div>

              <h3 className="text-2xl font-bold text-[#14213D] tracking-tight">
                {name}
              </h3>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                {/* Product Count Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-[#FCA311] font-bold text-xs shadow-2xs">
                  <Package size={14} />
                  <span>{productCount} sản phẩm</span>
                </div>

                {/* Parent Status Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 font-medium text-xs">
                  <Layers size={14} />
                  <span>
                    {isChild ? `Cha: ${parentName}` : "Danh mục gốc"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CHI TIẾT THÔNG TIN (GRID LAYOUT) */}
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 px-1">
              Thông tin chi tiết
            </h4>

            <div className="divide-y divide-gray-100 border-t border-b border-gray-100">
              <InfoRow
                icon={<FolderTree size={16} className="text-gray-400" />}
                title="Tên danh mục"
                value={
                  <span className="font-semibold text-[#14213D]">
                    {name}
                  </span>
                }
              />

              <InfoRow
                icon={<Layers size={16} className="text-gray-400" />}
                title="Danh mục cha"
                value={
                  isChild ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg bg-gray-100 text-gray-800 text-xs font-medium">
                      {parentName}
                    </span>
                  ) : (
                    <span className="text-gray-500 italic text-sm">
                      Danh mục gốc
                    </span>
                  )
                }
              />

              <InfoRow
                icon={<Package size={16} className="text-gray-400" />}
                title="Số sản phẩm"
                value={
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-[#FCA311] font-extrabold text-xs">
                    {productCount} sản phẩm
                  </span>
                }
              />

              <InfoRow
                icon={<Calendar size={16} className="text-gray-400" />}
                title="Ngày tạo"
                value={
                  <span className="text-gray-700 font-medium">
                    {createdAt}
                  </span>
                }
              />

              <InfoRow
                icon={<Clock size={16} className="text-gray-400" />}
                title="Cập nhật gần nhất"
                value={
                  <span className="text-gray-700 font-medium">
                    {updatedAt}
                  </span>
                }
              />
            </div>
          </div>

          {/* MÔ TẢ CHI TIẾT */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
              <AlignLeft size={14} />
              <span>Mô tả danh mục</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 text-sm text-gray-700 leading-relaxed break-words whitespace-pre-line">
              {description ? (
                description
              ) : (
                <span className="text-gray-400 italic">
                  Chưa có thông tin mô tả chi tiết cho danh mục này.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t border-gray-100 px-6 py-4 flex justify-end bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-[#14213D] hover:bg-[#1d335f] text-white font-bold text-sm rounded-xl shadow-md transition active:scale-95 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

// Sub-component hiển thị hàng thông tin định dạng Grid
function InfoRow({ icon, title, value }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] py-3.5 items-center gap-1 sm:gap-4 hover:bg-slate-50/50 px-1 rounded-lg transition-colors">
      <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
        {icon}
        <span>{title}</span>
      </div>
      <div className="text-sm text-[#14213D]">{value}</div>
    </div>
  );
}

export default CategoryDetailModal;