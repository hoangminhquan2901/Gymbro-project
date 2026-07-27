import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";
import ProductCard from "../components/ProductCard";
import { getAllGoals } from "../services/adminGoalService";
import { getWebsiteProducts } from "../services/productService";
import { slugify } from "../utils/slugify";

const GOAL_ICONS = {
  "tang-co": "💪",
  "giam-mo": "🔥",
  "suc-khoe": "❤️",
};

const SORT_OPTIONS = [
  { label: "Tên A → Z", value: "name_asc" },
  { label: "Tên Z → A", value: "name_desc" },
  { label: "Giá tăng dần", value: "price_asc" },
  { label: "Giá giảm dần", value: "price_desc" },
  { label: "Hàng mới", value: "newest" },
];

const PRICE_RANGES = [
  { label: "Tất cả", value: "all", min: 0, max: Infinity },
  { label: "Dưới 500.000đ", value: "u500", min: 0, max: 500000 },
  { label: "500.000đ - 1.000.000đ", value: "5to1", min: 500000, max: 1000000 },
  { label: "1.000.000đ - 1.500.000đ", value: "1to15", min: 1000000, max: 1500000 },
  { label: "1.500.000đ - 2.000.000đ", value: "15to2", min: 1500000, max: 2000000 },
  { label: "2.000.000đ - 2.500.000đ", value: "2to25", min: 2000000, max: 2500000 },
  { label: "Giá trên 2.500.000đ", value: "o25", min: 2500000, max: Infinity },
];

function parsePrice(price) {
  if (typeof price === "number") return price;

  if (!price) return 0;

  return Math.round(parseFloat(String(price).replace(",", "."))) || 0;
}

function isProductInGoal(product, goal) {
    if (!goal || !Array.isArray(product.Goals)) return false;

    return product.Goals.some(
        (g) =>
            String(g.GoalID) === String(goal.GoalID) ||
            String(g.Slug).toLowerCase() === String(goal.slug).toLowerCase() ||
            String(g.Name).toLowerCase() === String(goal.name).toLowerCase()
    );
}

function GoalCategory() {
  const { slug } = useParams();
  const [goals, setGoals] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [sortBy, setSortBy] = useState("newest");
  const [filterPrice, setFilterPrice] = useState("all");
  const [onlyInStock, setOnlyInStock] = useState(false);

  const loadData = async () => {
    try {
      const fetchedGoals = await getAllGoals();
      setGoals(Array.isArray(fetchedGoals) ? fetchedGoals : []);
      
      const fetchedProducts = await getWebsiteProducts();
      setAllProducts(
          Array.isArray(fetchedProducts)
              ? fetchedProducts
              : []
      );
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu trang danh mục mục tiêu:", error);
      setGoals([]);
    }
  };

  useEffect(() => {
    loadData();

    window.addEventListener("productsChanged", loadData);
    window.addEventListener("goalsChanged", loadData);
    
    return () => {
      window.removeEventListener("productsChanged", loadData);
      window.removeEventListener("goalsChanged", loadData);
    };
  }, []);

  const currentCategory = goals.find((item) => item.slug === slug);

  if (!currentCategory) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#000000]">
        Đang cập nhật sản phẩm...
      </div>
    );
  }

  const icon = GOAL_ICONS[slug] || "🎯";
  const subCategories = currentCategory.featured ?? [];

  // Lọc sản phẩm khớp với Goal hiện tại
  const matchedProducts = allProducts.filter((p) => isProductInGoal(p, currentCategory));

  // Filter giá
  const priceRange = PRICE_RANGES.find((r) => r.value === filterPrice);
  let filtered = matchedProducts.filter((p) => {
    const price = parsePrice(p.Price || p.price || p.regularPrice || p.salePrice);
    return price >= priceRange.min && price <= priceRange.max;
  });

  if (onlyInStock) {
    filtered = filtered.filter(
        (p) => Number(p.status) === 1
    );
}

  filtered = [...filtered].sort((a, b) => {
    const priceA = parsePrice(a.Price || a.price || a.regularPrice);
    const priceB = parsePrice(b.Price || b.price || b.regularPrice);
    if (sortBy === "name_asc") return (a.Name || a.name || "").localeCompare(b.Name || b.name || "");
    if (sortBy === "name_desc") return (b.Name || b.name || "").localeCompare(a.Name || a.name || "");
    if (sortBy === "price_asc") return priceA - priceB;
    if (sortBy === "price_desc") return priceB - priceA;
    return 0;
  });

  return (
    <div className="min-h-screen bg-[#E5E5E5] text-[#000000]">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <Breadcrumb
          items={[
            { label: "Trang chủ", path: "/" },
            { label: "Mục tiêu & Nhu cầu", path: "/category/muc-tieu-nhu-cau" },
            { label: currentCategory.name || currentCategory.title },
          ]}
        />

        <div className="text-center mb-8 space-y-2">
          <h1 className="text-3xl font-bold text-[#14213D] flex items-center justify-center gap-2">
            {currentCategory.name || currentCategory.title}
          </h1>
          {currentCategory.description && (
            <p className="text-sm text-gray-500 max-w-2xl mx-auto italic">
              {currentCategory.description}
            </p>
          )}
        </div>

        {subCategories.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-16">
            {subCategories.map((item) => {
              const subCount = matchedProducts.filter(
                (p) =>
                    slugify(p.SubCategoryName ?? "") === slugify(item)
              ).length;

              return (
                <Link
                  key={item}
                  to={`/products/${slugify(item)}`}
                  className="bg-white border border-[#d6d6d6] rounded-xl p-4 flex items-center gap-4 hover:border-[#FCA311] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-full bg-[#E5E5E5] flex items-center justify-center text-2xl flex-shrink-0">
                    {icon}
                  </div>
                  <div>
                    <p className="font-semibold text-[#14213D] text-sm line-clamp-2">{item}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{subCount} sản phẩm</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-[#d6d6d6]" />
          <h2 className="text-2xl font-black text-[#14213D] uppercase whitespace-nowrap">
            Tất Cả Sản Phẩm ({matchedProducts.length})
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

export default GoalCategory;