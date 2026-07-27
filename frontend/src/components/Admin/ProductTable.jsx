import React from "react";
import { Eye, Edit2, Trash2, ImageOff } from "lucide-react";

// ✅ HÀM ÉP KIỂU TRẠNG THÁI DB SANG BOOLEAN (ĐỒNG BỘ CẢ 2 FILE)
const parseDbStatus = (rawStatus) => {
  if (rawStatus === undefined || rawStatus === null) return true;
  if (typeof rawStatus === "boolean") return rawStatus;
  if (typeof rawStatus === "number") return rawStatus === 1;
  if (typeof rawStatus === "string") {
    const lower = rawStatus.trim().toLowerCase();
    return lower === "true" || lower === "1" || lower === "active";
  }
  return true;
};

function ProductTable({ products = [], onValues = {}, onToggleStatus }) {
  const { onView, onEdit, onDelete } = onValues;

  // 1. Tính tổng số lượng tồn kho (Parse an toàn cả chuỗi JSON nếu có)
  const calculateTotalStock = (product) => {
    if (!product) return 0;
    let flavList = product.Flavors || product.flavors || [];

    if (typeof flavList === "string") {
      try {
        flavList = JSON.parse(flavList);
      } catch (e) {
        flavList = [];
      }
    }

    if (Array.isArray(flavList) && flavList.length > 0) {
      return flavList.reduce((sum, f) => {
        const val = f.Stock ?? f.stock ?? f.quantity ?? f.Quantity ?? 0;
        return sum + (Number(val) || 0);
      }, 0);
    }

    const directStock = product.Stock ?? product.stock ?? product.quantity ?? product.Quantity ?? 0;
    return Number(directStock) || 0;
  };

  // 2. Xử lý khi Admin bấm nút Toggle
  const handleToggleClick = (e, product, currentIsAvailable) => {
    e.stopPropagation();

    const id = product.ProductID || product.id || product._id || product.code;
    const totalStock = calculateTotalStock(product);

    // TRƯỜNG HỢP 1: Tồn kho = 0 -> Không cho bật
    if (totalStock === 0) {
      alert(
        "Sản phẩm đang có số lượng tồn kho bằng 0.\nVui lòng cập nhật thêm số lượng tồn kho (Stock) trước khi bật lại trạng thái 'Còn hàng'!"
      );
      return;
    }

    // TRƯỜNG HỢP 2: Đổi trạng thái và gửi lên Component Cha
    const newStatus = !currentIsAvailable;

    if (typeof onToggleStatus === "function") {
      onToggleStatus({
        ProductID: id,
        Status: newStatus,
      });
    }
  };

  // Render Badge Tồn kho
  const renderStockBadge = (stock) => {
    if (stock === 0) {
      return (
        <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold text-xs">
          0 (Hết)
        </span>
      );
    }
    if (stock <= 10) {
      return (
        <span
          className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold text-xs"
          title="Sắp hết hàng"
        >
          {stock} (Sắp hết)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold text-xs">
        {stock}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-[0px_10px_15px_-3px_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-semibold text-xs uppercase tracking-wider">
              <th className="p-4">Hình ảnh</th>
              <th className="p-4">Mã SP</th>
              <th className="p-4">Tên sản phẩm</th>
              <th className="p-4 text-right">Giá</th>
              <th className="p-4 text-center">Tồn kho</th>
              <th className="p-4 text-center">Trạng thái</th>
              <th className="p-4 text-center">Thao tác</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 text-sm">
            {products.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-12 text-center text-gray-400 italic">
                  Chưa có sản phẩm nào trong kho.
                </td>
              </tr>
            ) : (
              products.map((product, index) => {
                const productId =
                  product.ProductID || product.id || product._id || product.code;
                const rowKey = productId || `product-item-${index}`;

                const productName = product.Name || product.name || "Chưa đặt tên";
                const productPrice =
                  product.Price !== undefined ? product.Price : product.price || 0;
                const rawImage =
                  product.Image ||
                  product.image ||
                  product.img ||
                  product.imagePreview ||
                  product.previewImage ||
                  "";
                const subCategory = product.SubCategoryName || product.subCategory || "";

                const totalStock = calculateTotalStock(product);
                const isOutOfStock = totalStock === 0;

                // Tính toán trạng thái hiển thị bằng parseDbStatus chuẩn hóa
                const isDbActive = parseDbStatus(
                  product.Status !== undefined ? product.Status : product.status
                );
                const isAvailable = isOutOfStock ? false : isDbActive;

                const isValidImage = rawImage && typeof rawImage === "string";

                return (
                  <tr
                    key={rowKey}
                    className="hover:bg-gray-50/60 transition-colors group"
                  >
                    {/* 1. Hình ảnh */}
                    <td className="p-4 w-24">
                      {isValidImage ? (
                        <img
                          src={rawImage}
                          alt={productName}
                          className={`w-16 h-16 object-cover rounded-lg border border-gray-200 bg-gray-50 transition-opacity ${
                            isOutOfStock ? "opacity-60" : ""
                          }`}
                          onError={(e) => {
                            e.target.style.display = "none";
                            const parent = e.target.parentElement;
                            if (parent && !parent.querySelector(".fallback-box")) {
                              const fallbackDiv = document.createElement("div");
                              fallbackDiv.className =
                                "fallback-box w-16 h-16 rounded-lg border border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-gray-400 text-[10px] font-medium";
                              fallbackDiv.innerHTML = "<span>No Img</span>";
                              parent.appendChild(fallbackDiv);
                            }
                          }}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg border border-gray-200 bg-gray-50 flex flex-col items-center justify-center text-gray-400 text-[10px] font-medium gap-0.5">
                          <ImageOff size={16} className="text-gray-300" />
                          <span>No Img</span>
                        </div>
                      )}
                    </td>

                    {/* 2. Mã SP */}
                    <td className="p-4 w-32">
                      <span className="font-mono text-xs text-gray-400">
                        {productId || `#${index + 1}`}
                      </span>
                    </td>

                    {/* 3. Tên sản phẩm */}
                    <td className="p-4">
                      <div
                        className={`font-bold text-base text-[#14213D] group-hover:text-blue-900 transition-all ${
                          isOutOfStock ? "opacity-60 group-hover:opacity-100" : ""
                        }`}
                      >
                        {productName}
                      </div>
                      {subCategory && (
                        <div className="text-gray-400 text-xs mt-0.5 font-medium">
                          {subCategory}
                        </div>
                      )}
                    </td>

                    {/* 4. Giá */}
                    <td className="p-4 text-right w-40">
                      <div
                        className={`font-bold text-base text-red-600 ${
                          isOutOfStock ? "opacity-60" : ""
                        }`}
                      >
                        {parseInt(productPrice, 10).toLocaleString("vi-VN")}đ
                      </div>
                    </td>

                    {/* 5. Tồn kho */}
                    <td className="p-4 text-center w-32 whitespace-nowrap">
                      {renderStockBadge(totalStock)}
                    </td>

                    {/* 6. Trạng thái (Nút Toggle) */}
                    <td className="p-4 text-center w-36 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleToggleClick(e, product, isAvailable)}
                          title={
                            isOutOfStock
                              ? "Sản phẩm đã hết hàng trong kho"
                              : isAvailable
                              ? "Đang bán (Bấm để chuyển thành Hết hàng)"
                              : "Đang ẩn/Tắt (Bấm để mở bán lại)"
                          }
                          className={`w-10 h-6 rounded-full relative flex items-center transition-colors duration-200 outline-none ${
                            isOutOfStock
                              ? "bg-gray-200 cursor-not-allowed opacity-70"
                              : isAvailable
                              ? "bg-emerald-600 cursor-pointer"
                              : "bg-gray-300 cursor-pointer"
                          }`}
                        >
                          <span
                            className={`w-4 h-4 bg-white rounded-full absolute shadow-md transition-transform duration-200 ${
                              isAvailable ? "right-1" : "left-1"
                            }`}
                          />
                        </button>
                        <span
                          className={`text-xs font-semibold w-20 text-left ${
                            isAvailable ? "text-emerald-600" : "text-gray-400"
                          }`}
                        >
                          {isAvailable ? "Còn hàng" : "Hết hàng"}
                        </span>
                      </div>
                    </td>

                    {/* 7. Thao tác */}
                    <td className="p-4 w-36 whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          title="Chi tiết"
                          onClick={() => onView && onView(product)}
                          className="p-1.5 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded-md transition-all hover:scale-110 active:scale-95 cursor-pointer"
                        >
                          <Eye size={18} />
                        </button>

                        <button
                          type="button"
                          title="Sửa"
                          onClick={() => onEdit && onEdit(product)}
                          className="p-1.5 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-all hover:scale-110 active:scale-95 cursor-pointer"
                        >
                          <Edit2 size={18} />
                        </button>

                        <button
                          type="button"
                          title="Xóa"
                          onClick={() => onDelete && onDelete(productId)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-all hover:scale-110 active:scale-95 cursor-pointer"
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
    </div>
  );
}

export default ProductTable;