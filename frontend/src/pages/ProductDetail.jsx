import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";
import { slugify } from "../utils/slugify";
import { useCart } from "../context/CartContext";

import { getWebsiteProducts } from "../services/productService";
import { getWebsiteCategories } from "../services/categoryService";

import { getMaxStockForProduct } from "../utils/stockHelper";

// Hàm định dạng giá chuẩn thập phân từ Backend (.00)
const formatPrice = (price) => {
  if (price === undefined || price === null || price === "") return "";
  
  if (typeof price === "string" && price.endsWith("đ")) return price;

  const numericValue = typeof price === "number" 
    ? price 
    : parseFloat(price);

  if (isNaN(numericValue) || numericValue === 0) return price || "Liên hệ";

  return Math.round(numericValue).toLocaleString("vi-VN") + "đ";
};

export default function ProductDetail() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(0);
  
  const [selectedFlavor, setSelectedFlavor] = useState(null);
  const [flavorError, setFlavorError] = useState(false);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch dữ liệu sản phẩm & danh mục từ Backend/MySQL
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const prods = await getWebsiteProducts();
        const cats = await getWebsiteCategories();
        setProducts(Array.isArray(prods) ? prods : []);
        setCategories(Array.isArray(cats) ? cats : []);
      } catch (error) {
        console.error("Lỗi tải chi tiết sản phẩm:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  // Tìm sản phẩm khớp với ID từ URL
  const foundProduct = (Array.isArray(products) ? products : []).find(
    (item) => String(item?.ProductID || item?.id || item?._id) === String(id)
  );

  const product = foundProduct ?? {
    id,
    Name: `Sản phẩm #${id}`,
    price: 0,
    Image: null,
    subCategory: "",
    category: "",
    brand: "",
    flavors: [],
    sizes: [],
    description: "",
  };

  // Chuẩn hóa thông tin hiển thị chính từ DB
  const productName = product.Name || product.name || "Sản phẩm chưa có tên";
  const productImage = product.Image || product.image || product.img;
  
  const productBrand = 
    product.brand || 
    product.Brand || 
    product.BrandName || 
    product.brandName || 
    product.manufacturer || 
    product.hang || 
    product.thuongHieu || 
    (productName ? productName.split(" ")[0] : "GymBro");

  const rawPrice = product.Price ?? product.price ?? product.PriceSell ?? product.priceSell ?? 0;
  
  // Trích xuất subCategory, categoryName và categoryId theo cấu trúc mới
  const subCatName =
    product.SubCategoryName ||
    product.subCategoryName ||
    product.subCategory ||
    product.SubCategory ||
    product.subcategory ||
    "";

  const categoryName =
    product.CategoryName ||
    product.categoryName ||
    product.Category ||
    product.category ||
    "";

  const categoryId =
    product.CategoryID ||
    product.categoryId;

  const parentCategory = (Array.isArray(categories) ? categories : []).find((item) => {
    return (
        String(item.CategoryID) === String(categoryId) ||
        String(item.id) === String(categoryId)
    );
  });

  const categoryDisplayName =
    parentCategory?.Name ||
    parentCategory?.name ||
    categoryName;

  // ĐỒNG BỘ ĐƯỜNG DẪN BREADCRUMB
  const breadcrumbs = [
    {
        label: "Trang chủ",
        path: "/",
    },
    {
        label: "Thực phẩm bổ sung",
        path: "/category/thuc-pham-bo-sung",
    },

    categoryDisplayName && {
        label: categoryDisplayName,
        path: `/category/${slugify(categoryDisplayName)}`
    },

    subCatName &&
    subCatName !== categoryDisplayName && {
        label: subCatName,
        path: `/category/${slugify(subCatName)}`
    },

    {
        label: productName
    }
  ].filter(Boolean);

  // --- HÀM PARSE HƯƠNG VỊ ĐA DẠNG KIỂU DỮ LIỆU TỪ ADMIN ---
  const parseFlavors = (flavorsData) => {
    if (!flavorsData) return [];
    let data = flavorsData;

    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch (e) {
        return [{ id: 1, name: data, stock: 10 }];
      }
    }

    if (Array.isArray(data)) {
      return data.map((item, index) => {
        if (typeof item === "string") return { id: index + 1, name: item, stock: 10 };
        if (typeof item === "object" && item !== null) {
          const knownName = item.name || item.flavor || item.flavorName || item.title || item.label || item.value || item.ten || item.tenHuongVi;
          const knownId = item.FlavorID || item.flavorId || item.id || item.ID || (index + 1);

          if (knownName) {
            return {
                id: Number(knownId),
                name: String(knownName),
                stock: Number(item.Stock ?? item.stock ?? item.Quantity ?? item.quantity ?? item.soLuong ?? 0),
            };
          }
          const stringValue = Object.values(item).find((val) => typeof val === "string" && val.trim() !== "");
          return {
              id: Number(knownId),
              name: stringValue ? String(stringValue) : `Vị ${index + 1}`,
              stock: Number(item.Stock ?? item.stock ?? item.Quantity ?? item.quantity ?? item.soLuong ?? 0),
          };
        }
        return { id: index + 1, name: String(item), stock: 10 };
      });
    }

    if (typeof data === "object" && data !== null) {
      return Object.entries(data).map(([key, val], index) => {
        const stockNum = typeof val === "number" ? val : val?.stock ?? 10;
        const flavorId = val?.FlavorID || val?.flavorId || val?.id || (index + 1);
        return { id: Number(flavorId), name: key, stock: stockNum };
      });
    }

    return [];
  };

  const productFlavors = parseFlavors(product.flavors || product.Flavors);

  // Xử lý Dung lượng / Quy cách từ Admin
  const productSizes = Array.isArray(product.sizes) && product.sizes.length > 0
    ? product.sizes
    : [
        {
          label: product.weight || product.size || product.Weight || product.Size || "Hộp tiêu chuẩn",
          price: rawPrice,
          inStock: (product.stock ?? product.Stock ?? product.quantity ?? product.Quantity ?? 1) > 0,
        },
      ];

  const currentFlavorObj = selectedFlavor !== null ? productFlavors[selectedFlavor] : null;
  const currentSizeObj = productSizes[selectedSize] || productSizes[0];
  const currentPrice = currentSizeObj?.price ?? rawPrice;

  // Kiểm tra trạng thái hoạt động của sản phẩm từ Admin
  const productStatus =
    product.Status ??
    product.status ??
    "active";

  const isProductActive =
    typeof productStatus === "boolean"
        ? productStatus
        : String(productStatus).toLowerCase() === "active" ||
          String(productStatus) === "1" ||
          String(productStatus).toLowerCase() === "true";

  const isOutOfStock =
    !isProductActive ||
    (currentFlavorObj && currentFlavorObj.stock <= 0) ||
    (currentSizeObj?.inStock === false);

  // Lấy tồn kho an toàn, tránh lỗi từ stockHelper
  const getSafeMaxStock = () => {

    // Nếu đã chọn hương vị
    if (currentFlavorObj) {

        return Number(currentFlavorObj.stock || 0);
    }

    // Nếu chưa có hương vị
    if (productFlavors.length > 0) {

        return 0;
    }

    return Number(
        product.Stock ??
        product.stock ??
        product.Quantity ??
        product.quantity ??
        0
    );
};

  // --- XỬ LÝ TĂNG SỐ LƯỢNG ---
  const handleIncreaseQuantity = () => {
    if (!isProductActive) {
        return;
    }

    const maxStock = getSafeMaxStock();
    if (quantity >= maxStock) {
      alert(`Rất tiếc! Số lượng trong kho chỉ còn lại ${maxStock} sản phẩm cho phân loại này.`);
      return;
    }
    setQuantity((q) => q + 1);
  };

  // --- HÀM XỬ LÝ THÊM VÀO GIỎ HÀNG ---
  const handleAddToCart = async () => {
    if (!isProductActive) {
        alert("Sản phẩm hiện đã ngừng kinh doanh.");
        return;
    }

    if (productFlavors.length > 0 && selectedFlavor === null) {
      setFlavorError(true);
      return;
    }

    setFlavorError(false);

    const flavorName = currentFlavorObj?.name || "Mặc định";
    // Lấy chính xác FlavorID từ database (nếu không có thì mặc định là 1)
    const flavorId = currentFlavorObj?.id || 1; 

    const maxStock = getSafeMaxStock();

    if (quantity > maxStock) {
      alert(`Số lượng bạn chọn vượt quá tồn kho thực tế (${maxStock} sản phẩm)!`);
      return;
    }

    try {
      // Truyền đầy đủ object chứa thông tin sản phẩm + hương vị
      await addToCart(
        {
          id: product.ProductID || product.id || product._id,
          name: productName,
          price: currentPrice,
          image: productImage,
          flavor: flavorName,
          flavorId: flavorId, // 👈 ĐÃ BỔ SUNG FLAVOR ID Ở ĐÂY
          size: currentSizeObj?.label || "Tiêu chuẩn",
        },
        quantity
      );
      alert("Đã thêm sản phẩm vào giỏ hàng thành công!");
    } catch (err) {
      console.error("Lỗi thêm vào giỏ hàng:", err);
      alert("Không thể thêm vào giỏ hàng, vui lòng thử lại!");
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-lg font-medium">Đang tải thông tin sản phẩm...</div>;
  }

  return (
    <div className="min-h-screen bg-[#E5E5E5] text-[#000000]">
      <div className="max-w-[1400px] mx-auto px-6 py-8">

        {/* BREADCRUMB */}
        <Breadcrumb items={breadcrumbs} />

        {/* THÔNG TIN CHÍNH */}
        <div className="bg-white border border-[#14213D]/10 rounded-2xl p-8 mt-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

            {/* LEFT — ẢNH SẢN PHẨM */}
            <div className="w-full aspect-square rounded-xl overflow-hidden bg-[#E5E5E5]/30 border border-[#14213D]/10 flex items-center justify-center p-4">
              {productImage ? (
                <img
                  src={productImage}
                  alt={productName}
                  className="max-h-full max-w-full object-contain hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="text-gray-400 text-sm font-semibold uppercase">[ Chưa có ảnh sản phẩm ]</div>
              )}
            </div>

            {/* RIGHT — THÔNG TIN CHI TIẾT */}
            <div className="flex flex-col gap-4">

              {/* Danh mục & Phân loại phụ */}
              <div className="flex flex-wrap items-center gap-2">
                {categoryDisplayName && (
                  <span className="text-[11px] bg-[#14213D] text-white px-3 py-1 rounded font-bold uppercase tracking-wider">
                    {categoryDisplayName}
                  </span>
                )}
                {subCatName && (
                  <span className="text-[11px] bg-[#E5E5E5] border border-[#14213D]/20 text-[#14213D] px-3 py-1 rounded font-semibold uppercase tracking-wider">
                    {subCatName}
                  </span>
                )}
              </div>

              {/* Tên sản phẩm */}
              <h1 className="text-2xl md:text-3xl font-black text-[#14213D] uppercase leading-tight">
                {productName}
              </h1>

              {/* Thương hiệu & Mã SP */}
              <div className="flex items-center gap-6 text-sm">
                <p className="text-[#000000]/70">
                  Thương hiệu: <span className="font-bold text-[#FCA311]">{productBrand}</span>
                </p>
                <p className="text-[#000000]/70">
                  Mã sản phẩm: <span className="font-bold text-[#14213D]">#{product.ProductID || product.id || id}</span>
                </p>
              </div>

              {/* GIÁ BÁN CHÍNH */}
              <div className="text-3xl font-black text-[#FCA311]">
                {formatPrice(currentPrice)}
              </div>

              {/* HIỂN THỊ TRẠNG THÁI HẾT HÀNG / NGỪNG KINH DOANH */}
              {!isProductActive && (
                <div className="mt-2 inline-block bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-bold w-fit">
                  Hết hàng / Ngừng kinh doanh
                </div>
              )}

              {/* TÙY CHỌN DUNG LƯỢNG / QUY CÁCH */}
              {productSizes.length > 0 && (
                <div className="border-t border-[#14213D]/10 pt-4">
                  <p className="text-sm font-bold text-[#14213D] mb-2 uppercase tracking-wide">Dung lượng / Quy cách:</p>
                  <div className="grid grid-cols-2 gap-3">
                    {productSizes.map((size, i) => (
                      <button
                        key={i}
                        disabled={size.inStock === false}
                        onClick={() => setSelectedSize(i)}
                        className={`relative p-3 rounded-xl border-2 text-left transition-all ${
                          size.inStock === false
                            ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed text-gray-400"
                            : selectedSize === i
                            ? "border-[#FCA311] bg-[#FCA311]/10 text-[#000000]"
                            : "border-[#14213D]/20 hover:border-[#FCA311] text-[#000000]"
                        } cursor-pointer`}
                      >
                        {selectedSize === i && size.inStock !== false && (
                          <span className="absolute -top-2.5 left-2 text-[10px] bg-[#FCA311] text-[#14213D] px-2 py-0.5 rounded-full font-extrabold">
                            ✓ Đang chọn
                          </span>
                        )}
                        <p className="text-xs font-bold text-[#14213D] mt-1">{size.label}</p>
                        
                        <p className="text-sm font-black text-[#FCA311] mt-0.5">
                          {formatPrice(size.price)}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* CHỌN HƯƠNG VỊ */}
              {productFlavors.length > 0 && (
                <div className="border-t border-[#14213D]/10 pt-4">
                  <p className="text-sm font-bold text-[#14213D] mb-3">
                    Hương vị: <span className="text-red-500">*</span>
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    {productFlavors.map((item, i) => {
                      const isOutOfStockFlavor = item.stock <= 0;
                      const isSelected = selectedFlavor === i;

                      return (
                        <button
                          key={i}
                          type="button"
                          disabled={isOutOfStockFlavor}
                          onClick={() => {
                            setSelectedFlavor(i);
                            setFlavorError(false);
                          }}
                          className={`px-3.5 py-2 rounded-lg text-xs md:text-sm font-semibold border transition-all cursor-pointer ${
                            isOutOfStockFlavor
                              ? "border-gray-200 bg-gray-100 text-gray-300 line-through cursor-not-allowed"
                              : isSelected
                              ? "border-[#FCA311] bg-[#FCA311] text-[#14213D] shadow-sm font-bold"
                              : "border-[#14213D]/20 text-[#000000] bg-white hover:border-[#FCA311]"
                          }`}
                        >
                          {item.name}
                        </button>
                      );
                    })}
                  </div>

                  {flavorError && (
                    <p className="text-xs text-red-500 font-bold mt-2 animate-bounce">
                      ⚠️ Vui lòng chọn hương vị sản phẩm trước khi thêm vào giỏ hàng!
                    </p>
                  )}
                </div>
              )}

              {/* SỐ LƯỢNG + THÊM VÀO GIỎ */}
              <div className="border-t border-[#14213D]/10 pt-5 flex items-center gap-4 mt-2">
                <div className="flex items-center border border-[#14213D]/20 rounded-xl overflow-hidden bg-white">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={isOutOfStock}
                    className="w-10 h-12 flex items-center justify-center text-[#14213D] hover:bg-[#E5E5E5] font-bold text-xl transition select-none cursor-pointer disabled:opacity-50"
                  >
                    -
                  </button>
                  <span className="w-12 h-12 flex items-center justify-center text-sm font-bold text-[#000000] border-x border-[#14213D]/20 select-none">
                    {quantity}
                  </span>
                  <button
                    onClick={handleIncreaseQuantity}
                    disabled={isOutOfStock}
                    className="w-10 h-12 flex items-center justify-center text-[#14213D] hover:bg-[#E5E5E5] font-bold text-xl transition select-none cursor-pointer disabled:opacity-50"
                  >
                    +
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`flex-1 h-12 font-black uppercase tracking-wider text-sm rounded-xl transition-all duration-150 shadow-md ${
                    isOutOfStock
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-[#FCA311] text-[#14213D] hover:bg-[#e0900d] active:scale-[0.98] cursor-pointer"
                  }`}
                >
                  {isOutOfStock ? "Sản phẩm tạm hết hàng" : "Thêm vào giỏ hàng"}
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}