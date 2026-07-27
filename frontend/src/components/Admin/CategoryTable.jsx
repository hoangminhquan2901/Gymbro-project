import React, { useState } from "react";
import {
  Eye,
  Pencil,
  Trash2,
  FolderOpen,
  CornerDownRight,
  Loader2,
} from "lucide-react";

function CategoryTable({
  categories = [],
  loading = false, // 🔥 Prop loading xử lý trạng thái chờ Axios API
  onDetail,
  onEdit,
  onDelete,
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm bg-white">
      <table className="w-full text-left text-sm text-gray-600">
        <thead className="bg-gray-50 text-xs font-semibold uppercase tracking-wider text-gray-700 border-b border-gray-200">
          <tr>
            <th className="px-6 py-4">Hình ảnh</th>
            <th className="px-6 py-4">Tên danh mục</th>
            <th className="px-6 py-4">Danh mục cha</th>
            <th className="px-6 py-4 text-center">Số sản phẩm</th>
            <th className="px-6 py-4">Ngày cập nhật</th>
            <th className="px-6 py-4 text-center">Thao tác</th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 bg-white">
          {/* 🔥 1. TRẠNG THÁI LOADING (SKELETON / SPINNER) */}
          {loading ? (
            <tr>
              <td colSpan={6} className="py-12 text-center text-gray-400">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Loader2 size={28} className="animate-spin text-[#FCA311]" />
                  <span className="text-sm font-medium">Đang tải danh mục...</span>
                </div>
              </td>
            </tr>
          ) : categories.length === 0 ? (
            /* 2. TRẠNG THÁI TRỐNG DỮ LIỆU */
            <tr>
              <td
                colSpan={6}
                className="py-12 text-center text-gray-400 font-medium"
              >
                Chưa có danh mục nào.
              </td>
            </tr>
          ) : (
            /* 3. HIỂN THỊ DỮ LIỆU */
            categories.map((category) => {
              // 1. Chuẩn hóa các trường dữ liệu (Hỗ trợ cả PascalCase từ Backend và camelCase)
              const id = category.CategoryID || category.id || category._id;
              const name = category.Name || category.name || "Chưa đặt tên";
              const image = category.Image || category.image;
              const parentId =
                category.ParentCategoryID ??
                category.parentCategoryID ??
                category.parentId ??
                category.parent;
              const productCount =
                category.ProductCount ?? category.productCount ?? 0;
              const updatedAt = category.UpdatedAt || category.updatedAt;

              // Tên danh mục cha trực tiếp từ API (nếu Backend có JOIN)
              const directParentName =
                category.ParentName ||
                category.parentName ||
                (typeof category.parent === "string" ? category.parent : null);

              // 2. Xử lý logic kiểm tra Danh mục cha / con
              const isChild =
                parentId !== null &&
                parentId !== undefined &&
                parentId !== "" &&
                parentId !== 0 &&
                parentId !== "0" &&
                parentId !== "Gốc";

              const level = category.level ?? (isChild ? 1 : 0);

              // 3. 🎯 SỬA LỖI HIỂN THỊ TÊN CHA:
              let parentName = "Gốc";
              if (isChild) {
                if (directParentName && directParentName !== "Gốc") {
                  parentName = directParentName;
                } else {
                  // Ép kiểu String() khi so sánh ID để tránh lỗi Number vs String ("2" === 2 -> false)
                  const parentObj = categories.find(
                    (c) =>
                      String(c.CategoryID || c.id || c._id) === String(parentId)
                  );
                  
                  parentName = parentObj
                    ? parentObj.Name || parentObj.name
                    : (directParentName || `ID: ${parentId}`);
                }
              }

              return (
                <tr
                  key={id}
                  className="hover:bg-slate-50/80 transition-colors duration-150"
                >
                  {/* 1. Hình ảnh */}
                  <td className="px-6 py-3">
                    <CategoryImage src={image} name={name} />
                  </td>

                  {/* 2. Tên danh mục */}
                  <td className="px-6 py-3">
                    <div
                      className="flex items-center gap-2"
                      style={{
                        paddingLeft: `${Math.min(level, 3) * 1.25}rem`,
                      }}
                    >
                      {isChild && (
                        <CornerDownRight
                          size={16}
                          className="text-gray-400 shrink-0 -mt-1"
                        />
                      )}
                      <span
                        className={`font-semibold ${
                          isChild ? "text-gray-700" : "text-[#14213D]"
                        }`}
                      >
                        {name}
                      </span>
                    </div>
                  </td>

                  {/* 3. Danh mục cha */}
                  <td className="px-6 py-3">
                    {isChild ? (
                      <span className="text-gray-700 font-semibold bg-amber-50 text-[#FCA311] px-2.5 py-1 rounded-lg border border-amber-200/60 inline-block">
                        {parentName}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#14213D]/10 text-[#14213D] border border-[#14213D]/20">
                        Gốc
                      </span>
                    )}
                  </td>

                  {/* 4. Số sản phẩm */}
                  <td className="px-6 py-3 text-center font-medium text-gray-700">
                    {productCount}
                  </td>

                  {/* 5. Ngày cập nhật */}
                  <td className="px-6 py-3 text-gray-500 text-xs">
                    {updatedAt
                      ? new Date(updatedAt).toLocaleDateString("vi-VN")
                      : "—"}
                  </td>

                  {/* 6. Thao tác */}
                  <td className="px-6 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onDetail?.(category)}
                        className="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition"
                        title="Xem chi tiết"
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        onClick={() => onEdit?.(category)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        title="Chỉnh sửa"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => onDelete?.(category)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                        title="Xóa"
                      >
                        <Trash2 size={18} />
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

// 🛑 Sub-component phụ trách hiển thị ảnh an toàn (Tránh vỡ layout khi link ảnh bị chết)
function CategoryImage({ src, name }) {
  const [imgError, setImgError] = useState(false);

  if (!src || imgError) {
    return (
      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200/60 shrink-0">
        <FolderOpen size={24} className="text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={name}
      onError={() => setImgError(true)}
      className="w-12 h-12 rounded-lg object-cover border border-gray-200 shadow-xs shrink-0"
    />
  );
}

export default CategoryTable;