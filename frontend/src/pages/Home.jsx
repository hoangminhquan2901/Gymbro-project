import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { brands } from '../data/homeData';
import { slugify } from '../utils/slugify';

import { getWebsiteCategories } from "../services/categoryService";
import { getWebsiteProducts } from "../services/productService";

function Home() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load dữ liệu từ Backend
  async function loadData() {
    try {
      setLoading(true);
      const [cats, prods] = await Promise.all([
        getWebsiteCategories(),
        getWebsiteProducts()
      ]);
      setCategories(Array.isArray(cats) ? cats : []);
      setProducts(Array.isArray(prods) ? prods : []);
    } catch (error) {
      console.error("Lỗi tải dữ liệu trang chủ:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // 🔥 HÀM LỌC CHÍNH XÁC THEO DANH MỤC CHÍNH (MAIN CATEGORY)
  function getProducts(categoryName) {
    if (!Array.isArray(products) || !categoryName) return [];

    const targetSlug = slugify(categoryName);

    // 1. Tìm thông tin Danh mục chính từ mảng categories
    const mainCat = categories.find((c) => {
      const name = c.Name || c.name || "";
      return slugify(name) === targetSlug;
    });

    const mainCatId = mainCat ? String(mainCat.CategoryID || mainCat.id || "") : "";

    // 2. Lọc sản phẩm khớp CHÍNH XÁC với Danh mục chính
    return products.filter((p) => {
      if (!p) return false;

      // Lấy Category ID / Category Name của sản phẩm (BỎ QUA SUBCATEGORY)
      let pCatId = "";
      let pCatName = "";

      if (typeof p.category === "object" && p.category !== null) {
        pCatId = String(p.category.CategoryID || p.category.id || "");
        pCatName = p.category.Name || p.category.name || "";
      } else if (typeof p.category === "string" || typeof p.category === "number") {
        pCatName = String(p.category);
      }

      if (p.CategoryID) {
        pCatId = String(p.CategoryID);
      }
      if (p.CategoryName) {
        pCatName = String(p.CategoryName);
      }

      // So sánh theo ID (nếu có) hoặc theo Slug của Tên danh mục
      const isMatchById = mainCatId && pCatId && String(pCatId) === String(mainCatId);
      const isMatchByName = targetSlug && slugify(pCatName) === targetSlug;

      return isMatchById || isMatchByName;
    });
  }

  // Helper định dạng giá tiền chuẩn
  const formatPrice = (price) => {
    if (price === undefined || price === null || price === "") return "Liên hệ";
    if (typeof price === "string" && price.endsWith("đ")) return price;
    
    const numericValue = parseFloat(price);
    if (isNaN(numericValue)) return price;
    
    return Math.round(numericValue).toLocaleString("vi-VN") + "đ";
  };

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
        const categoryProducts = getProducts(sec.title);

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
                      price: formatPrice(product.Price || product.price),
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