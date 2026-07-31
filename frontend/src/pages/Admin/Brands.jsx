import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Plus, Building2, CheckCircle2, Package, Search, RefreshCw } from "lucide-react";

import {
  getAllBrands,
  updateBrand,
  deleteBrand,
} from "../../services/adminBrandService";
import { getAllProducts } from "../../services/adminProductService";

import BrandTable from "../../components/Admin/BrandTable";
import BrandFormModal from "../../components/Admin/BrandFormModal";
import BrandDetailModal from "../../components/Admin/BrandDetailModal";
import DeleteModal from "../../components/Admin/DeleteModal";

function Brands() {
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [loading, setLoading] = useState(false);

  // State phân trang Client-side (Cố định limit = 18 mục/trang giống Goals)
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 18;

  // Ref để định vị phần đầu trang khi chuyển trang
  const topRef = useRef(null);

  // Điều phối các Modal
  const [modalMode, setModalMode] = useState("add");
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Hàm load dữ liệu bất đồng bộ từ Backend API
  const loadBrands = useCallback(async () => {
    setLoading(true);
    try {
      const brandData = await getAllBrands();
      const productData = typeof getAllProducts === 'function' ? await getAllProducts() : [];
      
      const brandList = Array.isArray(brandData) 
        ? brandData 
        : (brandData?.data || brandData?.brands || []);

      const productList = Array.isArray(productData) 
        ? productData 
        : (productData?.data || productData?.products || []);

      setBrands(brandList);
      setProducts(productList);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu Brands:", error);
      setBrands([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBrands();

    window.addEventListener("brandsChanged", loadBrands);
    window.addEventListener("productsChanged", loadBrands);

    return () => {
      window.removeEventListener("brandsChanged", loadBrands);
      window.removeEventListener("productsChanged", loadBrands);
    };
  }, [loadBrands]);

  // Đếm số lượng sản phẩm thuộc về từng thương hiệu (Xử lý chuẩn theo BrandID & Name)
  const brandsWithCount = useMemo(() => {
    const safeBrands = Array.isArray(brands) ? brands : [];
    const safeProducts = Array.isArray(products) ? products : [];

    return safeBrands.map((b) => {
      const brandId = b?.BrandID ?? b?.id;
      const brandName = String(b?.Name || b?.name || "").trim().toLowerCase();

      const count = safeProducts.filter((p) => {
        const productBrandId = p?.BrandID ?? p?.brandId;
        
        // Ưu tiên 1: So sánh theo BrandID
        if (productBrandId !== undefined && brandId !== undefined && productBrandId !== null && brandId !== null) {
          return Number(productBrandId) === Number(brandId);
        }

        // Ưu tiên 2: Fallback so sánh theo Tên thương hiệu (BrandName)
        const productBrandName = String(p?.BrandName || p?.brand || "").trim().toLowerCase();
        return brandName && productBrandName && productBrandName === brandName;
      }).length;

      return { 
        ...b, 
        id: brandId, 
        name: b?.Name || b?.name, 
        status: b?.Status || b?.status || "active",
        productCount: count 
      };
    });
  }, [brands, products]);

  // Thống kê tổng quan cho Stat Cards
  const stats = useMemo(() => {
    const total = brandsWithCount.length;
    const activeCount = brandsWithCount.filter((b) => String(b.status).toLowerCase() === "active").length;
    const totalProducts = products.length;

    return { total, activeCount, totalProducts };
  }, [brandsWithCount, products]);

  // 1. Lọc thương hiệu theo từ khóa tìm kiếm
  const filteredBrands = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return brandsWithCount;

    return brandsWithCount.filter((b) => {
      const nameMatch = String(b?.name || "").toLowerCase().includes(keyword);
      const countryMatch = String(b?.Country || b?.country || "").toLowerCase().includes(keyword);
      return nameMatch || countryMatch;
    });
  }, [brandsWithCount, searchTerm]);

  // 2. Tính toán tổng số trang dựa trên danh sách đã lọc
  const totalItems = filteredBrands.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;

  // 3. Cắt mảng hiển thị theo trang hiện tại (Client-side Pagination)
  const paginatedBrands = useMemo(() => {
    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredBrands.slice(startIndex, endIndex);
  }, [filteredBrands, currentPage, limit]);

  // Reset về trang 1 khi thay đổi từ khóa tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // ✅ Cuộn lên đầu trang mượt mà mỗi khi đổi trang
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  // Đổi trạng thái Hoạt động / Ẩn (Bất đồng bộ gọi API)
  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === "active" ? "hidden" : "active";
    
    const currentBrand = brands.find((b) => (b.id === id || b.BrandID === id));
    if (!currentBrand) return;

    try {
      const brandId = currentBrand.BrandID ?? currentBrand.id;
      await updateBrand(brandId, { ...currentBrand, Status: nextStatus, status: nextStatus });

      if (selectedBrand && (selectedBrand.id === id || selectedBrand.BrandID === id)) {
        setSelectedBrand((prev) => (prev ? { ...prev, Status: nextStatus, status: nextStatus } : null));
      }
      loadBrands();
    } catch (error) {
      console.error("Lỗi khi thay đổi trạng thái thương hiệu:", error);
    }
  };

  // Mở modal xác nhận xóa
  const handleDeleteClick = (brand) => {
    setSelectedBrand(brand);
    setShowDeleteModal(true);
  };

  // Xác nhận xóa thương hiệu qua API
  const handleConfirmDelete = async () => {
    if (!selectedBrand) return;

    const brandId = selectedBrand.BrandID || selectedBrand.id;
    const brandName = selectedBrand.Name || selectedBrand.name;

    try {
      setIsDeleting(true);
      await deleteBrand(brandId, brandName);
      setShowDeleteModal(false);
      setSelectedBrand(null);
      loadBrands();
    } catch (error) {
      console.error("Lỗi khi xóa thương hiệu:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div ref={topRef} className="space-y-6 font-sans text-gray-800 animate-in fade-in duration-200">
      {/* Tiêu đề & Nút Action chính */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#14213D] tracking-tight">
            Quản lý Thương hiệu
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Quản lý các thương hiệu đối tác và nhà cung cấp sản phẩm của hệ thống GymBro
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setModalMode("add");
            setSelectedBrand(null);
            setShowFormModal(true);
          }}
          className="flex items-center gap-2 bg-[#FCA311] hover:bg-[#e79500] active:scale-95 text-white font-medium px-5 py-3 rounded-xl shadow-md transition-all duration-200 cursor-pointer shrink-0"
        >
          <Plus size={20} />
          <span>Thêm thương hiệu</span>
        </button>
      </div>

      {/* Thống kê 3 Thẻ Chỉ Số (Stat Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Tổng thương hiệu
            </p>
            <h2 className="text-3xl font-bold text-[#14213D] mt-1">
              {stats.total}
            </h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building2 size={24} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Đang hoạt động
            </p>
            <h2 className="text-3xl font-bold text-emerald-600 mt-1">
              {stats.activeCount}
            </h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Tổng số sản phẩm
            </p>
            <h2 className="text-3xl font-bold text-[#14213D] mt-1">
              {stats.totalProducts.toLocaleString("vi-VN")}
            </h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Package size={24} />
          </div>
        </div>
      </div>

      {/* Khu vực Bảng dữ liệu chính */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header Thanh tìm kiếm & Thông tin */}
        <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-[#14213D]">
              Danh sách thương hiệu (Hiển thị {paginatedBrands.length} / Tổng {totalItems})
            </h2>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-72">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Tìm thương hiệu, quốc gia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14213D]/20 focus:border-[#14213D] bg-white transition"
              />
            </div>

            <button
              type="button"
              onClick={loadBrands}
              disabled={loading}
              title="Làm mới dữ liệu"
              className="p-2 border border-gray-200 rounded-xl bg-white text-gray-600 hover:bg-gray-100 active:scale-95 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* Bảng dữ liệu Brand Table */}
        <div className="p-0">
          {paginatedBrands.length > 0 ? (
            <BrandTable
              brands={paginatedBrands}
              onDetail={(item) => {
                setSelectedBrand(item);
                setShowDetailModal(true);
              }}
              onEdit={(item) => {
                setSelectedBrand(item);
                setModalMode("edit");
                setShowFormModal(true);
              }}
              onDelete={handleDeleteClick}
              onToggleStatus={handleToggleStatus}
            />
          ) : (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <Building2 size={24} />
              </div>
              <p className="text-gray-500 text-sm font-medium">
                {searchTerm
                  ? "Không tìm thấy thương hiệu nào phù hợp với từ khóa"
                  : "Chưa có thương hiệu nào được tạo trong hệ thống"}
              </p>
            </div>
          )}
        </div>

        {/* Thanh Phân Trang Căn Giữa (Giống phần Quản lý Mục tiêu) */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex justify-center bg-white">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="w-9 h-9 flex items-center justify-center text-sm border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors font-medium text-gray-700 cursor-pointer"
                title="Trang đầu"
              >
                «
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-9 h-9 flex items-center justify-center text-sm border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors font-medium text-gray-700 cursor-pointer"
                title="Trang trước"
              >
                ‹
              </button>

              {(() => {
                const pages = [];
                let startPage = Math.max(1, currentPage - 1);
                let endPage = Math.min(totalPages, currentPage + 1);

                if (currentPage <= 2) {
                  endPage = Math.min(totalPages, 4);
                } else if (currentPage >= totalPages - 1) {
                  startPage = Math.max(1, totalPages - 3);
                }

                if (startPage > 1) {
                  pages.push(1);
                  if (startPage > 2) {
                    pages.push("...");
                  }
                }

                for (let i = startPage; i <= endPage; i++) {
                  if (i > 0 && i <= totalPages) {
                    pages.push(i);
                  }
                }

                if (endPage < totalPages) {
                  if (endPage < totalPages - 1) {
                    pages.push("...");
                  }
                  pages.push(totalPages);
                }

                return pages.map((page, index) => {
                  if (page === "...") {
                    return (
                      <span key={`ellipsis-${index}`} className="px-2 text-gray-400 font-medium select-none">
                        ...
                      </span>
                    );
                  }

                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`w-9 h-9 text-sm rounded-lg font-medium transition-colors cursor-pointer flex items-center justify-center ${
                        currentPage === page
                          ? "bg-[#3399FF] text-white shadow-sm"
                          : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                });
              })()}

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-9 h-9 flex items-center justify-center text-sm border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors font-medium text-gray-700 cursor-pointer"
                title="Trang sau"
              >
                ›
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="w-9 h-9 flex items-center justify-center text-sm border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors font-medium text-gray-700 cursor-pointer"
                title="Trang cuối"
              >
                »
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hệ thống Modal */}
      <BrandFormModal
        open={showFormModal}
        mode={modalMode}
        brand={selectedBrand}
        onClose={() => {
          setShowFormModal(false);
          loadBrands();
        }}
      />

      <BrandDetailModal
        open={showDetailModal}
        brand={selectedBrand}
        onToggleStatus={handleToggleStatus}
        onClose={() => setShowDetailModal(false)}
      />

      <DeleteModal
        open={showDeleteModal}
        title="Xóa thương hiệu"
        message={`Bạn có chắc muốn xóa thương hiệu "${selectedBrand?.Name || selectedBrand?.name}" khỏi hệ thống? Hành động này có thể ảnh hưởng đến danh mục sản phẩm thuộc thương hiệu này.`}
        loading={isDeleting}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default Brands;