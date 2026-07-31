import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { brands } from '../data/homeData';
import { slugify } from '../utils/slugify';

import { getWebsiteCategories } from "../services/categoryService";
import { getCustomerProductsCursor } from "../services/productService";

// --- CÁC HÀM TIỆN ÍCH CHUẨN HÓA ---

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

function Home() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
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
      const normalizedCats = rawCategories.map(normalizeCategory).filter(Boolean);
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

      setProducts(allProds);
    } catch (error) {
      console.error("Lỗi tải dữ liệu trang chủ:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function getProductsForSection(sectionTitle) {
    if (!Array.isArray(products) || !Array.isArray(categories)) return [];

    const targetSlug = slugify(sectionTitle);

    const mainCategory = categories.find((cat) => {
      if (!cat.isRoot) return false;
      return cat.slug === targetSlug || slugify(cat.name) === targetSlug;
    });

    if (!mainCategory) return [];

    const subCategories = categories.filter((sub) => {
      return (
        sub.id !== mainCategory.id &&
        ((sub.parentId && sub.parentId === mainCategory.id) ||
          (sub.parentName && sub.parentName.toLowerCase() === mainCategory.name.toLowerCase()))
      );
    });

    return products.filter((product) => 
      productBelongsToCategory(product, mainCategory, subCategories)
    );
  }

  const homeSections = [
    { title: "Whey Protein", slug: "whey-protein" },
    { title: "Protein", slug: "protein" },
    { title: "Sức Mạnh & Sức Bền", slug: "suc-manh-suc-ben" },
    { title: "Vitamin & Khoáng Chất", slug: "vitamin-khoang-chat" },
    { title: "Sức Khỏe Toàn Diện", slug: "suc-khoe-toan-dien" },
    { title: "Chất Béo", slug: "chat-beo" },
    { title: "Phụ Kiện Thể Thao", slug: "phu-kien-the-thao" },
  ];

  return (
    <div className="flex flex-col gap-10 py-6 px-4 max-w-[1400px] mx-auto bg-[#E5E5E5] text-[#000000]">

      {/* 1. HERO SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5 items-stretch">
        <div className="lg:col-span-3 flex flex-col h-full shadow-sm rounded-2xl overflow-hidden bg-white">
          <div className="relative overflow-hidden w-full flex-1 min-h-[250px] md:min-h-[380px]">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: "url('https://bizweb.dktcdn.net/100/011/344/themes/958827/assets/slider_3.jpg?1780654804541')" }}
            />
          </div>
          <div className="bg-white grid grid-cols-2 sm:grid-cols-4 text-center text-xs font-bold text-gray-600 border-t border-[#D1D5DB] overflow-hidden">
            <div className="py-4 text-[#FCA311] border-b-4 border-[#FCA311] bg-gray-50 cursor-pointer font-black">
              BÌNH LẮC CURVE SHAKER
            </div>
            <div className="py-4 hover:text-[#14213D] cursor-pointer border-r border-gray-100 hover:bg-gray-50 transition">WHEY ISOLATE</div>
            <div className="py-4 hover:text-[#14213D] cursor-pointer border-r border-gray-100 hover:bg-gray-50 transition">CREATINE CREAPURE</div>
            <div className="py-4 hover:text-[#14213D] cursor-pointer hover:bg-gray-50 transition">PURE PROTEIN BAR</div>
          </div>
        </div>

        {/* 3 BANNER NHỎ BÊN PHẢI */}
        <div className="flex flex-col gap-4">
          <div className="flex-1 bg-[#14213D] rounded-2xl p-5 flex flex-col justify-between text-white shadow-sm">
            <h3 className="font-black text-sm uppercase tracking-wide">Whey Protein Giá Siêu Rẻ</h3>
            <p className="text-xs text-gray-300">Giá chỉ từ <span className="text-[#FCA311] font-bold text-sm">600.000đ</span></p>
            <button className="w-fit bg-[#FCA311] text-[#14213D] text-[10px] font-black px-4 py-2 rounded-lg uppercase hover:bg-white transition cursor-pointer">Mua ngay</button>
          </div>
          <div className="flex-1 bg-white border border-[#D1D5DB] rounded-2xl p-5 flex flex-col justify-between shadow-sm">
            <h3 className="text-[#14213D] font-black text-sm uppercase tracking-wide">Dầu cá Nordic</h3>
            <p className="text-xs text-gray-600">Chăm sóc sức khỏe cả gia đình</p>
            <button className="w-fit bg-[#14213D] text-white text-[10px] font-bold px-4 py-2 rounded-lg uppercase hover:bg-[#FCA311] hover:text-[#14213D] transition cursor-pointer">Trải nghiệm ngay</button>
          </div>
          <div className="flex-1 bg-white border border-[#D1D5DB] rounded-2xl p-5 flex flex-col justify-between shadow-sm">
            <h3 className="text-[#14213D] font-black text-sm uppercase tracking-wide">Chăm sóc sức khỏe toàn diện</h3>
            <button className="w-fit bg-[#FCA311] text-[#14213D] text-[10px] font-black px-4 py-2 rounded-lg uppercase hover:bg-[#14213D] hover:text-white transition cursor-pointer">Giá khuyến mãi</button>
          </div>
        </div>
      </div>

      {/* 2. DYNAMIC CATEGORY SECTIONS */}
      {homeSections.map((sec) => {
        let categoryProducts = getProductsForSection(sec.title);

        // 🌟 Sắp xếp sản phẩm mới nhất lên đầu (ID giảm dần)
        categoryProducts.sort((a, b) => Number(b.ProductID || b.id || 0) - Number(a.ProductID || a.id || 0));

        return (
          <section key={sec.slug} className="w-full bg-white rounded-2xl p-6 shadow-sm border border-[#D1D5DB]">
            <Link to={`/category/${sec.slug}`} className="inline-block no-underline mb-6">
              <h2 className="text-lg font-black uppercase tracking-tight text-[#14213D] hover:text-[#FCA311] transition-colors">
                {sec.title}
              </h2>
            </Link>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-5">
              {loading ? (
                <div className="col-span-full text-center py-12 text-gray-400 italic text-xs">Đang tải sản phẩm...</div>
              ) : categoryProducts.length > 0 ? (
                categoryProducts.slice(0, 5).map((product) => (
                  <ProductCard
                    key={product.ProductID || product.id}
                    product={{
                      id: product.ProductID || product.id,
                      name: product.Name || product.name,
                      price: formatDisplayPrice(product),
                      img: product.Image || product.image,
                      tag: "Giỏ hàng"
                    }}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-12 text-gray-400 italic text-xs">
                  Đang cập nhật sản phẩm...
                </div>
              )}
            </div>
          </section>
        );
      })}

      {/* 3. THƯƠNG HIỆU NỔI BẬT */}
      <section className="w-full bg-white rounded-2xl p-6 shadow-sm border border-[#D1D5DB] mb-6">
        <Link to="/brands" className="inline-block no-underline mb-6">
          <h2 className="text-lg font-black uppercase tracking-tight text-[#14213D] hover:text-[#FCA311] transition-colors">
            Thương Hiệu Nổi Bật
          </h2>
        </Link>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-12 gap-3 items-center">
          {(() => {
            const finalBrandsList = typeof brands !== "undefined" ? brands : [];

            if (finalBrandsList.length === 0) {
              return (
                <div className="col-span-full text-center py-6 text-gray-400 italic text-xs">
                  Đang cập nhật danh sách thương hiệu...
                </div>
              );
            }

            return finalBrandsList.slice(0, 12).map((b) => (
              <Link
                key={b.id || b.slug || b.name}
                to={`/brands/${slugify(b.name)}`}
                className="h-16 w-full bg-gray-50 hover:bg-white border border-[#D1D5DB] hover:border-[#FCA311] rounded-xl flex items-center justify-center p-2 transition-all duration-200 shadow-none hover:shadow-md group no-underline"
                title={b.name}
              >
                {b.image && b.image.trim() !== "" ? (
                  <img
                    src={b.image}
                    alt={b.name}
                    className="max-h-full max-w-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                  />
                ) : (
                  <span className="font-bold text-gray-700 group-hover:text-[#14213D] text-[11px] text-center line-clamp-2 leading-tight">
                    {b.name}
                  </span>
                )}
              </Link>
            ));
          })()}
        </div>
      </section>

    </div>
  );
}

export default Home;