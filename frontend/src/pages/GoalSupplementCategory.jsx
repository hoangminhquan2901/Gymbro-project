import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import Breadcrumb from "../components/Breadcrumb";
import { getAllGoals } from "../services/adminGoalService";
import { getWebsiteProducts } from "../services/productService";

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

function getRawPrice(product) {
  if (!product) return 0;
  const val = product.Price ?? product.price ?? product.regularPrice ?? product.salePrice;
  if (typeof val === "number") return val;
  if (!val || String(val).toLowerCase().includes("liên hệ")) return 0;
  const parsed = parseFloat(String(val).replace(",", "."));
  return isNaN(parsed) ? 0 : Math.round(parsed);
}

function formatDisplayPrice(product) {
  const rawPrice = getRawPrice(product);
  if (rawPrice <= 0) return "Liên hệ";
  return rawPrice.toLocaleString("vi-VN") + "đ";
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

function GoalSupplementCategory() {
  const [goals, setGoals] = useState([]);
  const [products, setProducts] = useState([]);
  const [sortBy, setSortBy] = useState("newest");
  const [filterPrice, setFilterPrice] = useState("all");
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);

  const loadData = async () => {
    try {
      const fetchedGoals = await getAllGoals();
      setGoals(Array.isArray(fetchedGoals) ? fetchedGoals : []);
      
      const fetchedProducts = await getWebsiteProducts();
      setProducts(Array.isArray(fetchedProducts) ? fetchedProducts : []);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu trang:", error);
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

  // Reset số lượng hiển thị về 12 khi thay đổi bộ lọc hoặc sắp xếp
  useEffect(() => {
    setVisibleCount(12);
  }, [filterPrice, onlyInStock, sortBy]);

  const categories = goals.map((cat) => {
    const count = products.filter((p) => isProductInGoal(p, cat)).length;
    return {
      slug: cat.slug,
      title: cat.name || cat.title,
      image: cat.image,
      icon: GOAL_ICONS[cat.slug] ?? "🎯",
      count: count,
      linkPrefix: "/goal",
    };
  });

  const displayProducts = [...products];

  const priceRange = PRICE_RANGES.find((r) => r.value === filterPrice) || PRICE_RANGES[0];
  let filtered = displayProducts.filter((p) => {
    const price = getRawPrice(p);
    if (price === 0) return filterPrice === "all";
    return price >= priceRange.min && price <= priceRange.max;
  });

  if (onlyInStock) {
    filtered = filtered.filter(
        (p) => Number(p.status) === 1
    );
  }

  filtered = [...filtered].sort((a, b) => {
    const priceA = getRawPrice(a);
    const priceB = getRawPrice(b);
    const nameA = a?.Name || a?.name || "";
    const nameB = b?.Name || b?.name || "";

    if (sortBy === "name_asc") return nameA.localeCompare(nameB);
    if (sortBy === "name_desc") return nameB.localeCompare(nameA);
    if (sortBy === "price_asc") return priceA - priceB;
    if (sortBy === "price_desc") return priceB - priceA;
    return 0;
  });

  // Phân trang phía client dựa trên danh sách đã lọc
  const paginatedProducts = filtered.slice(0, visibleCount);
  const hasMoreProducts = visibleCount < filtered.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 12);
  };

  return (
    <div className="min-h-screen bg-[#E5E5E5] text-[#000000]">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <Breadcrumb items={[{ label: "Trang chủ", path: "/" }, { label: "Mục tiêu & Nhu cầu" }]} />

        <h1 className="text-3xl md:text-5xl font-bold text-center text-[#14213D] mb-12 mt-4">
          Mục Tiêu & Nhu Cầu
        </h1>

        {categories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16">
            {categories.map((category) => (
              <Link
                key={category.slug}
                to={`${category.linkPrefix}/${category.slug}`}
                className="bg-white border border-[#ececec] rounded-2xl px-6 py-5 flex items-center gap-4 hover:border-[#FCA311] hover:shadow-md hover:-translate-y-1 transition-all duration-300"
              >
                <div className="w-16 h-16 overflow-hidden flex items-center justify-center flex-shrink-0 bg-[#f8f9fa] rounded-xl">
                  {category.image ? (
                    <img src={category.image} alt={category.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">{category.icon}</span>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#14213D] line-clamp-1">{category.title}</h3>
                  <p className="text-gray-500 mt-1 text-sm">{category.count} sản phẩm</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400 bg-white rounded-2xl border border-[#d6d6d6] mb-16 italic">
            Đang cập nhật danh mục mục tiêu & nhu cầu...
          </div>
        )}

        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-[#d6d6d6]" />
          <h2 className="text-2xl font-black text-[#14213D] uppercase whitespace-nowrap">
            {/* Hiển thị chính xác tổng số sản phẩm đã qua lọc */}
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
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
                  {paginatedProducts.map((product) => (
                    <ProductCard
                      key={product.ProductID || product.id}
                      product={{
                        ...product,
                        id: product.ProductID || product.id,
                        name: product.Name || product.name || "Sản phẩm",
                        price: formatDisplayPrice(product),
                        img: product.Image || product.image || product.img,
                        tag: "Giỏ hàng",
                      }}
                    />
                  ))}
                </div>

                {hasMoreProducts && (
                  <div className="flex justify-center mt-10">
                    <button
                      onClick={handleLoadMore}
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

export default GoalSupplementCategory;