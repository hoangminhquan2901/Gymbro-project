import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

import Breadcrumb from "../components/Breadcrumb";
import ProductCard from "../components/ProductCard";

import { getWebsiteCategories } from "../services/categoryService";
import { getWebsiteProducts } from "../services/productService";
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

// 🎯 HÀM LẤY GIÁ NGUYÊN BẢN (SỐ) - HỖ TRỢ CẢ Price HƠN VÀ price THƯỜNG
function getRawPrice(product) {
  if (!product) return 0;
  
  const val = product.Price ?? product.price ?? product.PriceSell ?? product.priceSell;

  if (typeof val === "number") return val;
  if (!val || String(val).toLowerCase().includes("liên hệ")) return 0;

  // Sử dụng parseFloat để xử lý chuẩn các số có phần thập phân từ backend (.00)
  const parsed = parseFloat(val);
  return isNaN(parsed) ? 0 : Math.round(parsed);
}

// 🎯 HÀM ĐỊNH DẠNG HIỂN THỊ GIÁ TIỀN
function formatDisplayPrice(product) {
  const rawPrice = getRawPrice(product);
  if (rawPrice <= 0) return "Liên hệ";
  return rawPrice.toLocaleString("vi-VN") + "đ";
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

// 🎯 HÀM CHUẨN HÓA DANH MỤC DÙNG ParentCategoryID
function normalizeCategory(c) {
  if (!c) return null;
  
  const id = c.CategoryID ?? c.categoryID ?? c.id;
  const rawParent = c.ParentCategoryID ?? c.parentCategoryID ?? c.parentId;

  const isInvalidParent = 
    rawParent === null || 
    rawParent === undefined || 
    rawParent === "" || 
    rawParent === 0 || 
    rawParent === "0";

  const parentCategoryID = isInvalidParent ? null : Number(rawParent);

  return {
    ...c,
    id: Number(id),
    CategoryID: Number(id),
    name: c.Name || c.name || "",
    slug: c.Slug || c.slug || slugify(c.Name || c.name || ""),
    image: c.Image || c.image,
    description: c.Description || c.description,
    ParentCategoryID: parentCategoryID,
    parentId: parentCategoryID,
    isRoot: parentCategoryID === null
  };
}

function Category() {
  const { slug } = useParams();

  const [sortBy, setSortBy] = useState("newest");
  const [filterPrice, setFilterPrice] = useState("all");
  const [onlyInStock, setOnlyInStock] = useState(false);

  const [websiteCategories, setWebsiteCategories] = useState([]);
  const [products, setProducts] = useState([]);

  async function loadData() {
    try {
      const rawCatRes = await getWebsiteCategories();
      
      let rawCategories = [];
      if (Array.isArray(rawCatRes)) {
        rawCategories = rawCatRes;
      } else if (Array.isArray(rawCatRes?.data)) {
        rawCategories = rawCatRes.data;
      }

      const normalizedCats = rawCategories
        .map(normalizeCategory)
        .filter(Boolean);
        
      setWebsiteCategories(normalizedCats);

      const rawProdData = await getWebsiteProducts();
      const allProducts = Array.isArray(rawProdData)
        ? rawProdData
        : Array.isArray(rawProdData?.data)
        ? rawProdData.data
        : [];
        
      setProducts(allProducts);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
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

  useEffect(() => {
    loadData();
  }, [slug]);

  const isMainSupplementPage = slug === "thuc-pham-bo-sung";

  const currentCategory = isMainSupplementPage
    ? {
        id: "root-supplement",
        CategoryID: "root-supplement",
        name: "Thực Phẩm Bổ Sung",
        slug: "thuc-pham-bo-sung",
        description: "Tổng hợp toàn bộ các dòng sản phẩm thực phẩm bổ sung cao cấp.",
      }
    : websiteCategories.find(
        (item) => item.slug === slug || slugify(item.name) === slug
      );

  if (!currentCategory) {
    return (
      <div className="min-h-screen flex justify-center items-center text-gray-500 italic bg-[#E5E5E5]">
        Đang cập nhật danh mục...
      </div>
    );
  }

  // 🎯 LỌC CÁC DANH MỤC CARD (DÙNG ParentCategoryID)
  const subCategoriesData = isMainSupplementPage
    ? websiteCategories.filter((item) => item.ParentCategoryID === null && item.slug !== "thuc-pham-bo-sung")
    : websiteCategories.filter((item) => item.ParentCategoryID === Number(currentCategory.id || currentCategory.CategoryID));

  const subCategoryNames = subCategoriesData.map((item) =>
    item.name.toLowerCase().trim()
  );
  const subCategoryIds = subCategoriesData.map((item) => String(item.id || item.CategoryID));

  // 🎯 LỌC SẢN PHẨM HIỂN THỊ
  const categoryProducts = products.filter((item) => {
    if (!item) return false;
    if (isMainSupplementPage) return true;

    const prodCatId = String(item.CategoryID || item.categoryId || "");
    const prodSubCatId = String(
      item.SubCategoryID || item.subCategoryId || ""
    );

    const prodCatName = (
      item.CategoryName ||
      item.category ||
      ""
    ).toLowerCase().trim();
    const prodSubCatName = (
      item.SubCategoryName ||
      item.subCategory ||
      item.type ||
      ""
    ).toLowerCase().trim();

    const currCatName = currentCategory.name.toLowerCase().trim();
    const currCatId = String(currentCategory.id || currentCategory.CategoryID);

    const isMainCategory =
      (prodCatId && prodCatId === currCatId) || prodCatName === currCatName;

    const isParentOfProduct =
      subCategoryNames.includes(prodCatName) ||
      subCategoryIds.includes(prodCatId);

    const isCurrentSubCategory =
      (prodSubCatId && prodSubCatId === currCatId) ||
      prodSubCatName === currCatName;

    return isMainCategory || isParentOfProduct || isCurrentSubCategory;
  });

  const priceRange =
    PRICE_RANGES.find((item) => item.value === filterPrice) || PRICE_RANGES[0];

  // 🎯 LỌC THEO KHOẢNG GIÁ
  let filtered = categoryProducts.filter((item) => {
    const numericPrice = getRawPrice(item);
    if (numericPrice === 0) return filterPrice === "all";
    return numericPrice >= priceRange.min && numericPrice <= priceRange.max;
  });

  if (onlyInStock) {
    filtered = filtered.filter(
        (p) => Number(p.status) === 1
    );
}

  // 🎯 SẮP XẾP SẢN PHẨM
  filtered = [...filtered].sort((a, b) => {
    const nameA = a?.Name || a?.name || "";
    const nameB = b?.Name || b?.name || "";
    const priceA = getRawPrice(a);
    const priceB = getRawPrice(b);

    if (sortBy === "name_asc") return nameA.localeCompare(nameB);
    if (sortBy === "name_desc") return nameB.localeCompare(nameA);
    if (sortBy === "price_asc") return priceA - priceB;
    if (sortBy === "price_desc") return priceB - priceA;
    return 0;
  });

  const buildBreadcrumb = () => {
    if (isMainSupplementPage) {
      return [{ label: "Trang chủ", path: "/" }, { label: "Thực phẩm bổ sung" }];
    }

    const items = [
      { label: "Trang chủ", path: "/" },
      { label: "Thực phẩm bổ sung", path: "/category/thuc-pham-bo-sung" },
    ];

    const ancestors = [];
    let temp = currentCategory;

    while (temp && !temp.isRoot) {
      const parentObj = websiteCategories.find(
        (c) => temp.ParentCategoryID && String(c.CategoryID || c.id) === String(temp.ParentCategoryID)
      );

      if (parentObj && parentObj.id !== temp.id) {
        ancestors.unshift({
          label: parentObj.name,
          path: `/category/${parentObj.slug}`,
        });
        temp = parentObj;
      } else {
        break;
      }
    }

    items.push(...ancestors);
    items.push({ label: currentCategory.name });
    return items;
  };

  return (
    <div className="min-h-screen bg-[#E5E5E5] text-[#000]">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <Breadcrumb items={buildBreadcrumb()} />

        <h1 className="text-3xl font-bold text-center text-[#14213D] mb-2">
          {currentCategory.name}
        </h1>

        {currentCategory.description && (
          <p className="text-center text-gray-500 max-w-[800px] mx-auto mb-8 text-sm leading-relaxed">
            {currentCategory.description}
          </p>
        )}

        {/* CÁC DANH MỤC CARD */}
        {subCategoriesData.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-12">
            {subCategoriesData.map((item) => {
              const subCount = products.filter((product) => {
                if (!product) return false;
                const prodCat = (
                  product.CategoryName ||
                  product.category ||
                  ""
                )
                  .toLowerCase()
                  .trim();
                const prodSubCat = (
                  product.SubCategoryName ||
                  product.subCategory ||
                  ""
                )
                  .toLowerCase()
                  .trim();
                const catName = item.name.toLowerCase().trim();
                const prodCatId = String(
                  product.CategoryID || product.categoryId || ""
                );
                return (
                  prodCat === catName ||
                  prodSubCat === catName ||
                  prodCatId === String(item.CategoryID || item.id)
                );
              }).length;

              return (
                <Link
                  key={item.CategoryID || item.id || item.slug}
                  to={`/category/${item.slug}`}
                  className="bg-white border border-[#d6d6d6] rounded-xl p-4 flex items-center gap-4 hover:border-[#FCA311] hover:-translate-y-0.5 hover:shadow-md transition"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-[#E5E5E5] flex justify-center items-center text-xl shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>🥤</span>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-[#14213D] text-sm line-clamp-1">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-400">{subCount} sản phẩm</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-[#d6d6d6]" />
          <h2 className="text-2xl font-black text-[#14213D] uppercase">
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
            {filtered.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
                {filtered.map((product, idx) => {
                  const isOutOfStock = checkProductOutOfStock(product);
                  const currentTag = isOutOfStock ? "Hết hàng" : "Giỏ hàng";

                  return (
                    <ProductCard
                      key={product.ProductID || product.id || `prod-${idx}`}
                      product={{
                        ...product,
                        id: product.ProductID || product.id,
                        name: product.Name || product.name || "Sản phẩm",
                        img: product.Image || product.image || product.img,
                        price: formatDisplayPrice(product), // 🎯 GỌI HÀM ĐỊNH DẠNG GIÁ CHUẨN
                        tag: currentTag,
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

export default Category;