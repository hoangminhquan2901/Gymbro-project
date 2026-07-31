import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

import Breadcrumb from "../components/Breadcrumb";
import ProductCard from "../components/ProductCard";

import { getWebsiteCategories } from "../services/categoryService";
import { getCustomerProductsCursor } from "../services/productService";
import { slugify } from "../utils/slugify";

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

function parsePrice(productOrPrice) {
  let rawVal = productOrPrice;
  
  if (productOrPrice && typeof productOrPrice === "object") {
    rawVal = productOrPrice.price ?? productOrPrice.Price ?? productOrPrice.priceSell ?? productOrPrice.PriceSell;
  }

  if (typeof rawVal === "number") return rawVal;
  if (!rawVal || String(rawVal).toLowerCase().includes("liên hệ")) return 0;

  const parsed = parseFloat(rawVal);
  return isNaN(parsed) ? 0 : Math.round(parsed);
}

function formatDisplayPrice(product) {
  const numericPrice = parsePrice(product);
  if (numericPrice <= 0) return "Liên hệ";
  return numericPrice.toLocaleString("vi-VN") + "đ";
}

function checkProductOutOfStock(product) {
  if (!product) return true;

  if (
    product.status === false ||
    product.status === "false" ||
    product.status === "out_of_stock" ||
    product.tag === "Hết hàng"
  ) {
    return true;
  }

  if (Array.isArray(product.flavors) && product.flavors.length > 0) {
    const totalStock = product.flavors.reduce(
      (sum, f) => sum + (Number(f.stock) || 0),
      0
    );
    if (totalStock === 0) return true;
  } else {
    const mainStock =
      product.stock !== undefined
        ? Number(product.stock)
        : product.quantity !== undefined
        ? Number(product.quantity)
        : 999;
    if (mainStock === 0) return true;
  }

  return false;
}

function normalizeCategory(c) {
  if (!c) return null;
  const name = c.Name || c.name || "Chưa có tên danh mục";
  const id = c.CategoryID || c.id || c._id;
  
  const parentId = c.ParentCategoryID !== undefined ? c.ParentCategoryID : (c.parentCategoryID ?? c.parentId);

  const parentName = String(
    c.ParentName ||
    c.parentName ||
    (typeof c.parent === "string" ? c.parent : "") ||
    ""
  ).trim();

  const isRoot =
    parentId === null ||
    parentId === undefined ||
    parentId === 0 ||
    parentId === "0" ||
    String(parentId).toLowerCase() === "null" ||
    String(parentId).trim() === "";

  const productCount = Number(c.ProductCount ?? c.productCount ?? 0);

  return {
    ...c,
    id: id ? String(id) : "",
    name,
    slug: c.Slug || c.slug || slugify(name),
    image: c.Image || c.image || c.img,
    description: c.Description || c.description,
    parentName,
    parentId: parentId !== null && parentId !== undefined ? String(parentId) : null,
    isRoot: isRoot,
    productCount,
  };
}

function getProductCategoryNames(p) {
  if (!p) return [];
  const names = [];
  
  if (typeof p.category === "string") names.push(p.category);
  if (typeof p.CategoryName === "string") names.push(p.CategoryName);
  if (typeof p.categoryName === "string") names.push(p.categoryName);
  if (typeof p.category_name === "string") names.push(p.category_name);
  
  if (p.category && typeof p.category === "object") {
    if (p.category.name) names.push(p.category.name);
    if (p.category.Name) names.push(p.category.Name);
  }
  if (p.Category && typeof p.Category === "object") {
    if (p.Category.name) names.push(p.Category.name);
    if (p.Category.Name) names.push(p.Category.Name);
  }
  
  return names.map(n => String(n).toLowerCase().trim()).filter(Boolean);
}

function getProductCategoryIds(p) {
  if (!p) return [];
  const ids = [];
  
  const rawIds = [
    p.categoryId,
    p.CategoryID,
    p.category_id,
    p.categoryID,
    p.category?.id,
    p.category?.CategoryID,
    p.category?.categoryId,
    p.Category?.id,
    p.Category?.CategoryID
  ];
  
  rawIds.forEach(id => {
    if (id !== null && id !== undefined && id !== "") {
      ids.push(String(id));
    }
  });
  
  return ids;
}

function productBelongsToCategory(product, category, subCategories = []) {
  if (!product) return false;
  
  const targetNames = [category.name, ...subCategories.map(s => s.name)].map(n => String(n).toLowerCase().trim());
  const targetIds = [category.id, ...subCategories.map(s => s.id)].map(id => String(id));
  
  const prodNames = getProductCategoryNames(product);
  const prodIds = getProductCategoryIds(product);
  
  const hasNameMatch = prodNames.some(pName => targetNames.includes(pName));
  const hasIdMatch = prodIds.some(pId => targetIds.includes(pId));
  
  return hasNameMatch || hasIdMatch;
}

function SupplementCategory() {
  const [sortBy, setSortBy] = useState("newest");
  const [filterPrice, setFilterPrice] = useState("all");
  const [onlyInStock, setOnlyInStock] = useState(false);

  const [categories, setCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [visibleCount, setVisibleCount] = useState(12);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      setLoading(true);
      const rawCatData = await getWebsiteCategories();
      const rawCategories = Array.isArray(rawCatData)
        ? rawCatData
        : Array.isArray(rawCatData?.data)
        ? rawCatData.data
        : [];

      const normalizedCats = rawCategories
        .map(normalizeCategory)
        .filter(Boolean);
        
      setCategories(normalizedCats);

      let allProds = [];
      let currentCursor = null;
      let hasMoreData = true;
      let safetyCounter = 0;

      while (hasMoreData && safetyCounter < 20) {
        safetyCounter++;
        const result = await getCustomerProductsCursor(currentCursor, 50);

        let batch = [];
        if (Array.isArray(result)) {
          batch = result;
          hasMoreData = false;
        } else if (result && Array.isArray(result.data)) {
          batch = result.data;
          hasMoreData = result.pagination?.hasMore ?? false;
          currentCursor = result.pagination?.nextCursor;
        } else if (result && Array.isArray(result.items)) {
          batch = result.items;
          hasMoreData = result.pagination?.hasMore ?? false;
          currentCursor = result.pagination?.nextCursor;
        } else {
          hasMoreData = false;
        }

        if (batch.length > 0) {
          allProds = [...allProds, ...batch];
        }

        if (!currentCursor || batch.length === 0) {
          hasMoreData = false;
        }
      }

      setAllProducts(allProds);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();

    const handleDataChange = () => {
      loadData();
    };

    window.addEventListener("categoriesChanged", handleDataChange);
    window.addEventListener("productsChanged", handleDataChange);

    return () => {
      window.removeEventListener("categoriesChanged", handleDataChange);
      window.removeEventListener("productsChanged", handleDataChange);
    };
  }, []);

  const rootCategories = categories.filter((item) => item.isRoot);

  const websiteCategories = rootCategories.map((category) => {
    const subCats = categories.filter(
      (sub) =>
        sub.id !== category.id &&
        ((sub.parentId && sub.parentId === category.id) ||
          (sub.parentName &&
            sub.parentName.toLowerCase() === category.name.toLowerCase()) ||
          (sub.parent &&
            String(sub.parent).toLowerCase() === category.name.toLowerCase()))
    );

    const subCount = allProducts.filter((p) => 
      productBelongsToCategory(p, category, subCats)
    ).length;

    const finalCount = category.productCount > 0 ? category.productCount : subCount;

    return {
      ...category,
      subCategories: subCats,
      count: finalCount,
      icon: category.image ? null : "🥤",
    };
  });

  const priceRange =
    PRICE_RANGES.find((item) => item.value === filterPrice) || PRICE_RANGES[0];

  let filtered = (Array.isArray(allProducts) ? allProducts : []).filter((product) => {
    if (!product) return false;
    const price = parsePrice(product);
    if (price === 0) return filterPrice === "all";
    return price >= priceRange.min && price <= priceRange.max;
  });

  if (onlyInStock) {
    filtered = filtered.filter(
      (p) => Number(p.status) === 1 || (!checkProductOutOfStock(p))
    );
  }

  filtered = [...filtered].sort((a, b) => {
    const nameA = a?.name || a?.Name || "";
    const nameB = b?.name || b?.Name || "";
    const priceA = parsePrice(a);
    const priceB = parsePrice(b);
    const idA = Number(a?.ProductID || a?.id || 0);
    const idB = Number(b?.ProductID || b?.id || 0);

    if (sortBy === "name_asc") return nameA.localeCompare(nameB);
    if (sortBy === "name_desc") return nameB.localeCompare(nameA);
    if (sortBy === "price_asc") return priceA - priceB;
    if (sortBy === "price_desc") return priceB - priceA;
    if (sortBy === "newest") return idB - idA;
    return 0;
  });

  const displayedProducts = filtered.slice(0, visibleCount);
  const hasMoreProducts = visibleCount < filtered.length;

  return (
    <div className="min-h-screen bg-[#E5E5E5] text-[#000000]">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <Breadcrumb
          items={[
            { label: "Trang chủ", path: "/" },
            { label: "Thực phẩm bổ sung" },
          ]}
        />

        <h1 className="text-3xl md:text-5xl font-bold text-center text-[#14213D] mt-4 mb-12">
          Thực Phẩm Bổ Sung
        </h1>

        {websiteCategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 items-start">
            {websiteCategories.map((category) => {
              const categoryPath = `/category/${category.slug}`;
              const hasSub = category.subCategories.length > 0;

              return (
                <div
                  key={category.id || Math.random()}
                  className="bg-white border border-[#d6d6d6] rounded-2xl overflow-hidden hover:border-[#FCA311] hover:-translate-y-1 hover:shadow-md transition h-full"
                >
                  <div
                    className={`grid h-full ${
                      hasSub ? "grid-cols-[150px_1fr]" : "grid-cols-1"
                    }`}
                  >
                    <Link
                      to={categoryPath}
                      className={`flex flex-col items-center justify-center p-5 bg-[#fafafa] h-full ${
                        hasSub ? "border-r border-[#d6d6d6]" : ""
                      }`}
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-5xl">
                            {category.icon || "🥤"}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-center text-[#14213D] mt-3 leading-tight max-w-full px-1 break-words">
                        {category.name}
                      </h3>

                      <p className="text-gray-400 text-xs mt-1">
                        {category.count} sản phẩm
                      </p>
                    </Link>

                    {hasSub && (
                      <div className="p-6 flex items-center bg-white">
                        <ul className="space-y-2 w-full">
                          {category.subCategories
                            .slice(0, 5)
                            .map((subItem) => (
                              <li key={subItem.id || Math.random()}>
                                <Link
                                  to={`/category/${subItem.slug}`}
                                  className="text-gray-700 hover:text-[#FCA311] text-sm font-medium line-clamp-1"
                                >
                                  {subItem.name}
                                </Link>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-white border border-[#d6d6d6] rounded-xl mb-16 text-gray-400 italic">
            Đang cập nhật danh mục...
          </div>
        )}

        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-[#d6d6d6]" />
          <h2 className="text-2xl font-black uppercase text-[#14213D]">
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
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
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
            <div className="bg-white border border-[#d6d6d6] rounded-xl p-5 shadow-xs">
              <h3 className="text-sm font-black uppercase text-[#14213D] tracking-wider mb-4">
                Tồn Kho
              </h3>
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

            <div className="bg-white border border-[#d6d6d6] rounded-xl p-5 shadow-xs">
              <h3 className="text-sm font-black uppercase text-[#14213D] tracking-wider mb-4">
                Giá
              </h3>
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
            {loading ? (
              <div className="text-center py-20 text-gray-400 italic bg-white rounded-xl border border-[#d6d6d6]">
                Đang tải dữ liệu sản phẩm...
              </div>
            ) : filtered.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
                  {displayedProducts.map((product, idx) => {
                    const isOutOfStock = checkProductOutOfStock(product);
                    const calculatedTag = isOutOfStock ? "Hết hàng" : "Giỏ hàng";

                    return (
                      <ProductCard
                        key={product?.ProductID || product?.id || `prod-${idx}`}
                        product={{
                          ...product,
                          id: product?.ProductID || product?.id,
                          name: product?.Name || product?.name || "Sản phẩm chưa có tên",
                          price: formatDisplayPrice(product),
                          img: product?.Image || product?.image || product?.img,
                          tag: calculatedTag,
                        }}
                      />
                    );
                  })}
                </div>

                {hasMoreProducts && (
                  <div className="text-center mt-10">
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
                Không tìm thấy sản phẩm phù hợp...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupplementCategory;