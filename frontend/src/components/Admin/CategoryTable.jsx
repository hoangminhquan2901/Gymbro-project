import React, { useState } from "react";
import {
  Eye,
  Pencil,
  Trash2,
  FolderOpen,
  CornerDownRight,
  Loader2,
  ChevronRight,
  ChevronDown,
} from "lucide-react";

function CategoryTable({
  roots = [],
  allCategories = [],
  expandedRoots = new Set(),
  onToggleExpand,
  loading = false,
  onDetail,
  onEdit,
  onDelete,
}) {
  // Helper kiểm tra danh mục gốc chuẩn
  const isRootCategoryHelper = (item) => {
    if (!item) return false;
    const parentCatId =
      item.ParentCategoryID ??
      item.parentCategoryID ??
      item.ParentID ??
      item.parent_id;
    const parentName = item.parent ?? item.parentName ?? item.ParentName;

    const hasNoParentId =
      parentCatId === null ||
      parentCatId === undefined ||
      parentCatId === 0 ||
      parentCatId === "" ||
      parentCatId === "0";
    const hasNoParentName =
      !parentName ||
      String(parentName).trim().toLowerCase() === "gốc" ||
      String(parentName).trim().toLowerCase() === "goc";

    return hasNoParentId && hasNoParentName;
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
      <table className="w-full text-left text-sm text-gray-600">
        <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-700 border-b border-gray-200">
          <tr>
            <th className="px-6 py-4">Hình ảnh</th>
            <th className="px-6 py-4">Tên danh mục</th>
            <th className="px-6 py-4">Phân loại</th>
            <th className="px-6 py-4 text-center">Số sản phẩm</th>
            <th className="px-6 py-4">Ngày cập nhật</th>
            <th className="px-6 py-4 text-center">Thao tác</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 bg-white">
          {loading ? (
            <tr>
              <td colSpan={6} className="py-12 text-center text-gray-400">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Loader2 size={28} className="animate-spin text-[#FCA311]" />
                  <span className="text-sm font-medium">Đang tải danh mục...</span>
                </div>
              </td>
            </tr>
          ) : roots.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="py-12 text-center text-gray-400 font-medium"
              >
                Chưa có danh mục nào.
              </td>
            </tr>
          ) : (
            roots.map((root) => {
              const rootId = String(root.CategoryID || root.id || root._id);
              const rootName = root.Name || root.name || "Chưa đặt tên";
              const rootImage = root.Image || root.image;
              const rootProductCount = root.productCount ?? 0;
              const rootUpdatedAt = root.UpdatedAt || root.updatedAt;

              // Lọc các danh mục con thuộc danh mục gốc này
              const children = allCategories.filter((sub) => {
                if (!sub || isRootCategoryHelper(sub)) return false;
                const subParentId = String(
                  sub.ParentCategoryID ??
                    sub.parentCategoryID ??
                    sub.ParentID ??
                    ""
                ).trim();
                const subParentName = String(
                  sub.parent ?? sub.parentName ?? sub.ParentName ?? ""
                )
                  .trim()
                  .toLowerCase();

                return (
                  subParentId === rootId ||
                  subParentName === rootName.trim().toLowerCase()
                );
              });

              const isExpanded = expandedRoots.has(rootId);
              const hasChildren = children.length > 0;

              return (
                <React.Fragment key={rootId}>
                  {/* --- 1. DÒNG DANH MỤC GỐC --- */}
                  <tr className="hover:bg-slate-50/80 transition-colors duration-150 font-medium bg-white">
                    {/* Hình ảnh */}
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        {hasChildren ? (
                          <button
                            onClick={() => onToggleExpand?.(rootId)}
                            className="p-1 rounded-md text-gray-400 hover:text-[#14213D] hover:bg-gray-100 transition cursor-pointer shrink-0"
                            title={isExpanded ? "Thu gọn danh mục con" : "Mở rộng danh mục con"}
                          >
                            {isExpanded ? (
                              <ChevronDown size={18} className="text-[#FCA311]" />
                            ) : (
                              <ChevronRight size={18} />
                            )}
                          </button>
                        ) : (
                          <span className="w-6 shrink-0" /> // Khoảng trống căn đều nếu không có con
                        )}
                        <CategoryImage src={rootImage} name={rootName} />
                      </div>
                    </td>

                    {/* Tên danh mục Gốc */}
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#14213D] text-base">
                          {rootName}
                        </span>
                        {hasChildren && (
                          <span
                            onClick={() => onToggleExpand?.(rootId)}
                            className="text-[11px] bg-amber-50 text-[#FCA311] px-2 py-0.5 rounded-full font-semibold border border-amber-200/60 cursor-pointer hover:bg-amber-100 transition"
                          >
                            {children.length} danh mục con
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Phân loại */}
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#14213D]/10 text-[#14213D] border border-[#14213D]/20">
                        Gốc
                      </span>
                    </td>

                    {/* Số sản phẩm */}
                    <td className="px-6 py-3 text-center font-semibold text-gray-700">
                      {rootProductCount}
                    </td>

                    {/* Ngày cập nhật */}
                    <td className="px-6 py-3 text-gray-500 text-xs">
                      {rootUpdatedAt
                        ? new Date(rootUpdatedAt).toLocaleDateString("vi-VN")
                        : "—"}
                    </td>

                    {/* Thao tác */}
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => onDetail?.(root)}
                          className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => onEdit?.(root)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Pencil size={18} />
                        </button>
                        <button
                          onClick={() => onDelete?.(root)}
                          className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          title="Xóa"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* --- 2. DÒNG DANH MỤC CON (HIỂN THỊ KHI ĐƯỢC MỞ RỘNG) --- */}
                  {isExpanded &&
                    hasChildren &&
                    children.map((child) => {
                      const childId = String(
                        child.CategoryID || child.id || child._id
                      );
                      const childName = child.Name || child.name || "Chưa đặt tên";
                      const childImage = child.Image || child.image;
                      const childProductCount = child.productCount ?? 0;
                      const childUpdatedAt = child.UpdatedAt || child.updatedAt;

                      return (
                        <tr
                          key={childId}
                          className="bg-slate-50/60 hover:bg-slate-100/80 transition-colors duration-150 border-t border-gray-100"
                        >
                          {/* Hình ảnh danh mục con */}
                          <td className="px-6 py-3 pl-12">
                            <div className="flex items-center gap-2">
                              <CornerDownRight
                                size={16}
                                className="text-gray-400 shrink-0"
                              />
                              <CategoryImage src={childImage} name={childName} />
                            </div>
                          </td>

                          {/* Tên danh mục con (thụt lề) */}
                          <td className="px-6 py-3">
                            <span className="font-semibold text-gray-700">
                              {childName}
                            </span>
                          </td>

                          {/* Phân loại con */}
                          <td className="px-6 py-3">
                            <span className="text-gray-700 font-semibold bg-amber-50/80 text-[#FCA311] px-2.5 py-1 rounded-lg border border-amber-200/50 inline-block text-xs">
                              Thuộc: {rootName}
                            </span>
                          </td>

                          {/* Số sản phẩm con */}
                          <td className="px-6 py-3 text-center font-medium text-gray-600">
                            {childProductCount}
                          </td>

                          {/* Ngày cập nhật */}
                          <td className="px-6 py-3 text-gray-500 text-xs">
                            {childUpdatedAt
                              ? new Date(childUpdatedAt).toLocaleDateString("vi-VN")
                              : "—"}
                          </td>

                          {/* Thao tác con */}
                          <td className="px-6 py-3">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => onDetail?.(child)}
                                className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer"
                                title="Xem chi tiết"
                              >
                                <Eye size={18} />
                              </button>
                              <button
                                onClick={() => onEdit?.(child)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                title="Chỉnh sửa"
                              >
                                <Pencil size={18} />
                              </button>
                              <button
                                onClick={() => onDelete?.(child)}
                                className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Xóa"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function CategoryImage({ src, name }) {
  const [imgError, setImgError] = useState(false);

  if (!src || imgError) {
    return (
      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200/60 shrink-0">
        <FolderOpen size={20} className="text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setImgError(true)}
      className="w-10 h-10 rounded-lg object-cover border border-gray-200 shadow-xs shrink-0"
    />
  );
}

export default CategoryTable;