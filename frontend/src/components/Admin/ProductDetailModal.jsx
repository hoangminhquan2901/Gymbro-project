import React from "react";
import { X, Layers, Award, Target, Package, Tag } from "lucide-react";

// Ảnh SVG Data URI dạng No Image sạch sẽ, không gọi request mạng ngoài
const DEFAULT_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";

function ProductDetailModal({ isOpen, onClose, product }) {
  if (!isOpen || !product) return null;

  // Hỗ trợ đồng bộ linh hoạt các trường dữ liệu chữ hoa/chữ thường từ backend (ID, Name, Price,...)
  const productId = product.ProductID || product.productID || product.id;
  const productName = product.Name || product.name;
  const productPrice = product.Price !== undefined ? product.Price : product.price;
  const productImage = product.Image || product.image;
  
  const productCategory = product.CategoryName || product.categoryName || product.category;
  const productBrand = product.BrandName || product.brandName || product.brand;
  const productSubCategory = product.SubCategoryName || product.subCategoryName || product.subCategory;

  // Chuẩn hóa Goals & Flavors từ nhiều định dạng khác nhau
  const rawGoals = product.Goals || product.goals || [];
  const rawFlavors = product.Flavors || product.flavors || [];

  // Tính tổng tồn kho chính xác dựa trên danh sách vị
  const totalStock = rawFlavors.reduce(
    (sum, f) => sum + (parseInt(f.Stock !== undefined ? f.Stock : f.stock, 10) || 0),
    0
  );

  return (
    <div className="fixed inset-0 bg-[#000a24]/30 backdrop-blur-sm z-50 flex items-center justify-center p-4 transition-opacity">
      {/* Modal Container */}
      <div className="relative bg-[#ffffff] w-full max-w-xl rounded-xl shadow-xl border border-[#c5c6ce] z-50 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* HEADER */}
        <div className="px-6 py-4 bg-[#14213d] text-[#ffffff] flex justify-between items-center border-b border-[#00243b] sticky top-0 z-10">
          <div className="space-y-1 pr-4">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-semibold bg-[#ffffff]/15 text-[#6cf8bb] px-2 py-0.5 rounded border border-[#ffffff]/20 tracking-wide">
                ID: {productId || "N/A"}
              </span>
            </div>
            <h2 className="text-lg font-bold text-[#ffffff] leading-snug m-0">
              {productName || "Chi tiết sản phẩm"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-full hover:bg-[#ffffff]/10 text-[#c5c6ce] hover:text-[#ffffff] transition-colors cursor-pointer shrink-0"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY - SCROLLABLE */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#ffffff]">
          
          {/* KHỐI 1: ẢNH & THÔNG TIN CƠ BẢN */}
          <div className="flex gap-5 items-start pb-5 border-b border-[#e4e2e5]">
            <div className="w-28 h-28 rounded-lg border border-[#c5c6ce] bg-[#f5f3f6] overflow-hidden shrink-0 shadow-sm flex items-center justify-center">
              <img
                src={productImage || DEFAULT_IMAGE}
                alt={productName || "Product image"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null; // Ngăn vòng lặp vô hạn
                  e.target.src = DEFAULT_IMAGE;
                }}
              />
            </div>

            <div className="space-y-3 flex-1">
              <div>
                <span className="text-xs uppercase font-semibold text-[#75777e] tracking-wider block">
                  Giá Bán Niêm Yết
                </span>
                <span className="text-2xl font-bold text-[#ba1a1a] tracking-tight">
                  {parseInt(productPrice || 0, 10).toLocaleString("vi-VN")}
                  <span className="text-base ml-0.5">đ</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 text-[#1b1b1e] bg-[#f5f3f6] px-2.5 py-1.5 rounded border border-[#e4e2e5]">
                  <Layers size={16} className="text-[#00243b] shrink-0" />
                  <span className="font-medium truncate" title={productCategory}>
                    {productCategory || "Chưa chọn"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[#1b1b1e] bg-[#f5f3f6] px-2.5 py-1.5 rounded border border-[#e4e2e5]">
                  <Award size={16} className="text-[#00714d] shrink-0" />
                  <span className="font-medium truncate" title={productBrand}>
                    {productBrand || "Chưa chọn"}
                  </span>
                </div>
              </div>

              {productSubCategory && (
                <div className="inline-flex items-center gap-1.5 text-xs text-[#45464d] bg-[#fbf8fb] px-2.5 py-1 rounded border border-[#c5c6ce]">
                  <Tag size={13} className="text-[#75777e]" />
                  <span>
                    Phân loại phụ:{" "}
                    <strong className="text-[#000a24] font-semibold">
                      {productSubCategory}
                    </strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* KHỐI 2: CHIP SELECTION MỤC TIÊU SỨC KHỎE */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase text-[#14213d] flex items-center gap-1.5 tracking-wider">
              <Target size={15} className="text-[#00714d]" /> Mục Tiêu & Nhu Cầu Hỗ Trợ
            </h3>
            
            <div className="flex flex-wrap gap-2 pt-1">
              {rawGoals && rawGoals.length > 0 ? (
                rawGoals.map((goal, idx) => {
                  const goalName = typeof goal === "object" && goal !== null ? (goal.Name || goal.name) : goal;
                  return (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full text-xs font-semibold bg-[#6cf8bb]/20 text-[#00714d] border border-[#6cf8bb] shadow-2xs"
                    >
                      {goalName}
                    </span>
                  );
                })
              ) : (
                <span className="text-xs text-[#75777e] italic bg-[#f5f3f6] px-3 py-1.5 rounded border border-[#e4e2e5] block w-full text-center">
                  Chưa thiết lập mục tiêu hỗ trợ cho sản phẩm này
                </span>
              )}
            </div>
          </div>

          {/* KHỐI 3: QUẢN LÝ HƯƠNG VỊ & TỒN KHO BIỆT LẬP */}
          <div className="bg-[#fbf8fb] rounded-xl p-4 border border-[#c5c6ce] space-y-3">
            <div className="flex justify-between items-center border-b border-[#e4e2e5] pb-2.5">
              <h3 className="text-xs font-bold uppercase text-[#000a24] flex items-center gap-1.5 tracking-wider">
                <Package size={15} className="text-[#00243b]" /> Chi Tiết Tồn Kho Theo Hương Vị
              </h3>
              
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                  totalStock > 0
                    ? "bg-[#6cf8bb]/30 text-[#00714d] border-[#6cf8bb]"
                    : "bg-[#ffdad6] text-[#ba1a1a] border-[#ffdad6]"
                }`}
              >
                Tổng kho: {totalStock}
              </span>
            </div>

            <div className="divide-y divide-[#e4e2e5] max-h-[160px] overflow-y-auto pr-1">
              {rawFlavors && rawFlavors.length > 0 ? (
                rawFlavors.map((flv, idx) => {
                  const flavorName = flv.FlavorName || flv.flavorName || flv.name || "Hương vị mặc định";
                  const stockNum = parseInt(flv.Stock !== undefined ? flv.Stock : flv.stock, 10) || 0;
                  return (
                    <div
                      key={idx}
                      className="flex justify-between items-center py-2 text-sm hover:bg-[#ffffff]/60 px-2 rounded transition-colors"
                    >
                      <span className="font-medium text-[#1b1b1e]">
                        {flavorName}
                      </span>
                      <span
                        className={`font-semibold ${
                          stockNum === 0
                            ? "text-[#ba1a1a] font-bold"
                            : "text-[#000a24]"
                        }`}
                      >
                        {stockNum} <span className="text-xs font-normal text-[#75777e]">hộp</span>
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 text-xs text-[#75777e] italic">
                  Chưa cập nhật danh sách hương vị
                </div>
              )}
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="px-6 py-3.5 border-t border-[#e4e2e5] bg-[#fbf8fb] flex justify-end sticky bottom-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#ffffff] hover:bg-[#e4e2e5] border border-[#c5c6ce] text-[#000a24] rounded-lg text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer shadow-2xs"
          >
            Đóng 
          </button>
        </div>

      </div>
    </div>
  );
}

export default ProductDetailModal;