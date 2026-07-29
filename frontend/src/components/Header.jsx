import React, { useState, useRef, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { getWebsiteProducts } from "../services/productService";

const KEYWORDS = [
  { label: "Whey Protein", path: "/category/whey-protein" },
  { label: "Mass", path: "/category/mass-gainer" },
  { label: "BCAAs", path: "/category/bcaas" },
  { label: "EAAs", path: "/category/eaas" },
  { label: "Creatine", path: "/category/creatine" },
  { label: "Vitamin D3 K2", path: "/category/vitamin-d3-k2" },
  { label: "Dầu Cá Omega 3", path: "/category/omega3" },
];

const MAX_SUGGESTIONS = 6;

// Hàm định dạng giá tiền kiểu Việt Nam (Ví dụ: 3360000 -> 3.360.000 đ)
const formatPrice = (price) => {
  if (price === null || price === undefined || price === "") return "";
  const num = Number(price);
  if (isNaN(num)) return price;
  return num.toLocaleString("vi-VN") + " đ";
};

function Header() {
  const navigate = useNavigate();
  
  const cartContext = useCart() || {};
  const { totalCount, cartItems, items, fetchCart, getCart } = cartContext;

  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [productList, setProductList] = useState([]);
  const wrapperRef = useRef(null);

  // Tự động gọi API cập nhật giỏ hàng khi Header mount
  useEffect(() => {
    if (typeof fetchCart === "function") fetchCart();
    else if (typeof getCart === "function") getCart();
  }, [fetchCart, getCart]);

  // Tính toán chính xác tổng số lượng sản phẩm trong giỏ hàng
  const displayCartCount = useMemo(() => {
    if (typeof totalCount === "number" && totalCount >= 0) {
      return totalCount;
    }

    const rawList = cartItems || items || [];
    if (Array.isArray(rawList)) {
      return rawList.reduce((sum, item) => {
        const qty = Number(item.Quantity || item.quantity || 1);
        return sum + qty;
      }, 0);
    }

    return 0;
  }, [totalCount, cartItems, items]);

  // Lấy danh sách sản phẩm từ cơ sở dữ liệu
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getWebsiteProducts();
        let actualData = [];
        if (Array.isArray(response)) {
          actualData = response;
        } else if (response && Array.isArray(response.data)) {
          actualData = response.data;
        } else if (response && Array.isArray(response.products)) {
          actualData = response.products;
        }
        setProductList(actualData);
      } catch (error) {
        console.error("Lỗi tải danh sách sản phẩm:", error);
        setProductList([]);
      }
    };

    fetchProducts();
  }, []);

  // Đóng dropdown khi click ngoài
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Tối ưu lọc gợi ý dựa trên cột Name trong bảng Products
  const suggestions = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return [];
    const safeList = Array.isArray(productList) ? productList : [];
    return safeList
      .filter((p) => {
        const productName = p.Name || p.name || "";
        return productName.toLowerCase().includes(trimmed);
      })
      .slice(0, MAX_SUGGESTIONS);
  }, [query, productList]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = (productId) => {
    navigate(`/product/${productId}`);
    setShowSuggestions(false);
    setQuery("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="w-full select-none">
      {/* MAIN HEADER — Fixed */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#14213D] border-b border-[#FCA311]/20 shadow-xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 lg:py-5">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr_auto] gap-4 lg:gap-8 items-center">
            
            {/* LOGO */}
            <Link
              to="/"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center justify-center lg:justify-start group"
            >
              <span className="text-4xl lg:text-5xl font-black italic tracking-tighter leading-none text-[#FCA311] group-hover:scale-105 transition-transform duration-200">
                GymBro
              </span>
              <div className="ml-3 pl-3 border-l-2 border-[#FCA311]/40 flex flex-col text-[8px] uppercase font-bold tracking-widest leading-tight text-white/90">
                <span>Sport</span>
                <span>Nutrition</span>
                <span>Supplement</span>
              </div>
            </Link>

            {/* SEARCH AREA & KEYWORDS */}
            <div className="flex flex-col gap-2.5">
              <div ref={wrapperRef} className="relative">
                <form onSubmit={handleSearch} className="relative">
                  <input
                    type="text"
                    id="search-input"
                    name="search"
                    autoComplete="off"
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={async () => {
                      try {
                        const response = await getWebsiteProducts();
                        let actualData = [];
                        if (Array.isArray(response)) actualData = response;
                        else if (response && Array.isArray(response.data)) actualData = response.data;
                        else if (response && Array.isArray(response.products)) actualData = response.products;
                        setProductList(actualData);
                      } catch (err) {
                        setProductList([]);
                      }
                      setShowSuggestions(true);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder="Tìm kiếm sản phẩm thực phẩm bổ sung..."
                    className="
                      w-full h-14 rounded-xl bg-white
                      border-2 border-transparent px-5 pr-14 text-gray-900 text-base
                      placeholder:text-gray-400 font-medium
                      focus:outline-none focus:border-[#FCA311] focus:ring-4 focus:ring-[#FCA311]/20
                      shadow-inner transition-all duration-200
                    "
                  />
                  <button
                    type="submit"
                    aria-label="Tìm kiếm"
                    className="
                      absolute right-2 top-1/2 -translate-y-1/2
                      w-10 h-10 rounded-lg flex items-center justify-center
                      text-[#FCA311] hover:bg-[#14213D]/10 hover:scale-105
                      active:scale-95 transition-all duration-200 cursor-pointer
                    "
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </button>
                </form>

                {/* DROPDOWN GỢI Ý PRODUCT */}
                {showSuggestions && query.trim() && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 max-h-96 overflow-y-auto divide-y divide-gray-100">
                    {suggestions.length > 0 ? (
                      suggestions.map((product) => {
                        const pId = product.ProductID || product.id;
                        const pName = product.Name || product.name;
                        const pPrice = product.Price || product.price;
                        const pImage = product.Image || product.image;

                        return (
                          <button
                            key={pId}
                            onClick={() => handleSelectSuggestion(pId)}
                            className="w-full flex items-center gap-4 px-4 py-3 hover:bg-amber-50/50 text-left transition-colors duration-150 cursor-pointer group"
                          >
                            <img
                              src={pImage || null}
                              alt={pName}
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-gray-50 border border-gray-100 group-hover:scale-105 transition-transform"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-[#14213D]">
                                {pName}
                              </p>
                              {/* Đã áp dụng hàm formatPrice để hiển thị dấu chấm phân cách và chữ đ */}
                              <p className="text-sm font-bold text-[#FCA311] mt-0.5">
                                {formatPrice(pPrice)}
                              </p>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-4 py-8 text-center text-gray-400 text-sm">
                        Không tìm thấy sản phẩm phù hợp với "<span className="text-gray-700 font-medium">{query}</span>"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* KEYWORDS TRENDING */}
              <div className="hidden md:flex flex-wrap items-center gap-x-5 gap-y-1">
                <span className="text-xs font-semibold text-[#FCA311] uppercase tracking-wider">Xu hướng:</span>
                {KEYWORDS.map((item) => (
                  <Link
                    key={item.label}
                    to={item.path}
                    className="text-2xs text-gray-300 hover:text-[#FCA311] transition-colors duration-200"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* ACTION CENTER */}
            <div className="flex items-center justify-center lg:justify-end gap-5">
              
              {/* HOTLINE */}
              <div className="hidden xl:flex items-center gap-3">
                <div className="w-11 h-11 rounded-full border border-[#FCA311]/30 bg-[#1B2B4A] flex items-center justify-center shadow-inner">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-[#FCA311]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-gray-400 font-medium">Tư vấn ngay</p>
                  <a
                    href="tel:0822438304"
                    className="text-base font-bold text-[#FCA311] hover:underline tracking-wide"
                  >
                    0822438304
                  </a>
                </div>
              </div>

              {/* NÚT BẤM GIỎ HÀNG */}
              <Link
                to="/cart"
                className="
                  relative flex items-center gap-2.5 px-5 py-3 rounded-xl
                  border border-[#FCA311]/40 bg-[#1B2B4A] text-white
                  hover:border-[#FCA311] hover:bg-[#22375d] active:scale-95
                  transition-all duration-200 shadow-md group
                "
              >
                <div className="relative">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-[#FCA311] group-hover:scale-110 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  
                  {displayCartCount > 0 && (
                    <span className="absolute -top-2.5 -right-2.5 min-w-5 h-5 px-1.5 bg-[#FCA311] text-[#14213D] text-[11px] font-extrabold rounded-full flex items-center justify-center border-2 border-[#14213D] shadow-sm animate-pulse">
                      {displayCartCount > 99 ? "99+" : displayCartCount}
                    </span>
                  )}
                </div>
                <span className="font-bold text-sm tracking-wide">Giỏ hàng</span>
              </Link>

            </div>
          </div>
        </div>
      </header>

      {/* SPACER */}
      <div className="h-[140px] lg:h-[120px]" />
    </div>
  );
}

export default Header;