import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";
import ProductCard from "../components/ProductCard";
import { slugify } from "../utils/slugify";

// IMPORT CẢ SERVICE SẢN PHẨM VÀ THƯƠNG HIỆU
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
  { label: "Dưới 500.000đ",             value: "u500",  min: 0,      max: 500000   },
  { label: "500.000đ - 1.000.000đ",   value: "5to1",  min: 500000,  max: 1000000  },
  { label: "1.000.000đ - 1.500.000đ", value: "1to15", min: 1000000, max: 1500000  },
  { label: "1.500.000đ - 2.000.000đ", value: "15to2", min: 1500000, max: 2000000  },
  { label: "2.000.000đ - 2.500.000đ", value: "2to25", min: 2000000, max: 2500000  },
  { label: "Giá trên 2.500.000đ",     value: "o25",   min: 2500000, max: Infinity },
];

function parsePrice(price) {
  if (typeof price === "number") return price;

  if (!price) return 0;

  return Math.round(parseFloat(String(price).replace(",", "."))) || 0;
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

  const loadBrandData = async () => {
    try {
      setLoading(true);
      // 1. Lấy danh sách thương hiệu và sản phẩm bất đồng bộ từ API
      const [allBrandsRes, allProductsRes] = await Promise.all([
        getAllBrands(),
        getWebsiteProducts()
      ]);

      const allBrands = Array.isArray(allBrandsRes) ? allBrandsRes : [];
      const allProducts = Array.isArray(allProductsRes) ? allProductsRes : [];

      const currentBrand = allBrands.find(b => slugify(b.name || b.brandName || "") === brandSlug);

      if (currentBrand) {
        setBrandInfo({
          name: currentBrand.name || currentBrand.brandName || "",
          description: currentBrand.description || currentBrand.mota || "",
          country: currentBrand.country || currentBrand.quocgia || ""
        });
      } else {
        setBrandInfo({
          name: formatSlugToTitle(brandSlug),
          description: "",
          country: ""
        });
      }

      // 2. Lọc sản phẩm thuộc thương hiệu này
      const productsList = allProducts.filter((product) => {
          return slugify(product.BrandName || "") === brandSlug;
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
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [brandSlug]);

  const brandSubCats = Array.from(
    new Set(
        allBrandProducts
            .map((p) => p.SubCategoryName)
            .filter(Boolean)
    )
  );

  const priceRange = PRICE_RANGES.find((r) => r.value === filterPrice);
  
  let filtered = allBrandProducts.filter((p) => {
    const price = parsePrice(p.Price || p.price);
    const matchesPrice = price >= priceRange.min && price <= priceRange.max;
    const subCat = p.SubCategoryName;
    const matchesSubCat = selectedSubCat === "all" || subCat === selectedSubCat;
    return matchesPrice && matchesSubCat;
  });

  if (onlyInStock) {
    filtered = filtered.filter(
        (p) => Number(p.status) === 1
    );
}

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "name_asc")
        return a.Name.localeCompare(b.Name);
    if (sortBy === "name_desc")
        return b.Name.localeCompare(a.Name);
    if (sortBy === "price_asc")
        return parsePrice(a.Price) - parsePrice(b.Price);
    if (sortBy === "price_desc")
        return parsePrice(b.Price) - parsePrice(a.Price);
    return 0;
  });

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
              const count = allBrandProducts.filter((p) => p.SubCategoryName === subCat).length;
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
            ) : filtered.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
                {filtered.map((product) => (
                  <ProductCard
                    key={product.ProductID}
                    product={{
                      id: product.ProductID,
                      name: product.Name,
                      price: parsePrice(product.Price),
                      img: product.Image,
                      tag: "Giỏ hàng",
                    }}
                  />
                ))}
              </div>
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