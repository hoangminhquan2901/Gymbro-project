import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";
import ProductCard from "../components/ProductCard";
import { slugify } from "../utils/slugify";

import { getWebsiteProducts } from "../services/productService";
import { getWebsiteCategories } from "../services/categoryService";

const PRICE_RANGES = [
  { label: "Tất cả", value: "all", min: 0, max: Infinity },
  { label: "Dưới 500.000đ", value: "u500", min: 0, max: 500000 },
  { label: "500.000đ - 1.000.000đ", value: "5to1", min: 500000, max: 1000000 },
  { label: "1.000.000đ - 1.500.000đ", value: "1to15", min: 1000000, max: 1500000 },
  { label: "1.500.000đ - 2.000.000đ", value: "15to2", min: 1500000, max: 2000000 },
  { label: "2.000.000đ - 2.500.000đ", value: "2to25", min: 2000000, max: 2500000 },
  { label: "Giá trên 2.500.000đ", value: "o25", min: 2500000, max: Infinity },
];

const SORT_OPTIONS = [
  { label: "Tên A → Z", value: "name_asc" },
  { label: "Tên Z → A", value: "name_desc" },
  { label: "Giá tăng dần", value: "price_asc" },
  { label: "Giá giảm dần", value: "price_desc" },
  { label: "Hàng mới", value: "newest" },
];

function parsePrice(priceStr) {
  if (typeof priceStr === "number") return priceStr;
  if (!priceStr) return 0;
  return parseInt(String(priceStr).replace(/\./g, "").replace("đ", "")) || 0;
}

function ProductList() {
  const { subSlug } = useParams();
  const [filterPrice, setFilterPrice] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [onlyInStock, setOnlyInStock] = useState(false);
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chuyển sang async/await để lấy dữ liệu từ MySQL/Backend
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const prods = await getWebsiteProducts();
        const cats = await getWebsiteCategories();
        setProducts(Array.isArray(prods) ? prods : []);
        setCategories(Array.isArray(cats) ? cats : []);
      } catch (error) {
        console.error("Lỗi tải dữ liệu trang ProductList:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  // Tìm subCategory object thực tế từ DB dựa theo slug
  const currentSubCat = (Array.isArray(categories) ? categories : []).find(
    (cat) => cat && (cat.slug === subSlug || slugify(cat.name || "") === subSlug)
  );

  // Lọc sản phẩm theo subCategory
  const allProducts = (Array.isArray(products) ? products : []).filter((item) => {
    if (!item) return false;
    // Tùy thuộc vào cấu trúc cột subCategory hoặc SubCategoryID trong CSDL của bạn
    const itemSub = item.subCategory ? String(item.subCategory).toLowerCase().trim() : "";
    const targetSub = currentSubCat ? currentSubCat.name.toLowerCase().trim() : (subSlug ? subSlug.toLowerCase().trim() : "");
    return itemSub === targetSub || slugify(item.subCategory || "") === subSlug;
  });

  const subCategoryName = currentSubCat ? currentSubCat.name : (allProducts.length ? allProducts[0].subCategory : (subSlug || "Sản phẩm"));
  
  const parentCategory = (Array.isArray(categories) ? categories : []).find(
    (cat) => cat && currentSubCat && cat.name === currentSubCat.parent
  ) || (allProducts.length ? categories.find(cat => cat.name === allProducts[0].category) : null);

  // Filter theo giá
  const priceRange = PRICE_RANGES.find((r) => r.value === filterPrice) || PRICE_RANGES[0];
  let filtered = allProducts.filter((p) => {
    const price = parsePrice(p.Price || p.price);
    return price >= priceRange.min && price <= priceRange.max;
  });

  // Filter tồn kho
  if (onlyInStock) {
    filtered = filtered.filter(
        (p) => Number(p.status) === 1
    );
}

  // Sort sản phẩm
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "name_asc")   return (a?.Name || a?.name || "").localeCompare(b?.Name || b?.name || "");
    if (sortBy === "name_desc")  return (b?.Name || b?.name || "").localeCompare(a?.Name || a?.name || "");
    if (sortBy === "price_asc")  return parsePrice(a?.Price || a?.price) - parsePrice(b?.Price || b?.price);
    if (sortBy === "price_desc") return parsePrice(b?.Price || b?.price) - parsePrice(a?.Price || a?.price);
    return 0;
  });

  if (loading) {
    return <div className="text-center py-20 text-lg font-medium">Đang tải danh sách sản phẩm...</div>;
  }

  return (
    <div className="min-h-screen bg-[#E5E5E5] text-[#000000]">
      <div className="max-w-[1400px] mx-auto px-6 py-8">

        <Breadcrumb
          items={[
            { label: "Trang chủ", path: "/" },
            { label: "Thực Phẩm Bổ Sung", path: "/category/thuc-pham-bo-sung" },
            parentCategory ? { label: parentCategory.name, path: `/category/${parentCategory.slug || slugify(parentCategory.name)}` } : null,
            { label: subCategoryName },
          ].filter(Boolean)}
        />

        <h1 className="text-3xl font-bold text-center text-[#14213D] mb-4">
          {subCategoryName}
        </h1>

        <p className="text-center text-gray-600 max-w-3xl mx-auto mb-8 leading-relaxed">
          <span className="font-bold text-[#14213D]">{subCategoryName}</span> là
          dòng thực phẩm bổ sung chính hãng được nhập khẩu và phân phối bởi GymBro,
          cam kết chất lượng 100% chính hãng, giá tốt nhất thị trường.
        </p>

        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-[#d6d6d6]" />
          <h2 className="text-2xl font-black text-[#14213D] uppercase whitespace-nowrap">
            Tất Cả Sản Phẩm ({filtered.length})
          </h2>
          <div className="flex-1 h-px bg-[#d6d6d6]" />
        </div>

        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <span className="text-sm font-semibold text-gray-600">Sắp xếp:</span>
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSortBy(opt.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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
                  className="accent-[#14213D] cursor-pointer"
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
                      className="accent-[#14213D] cursor-pointer"
                    />
                    {range.label}
                  </label>
                ))}
              </div>
            </div>
          </aside>

          <div>
            {filtered.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
                {filtered.map((product) => {
                  const pId = product?.ProductID || product?.id;
                  const pName = product?.Name || product?.name || "Sản phẩm không có tên";
                  const rawPrice = product?.Price || product?.price || 0;
                  const pPrice = typeof rawPrice === "number" ? rawPrice.toLocaleString("vi-VN") + "đ" : rawPrice + "đ";
                  const pImg = product?.Image || product?.image;

                  return (
                    <ProductCard
                      key={pId || Math.random()}
                      product={{
                        id: pId,
                        name: pName,
                        price: pPrice,
                        img: pImg,
                        tag: product?.tag || "Giỏ hàng",
                      }}
                    />
                  );
                })}
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

export default ProductList;