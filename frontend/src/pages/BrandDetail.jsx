import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";
import ProductCard from "../components/ProductCard";
import { slugify } from "../utils/slugify";

// IMPORT SERVICE SẢN PHẨM VÀ THƯƠNG HIỆU
import { getWebsiteProducts } from "../services/productService";
import { getAllBrands } from "../services/adminBrandService"; 

const SORT_OPTIONS = [
  { label: "Tên A → Z",    value: "name_asc"   },
  { label: "Tên Z → A",    value: "name_desc"  },
  { label: "Giá tăng dần", value: "price_asc"  },
  { label: "Giá giảm dần", value: "price_desc" },
  { label: "Hàng mới",     value: "newest"     },
];

const PRICE_RANGES = [
  { label: "Tất cả",                    value: "all",   min: 0,      max: Infinity },
  { label: "Dưới 500.000đ",            value: "u500",  min: 0,      max: 500000   },
  { label: "500.000đ - 1.000.000đ",    value: "5to1",  min: 500000,  max: 1000000  },
  { label: "1.000.000đ - 1.500.000đ", value: "1to15", min: 1000000, max: 1500000  },
  { label: "1.500.000đ - 2.000.000đ", value: "15to2", min: 1500000, max: 2000000  },
  { label: "2.000.000đ - 2.500.000đ", value: "2to25", min: 2000000, max: 2500000  },
  { label: "Giá trên 2.500.000đ",     value: "o25",   min: 2500000, max: Infinity },
];

const ITEMS_PER_PAGE = 12; // Số lượng sản phẩm hiển thị mỗi lần

function parsePrice(price) {
  if (typeof price === "number") return price;
  if (!price) return 0;

  // Chuyển đổi trực tiếp nếu chuỗi là dạng số chuẩn (ví dụ: "1010000.00")
  const num = parseFloat(price);
  if (!isNaN(num) && String(price).includes('.')) {
    return Math.round(num);
  }

  // Xử lý cho các trường hợp chuỗi có định dạng khác
  const cleanStr = String(price)
    .replace(/[^\d.,]/g, "")
    .replace(/,/g, ".");
  
  return Math.round(parseFloat(cleanStr)) || 0;
}

function formatSlugToTitle(slug) {
  if (!slug) return "";
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function BrandDetail() {
  const { brandSlug } = useParams();
  
  const [allBrandProducts, setAllBrandProducts] = useState([]);
  const [brandInfo, setBrandInfo] = useState({ name: "", description: "", country: "" });
  const [loading, setLoading] = useState(true);

  const [sortBy, setSortBy] = useState("newest");
  const [filterPrice, setFilterPrice] = useState("all");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [selectedSubCat, setSelectedSubCat] = useState("all");
  
  // State quản lý số lượng sản phẩm hiển thị cho dạng "Xem thêm"
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  const loadBrandData = async () => {
    try {
      setLoading(true);
      const [allBrandsRes, allProductsRes] = await Promise.all([
        getAllBrands(),
        getWebsiteProducts()
      ]);

      const allBrands = Array.isArray(allBrandsRes) ? allBrandsRes : [];
      const allProducts = Array.isArray(allProductsRes) ? allProductsRes : [];

      const currentBrand = allBrands.find((b) => {
        const id = b.BrandID || b.id;
        const name = b.Name || b.name || b.brandName || "";
        const slug = b.Slug || slugify(name);
        
        return (
          String(id) === brandSlug || 
          slug === brandSlug || 
          slugify(name) === brandSlug
        );
      });

      if (currentBrand) {
        setBrandInfo({
          id: currentBrand.BrandID || currentBrand.id,
          name: currentBrand.Name || currentBrand.name || currentBrand.brandName || "",
          description: currentBrand.Description || currentBrand.description || currentBrand.mota || "",
          country: currentBrand.Country || currentBrand.country || currentBrand.quocgia || ""
        });
      } else {
        setBrandInfo({
          id: null,
          name: formatSlugToTitle(brandSlug),
          description: "",
          country: ""
        });
      }

      const brandId = currentBrand ? (currentBrand.BrandID || currentBrand.id) : null;
      
      const productsList = allProducts.filter((product) => {
        const matchId = brandId && String(product.BrandID || product.brand_id || "") === String(brandId);
        const matchSlug = slugify(product.BrandName || product.brand || "") === brandSlug;
        return matchId || matchSlug;
      });

      setAllBrandProducts(productsList);
    } catch (error) {
      console.error("Lỗi khi load chi tiết thương hiệu:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBrandData();

    const handleStorageChange = () => {
      loadBrandData();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("productsChanged", loadBrandData);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("productsChanged", loadBrandData);
    };
  }, [brandSlug]);

  // Reset về số lượng ban đầu khi thay đổi bộ lọc hoặc thương hiệu
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [brandSlug, filterPrice, onlyInStock, selectedSubCat, sortBy]);

  const brandSubCats = Array.from(
    new Set(
        allBrandProducts
            .map((p) => p.SubCategoryName || p.subCategoryName)
            .filter(Boolean)
    )
  );

  const priceRange = PRICE_RANGES.find((r) => r.value === filterPrice) || PRICE_RANGES[0];
  
  let filtered = allBrandProducts.filter((p) => {
    const price = parsePrice(p.Price || p.price || p.regularPrice);
    const matchesPrice = price >= priceRange.min && price <= priceRange.max;
    const subCat = p.SubCategoryName || p.subCategoryName;
    const matchesSubCat = selectedSubCat === "all" || subCat === selectedSubCat;
    return matchesPrice && matchesSubCat;
  });

  if (onlyInStock) {
    filtered = filtered.filter(
        (p) => Number(p.status) === 1 || p.status === true || p.status === "1"
    );
  }

  filtered = [...filtered].sort((a, b) => {
    const nameA = a.Name || a.name || "";
    const nameB = b.Name || b.name || "";
    const priceA = parsePrice(a.Price || a.price || a.regularPrice);
    const priceB = parsePrice(b.Price || b.price || b.regularPrice);

    if (sortBy === "name_asc") return nameA.localeCompare(nameB);
    if (sortBy === "name_desc") return nameB.localeCompare(nameA);
    if (sortBy === "price_asc") return priceA - priceB;
    if (sortBy === "price_desc") return priceB - priceA;
    return 0;
  });

  // Lấy danh sách sản phẩm hiển thị dựa trên visibleCount
  const displayedProducts = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;

  return (
    <div className="min-h-screen bg-[#E5E5E5] text-[#000000]">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <Breadcrumb
          items={[
            { label: "Trang chủ", path: "/" },
            { label: "Thương hiệu", path: "/brands" },
            { label: brandInfo.name },
          ]}
        />

        <h1 className="text-4xl font-bold text-center text-[#14213D] mb-4 mt-4">
          {brandInfo.name}
        </h1>

        {(brandInfo.description || brandInfo.country) && (
          <div className="max-w-4xl mx-auto text-center mb-10 bg-white border border-[#d6d6d6] rounded-xl p-6 shadow-sm">
            {brandInfo.country && (
              <div className={brandInfo.description ? "mb-3" : ""}>
                <span className="inline-block px-3 py-1 bg-gray-100 border border-gray-200 text-xs text-gray-600 font-bold rounded-full uppercase tracking-wider">
                  Quốc gia: {brandInfo.country}
                </span>
              </div>
            )}
            
            {brandInfo.description && (
              <p className="text-base text-gray-700 leading-relaxed">
                {brandInfo.description}
              </p>
            )}
          </div>
        )}

        {brandSubCats.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-12 max-w-4xl mx-auto">
            <button
              onClick={() => setSelectedSubCat("all")}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                selectedSubCat === "all"
                  ? "bg-[#14213D] text-white border-[#14213D]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#14213D]"
              }`}
            >
              Tất cả danh mục ({allBrandProducts.length})
            </button>
            {brandSubCats.map((subCat) => {
              const count = allBrandProducts.filter((p) => (p.SubCategoryName || p.subCategoryName) === subCat).length;
              return (
                <button
                  key={subCat}
                  onClick={() => setSelectedSubCat(subCat)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                    selectedSubCat === subCat
                      ? "bg-[#14213D] text-white border-[#14213D]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#14213D]"
                  }`}
                >
                  {subCat} ({count})
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-[#d6d6d6]" />
          <h2 className="text-2xl font-black text-[#14213D] uppercase whitespace-nowrap">
            TẤT CẢ SẢN PHẨM ({filtered.length})
          </h2>
          <div className="flex-1 h-px bg-[#d6d6d6]" />
        </div>

        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="text-sm font-semibold text-gray-600">Sắp xếp:</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                sortBy === opt.value
                  ? "bg-[#14213D] text-white"
                  : "bg-white text-gray-600 hover:text-[#14213D] border border-gray-200"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6">
          <aside className="space-y-4">
            <div className="bg-white border border-[#d6d6d6] rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-black uppercase text-[#14213D] tracking-wider mb-4">Tồn Kho</h3>
              <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-[#14213D]">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="accent-[#14213D]"
                />
                Còn hàng
              </label>
            </div>

            <div className="bg-white border border-[#d6d6d6] rounded-xl p-5 shadow-sm">
              <h3 className="text-sm font-black uppercase text-[#14213D] tracking-wider mb-4">Giá</h3>
              <div className="space-y-3">
                {PRICE_RANGES.map((range) => (
                  <label
                    key={range.value}
                    className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-[#14213D]"
                  >
                    <input
                      type="radio"
                      name="price"
                      checked={filterPrice === range.value}
                      onChange={() => setFilterPrice(range.value)}
                      className="accent-[#14213D]"
                    />
                    {range.label}
                  </label>
                ))}
              </div>
            </div>
          </aside>

          <div>
            {loading ? (
              <div className="text-center py-20 text-gray-500 italic bg-white rounded-xl border border-[#d6d6d6]">
                Đang tải sản phẩm theo thương hiệu...
              </div>
            ) : displayedProducts.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
                  {displayedProducts.map((product) => (
                    <ProductCard
                      key={product.ProductID || product.id}
                      product={{
                        id: product.ProductID || product.id,
                        name: product.Name || product.name,
                        price: parsePrice(product.Price || product.price || product.regularPrice),
                        img: product.Image || product.image,
                        tag: "Giỏ hàng",
                      }}
                    />
                  ))}
                </div>

                {/* NÚT XEM THÊM (LOAD MORE) */}
                {hasMore && (
                  <div className="flex flex-col items-center mt-10">
                    <button
                      onClick={() => setVisibleCount((prev) => prev + 12)}
                      className="px-6 py-3 bg-[#14213D] text-white font-bold rounded-xl hover:bg-[#FCA311] hover:text-[#14213D] transition cursor-pointer shadow-md"
                    >
                      Xem thêm sản phẩm
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-20 text-gray-400 italic bg-white rounded-xl border border-[#d6d6d6]">
                Đang cập nhật sản phẩm...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BrandDetail;