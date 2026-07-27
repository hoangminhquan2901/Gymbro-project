import React, { useState, useEffect, useMemo, useCallback } from "react";
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

  // Điều phối các Modal
  const [modalMode, setModalMode] = useState("add");
  const [showFormModal, setShowFormModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Hàm load dữ liệu bất đồng bộ từ Backend API
  const loadBrands = useCallback(async () => {
    try {
      const brandData = await getAllBrands();
      // Nếu service sản phẩm của bạn là async, dùng await; nếu là đồng bộ thì giữ nguyên
      const productData = typeof getAllProducts === 'function' ? await getAllProducts() : [];
      
      setBrands(Array.isArray(brandData) ? brandData : []);
      setProducts(Array.isArray(productData) ? productData : []);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu Brands:", error);
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

  // Đếm số lượng sản phẩm thuộc về từng thương hiệu (Xử lý chuỗi an toàn)
  const brandsWithCount = useMemo(() => {
  return brands.map((b) => {
    // Lấy ID thương hiệu (Uu tiên BrandID từ DB, fallback sang id)
    const brandId = b?.BrandID ?? b?.id;
    const brandName = String(b?.Name || b?.name || "").trim().toLowerCase();

    const count = products.filter((p) => {
      const productBrandId = p?.BrandID ?? p?.brandId;
      
      // Ưu tiên 1: So sánh theo BrandID (Chuẩn nhất)
      if (productBrandId !== undefined && brandId !== undefined) {
        return Number(productBrandId) === Number(brandId);
      }

      // Ưu tiên 2: Fallback so sánh theo Tên thương hiệu nếu mất ID
      const productBrandName = String(p?.BrandName || p?.brand || "").trim().toLowerCase();
      return productBrandName === brandName;
    }).length;

    return { 
      ...b, 
      id: brandId, // Chuẩn hóa ID
      name: b?.Name || b?.name, // Chuẩn hóa Tên
      productCount: count 
    };
  });
}, [brands, products]);

  // Thống kê tổng quan cho Stat Cards
  const stats = useMemo(() => {
    const total = brandsWithCount.length;
    const activeCount = brandsWithCount.filter((b) => b.status === "active").length;
    const totalProducts = products.length;

    return { total, activeCount, totalProducts };
  }, [brandsWithCount, products]);

  // Lọc thương hiệu theo từ khóa tìm kiếm (An toàn dữ liệu)
  const filteredBrands = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return brandsWithCount;

    return brandsWithCount.filter((b) => {
      const nameMatch = String(b?.name || "").toLowerCase().includes(keyword);
      const countryMatch = String(b?.country || "").toLowerCase().includes(keyword);
      return nameMatch || countryMatch;
    });
  }, [brandsWithCount, searchTerm]);

  // Đổi trạng thái Hoạt động / Tắt (Bất đồng bộ gọi API)
  const handleToggleStatus = async (id, currentStatus) => {
    // Đồng bộ chuyển đổi thành "hidden" thay vì "inactive" để khớp với hệ thống
    const nextStatus = currentStatus === "active" ? "hidden" : "active";
    
    // Tìm thương hiệu hiện tại để lấy đủ payload cập nhật
    const currentBrand = brands.find((b) => b.id === id || b.BrandID === id);
    if (!currentBrand) return;

    try {
      await updateBrand(id, { ...currentBrand, status: nextStatus });

      if (selectedBrand && (selectedBrand.id === id || selectedBrand.BrandID === id)) {
        setSelectedBrand((prev) => (prev ? { ...prev, status: nextStatus } : null));
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

    const brandId = selectedBrand.id || selectedBrand.BrandID;

    try {
      setIsDeleting(true);
      await deleteBrand(brandId, selectedBrand.name);
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
    <div className="space-y-6 font-sans text-gray-800">
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
              Danh sách thương hiệu
            </h2>
            <span className="text-xs font-semibold bg-gray-200 text-gray-700 px-2.5 py-0.5 rounded-full">
              {filteredBrands.length}
            </span>
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
              onClick={loadBrands}
              title="Làm mới dữ liệu"
              className="p-2 border border-gray-200 rounded-xl bg-white text-gray-600 hover:bg-gray-100 active:scale-95 transition cursor-pointer"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* Bảng dữ liệu Brand Table */}
        <BrandTable
          brands={filteredBrands}
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
        message={`Bạn có chắc muốn xóa thương hiệu "${selectedBrand?.name}" khỏi hệ thống? Hành động này có thể ảnh hưởng đến danh mục sản phẩm thuộc thương hiệu này.`}
        loading={isDeleting}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default Brands;