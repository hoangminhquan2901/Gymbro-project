import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";
import { slugify } from "../utils/slugify";

// IMPORT SERVICE ĐỘNG TỪ ADMIN
import { getAllBrands } from "../services/adminBrandService"; 

function Brands() {
  const [brandsData, setBrandsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeLetter, setActiveLetter] = useState("");
  const sectionRefs = useRef({});

  const loadAndGroupBrands = async () => {
    try {
      setLoading(true);
      const allBrandsFromAdmin = await getAllBrands();
      const brandsList = Array.isArray(allBrandsFromAdmin) ? allBrandsFromAdmin : [];
      
      // Lọc các thương hiệu hoạt động và giữ nguyên toàn bộ object thương hiệu (để lấy ảnh image/Image)
      const activeBrands = brandsList.filter(b => {
        const status = String(b.status || "active").toLowerCase();
        if (status === "hidden" || status === "inactive" || status === "0" || status === "đã ẩn") {
          return false;
        }
        return true;
      });

      // Phân nhóm theo ký tự A-Z dựa trên tên thương hiệu
      const grouped = activeBrands.reduce((acc, brand) => {
        const brandName = brand.name || brand.brandName || "";
        if (brandName && brandName.trim()) {
          const firstLetter = brandName.trim().charAt(0).toUpperCase();
          if (!acc[firstLetter]) acc[firstLetter] = [];
          acc[firstLetter].push(brand);
        }
        return acc;
      }, {});

      // Sắp xếp các chữ cái và sắp xếp tên thương hiệu trong từng chữ cái
      const sortedGrouped = Object.keys(grouped)
        .sort()
        .reduce((acc, key) => {
          acc[key] = grouped[key].sort((a, b) => {
            const nameA = (a.name || a.brandName || "").toLowerCase();
            const nameB = (b.name || b.brandName || "").toLowerCase();
            return nameA.localeCompare(nameB);
          });
          return acc;
        }, {});

      setBrandsData(sortedGrouped);
      
      const firstLetter = Object.keys(sortedGrouped)[0];
      if (firstLetter) setActiveLetter(firstLetter);
    } catch (error) {
      console.error("Lỗi khi lấy danh sách thương hiệu từ Admin:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAndGroupBrands();

    const handleStorageChange = () => {
      loadAndGroupBrands();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // --- INTERSECTION OBSERVER ---
  useEffect(() => {
    const letters = Object.keys(brandsData);
    if (letters.length === 0) return;

    const observerOptions = {
      root: null,
      rootMargin: "-240px 0px -60% 0px", 
      threshold: 0,
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute("id");
          if (id) setActiveLetter(id);
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    Object.values(sectionRefs.current).forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [brandsData]);

  const letters = Object.keys(brandsData || {});
  const totalBrands = Object.values(brandsData || {}).flat().length;

  const scrollToLetter = (letter) => {
    setActiveLetter(letter);
    sectionRefs.current[letter]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className="min-h-screen bg-[#E5E5E5]">
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <Breadcrumb
          items={[
            { label: "Trang chủ", path: "/" },
            { label: "Thương hiệu" },
          ]}
        />

        <h1 className="text-5xl font-bold text-[#14213D] mb-8">
          Tổng hợp các thương hiệu thực phẩm bổ sung
        </h1>

        <p className="text-lg text-gray-700 mb-8 max-w-6xl leading-relaxed">
          GymBro cung cấp đa dạng các thương hiệu thực phẩm bổ sung nổi tiếng
          trên thế giới giúp khách hàng có nhiều lựa chọn hơn trong việc nâng
          cao sức khỏe, phát triển thể hình và cải thiện hiệu suất tập luyện.
        </p>

        <div className="sticky top-[135px] z-30 bg-[#E5E5E5] border-y border-gray-300/80 py-3 mb-12 transition-all duration-200">
          <div className="max-w-[1400px] mx-auto">
            <div className="text-xs text-gray-400 mb-3 uppercase tracking-wider">
              Hiển thị <span className="font-bold text-gray-600">{totalBrands}</span> thương hiệu
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2 items-center">
              {letters.map((letter) => {
                const isActive = activeLetter === letter;
                return (
                  <button
                    key={letter}
                    onClick={() => scrollToLetter(letter)}
                    className={`text-3xl font-bold transition-all duration-150 cursor-pointer uppercase min-w-[18px] text-center
                      ${isActive 
                        ? "text-[#14213D] scale-110 font-extrabold" 
                        : "text-gray-300 hover:text-[#14213D]" 
                      }`}
                  >
                    {letter}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500 italic">Đang tải danh sách thương hiệu...</div>
        ) : letters.length > 0 ? (
          letters.map((letter) => (
            <section
              key={letter}
              id={letter}
              ref={(el) => (sectionRefs.current[letter] = el)}
              className="mb-16 scroll-mt-[250px]"
            >
              <h2 className="text-4xl font-bold text-[#14213D] mb-8 uppercase">
                {letter}
              </h2>

              {brandsData[letter] && brandsData[letter].length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                  {brandsData[letter].map((brand) => {
                    const brandName = brand.name || brand.brandName || "";
                    const brandImage = brand.image || brand.Image; // Lấy đúng trường ảnh giống bên admin

                    return (
                      <Link
                        key={brand.id || brand.BrandID || brandName}
                        to={`/brands/${slugify(brandName)}`}
                        className="group cursor-pointer"
                      >
                        <div className="h-44 bg-white border border-gray-200 rounded-lg p-4 flex flex-col items-center justify-center shadow-sm transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1 group-hover:border-[#FCA311]">
                          {brandImage ? (
                            <img
                              src={brandImage}
                              alt={brandName}
                              className="max-h-24 max-w-full object-contain mb-2 group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : null}
                          <span className="text-center px-2 font-bold text-sm text-[#14213D] line-clamp-1">
                            {brandName}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-gray-400 italic">Đang cập nhật</div>
              )}
            </section>
          ))
        ) : (
          <div className="text-center py-20 text-gray-400 italic">Đang cập nhật thương hiệu...</div>
        )}
      </div>
    </div>
  );
}

export default Brands;  