import React, { useEffect, useMemo, useState, useRef } from "react";
import { Plus, Package, CheckCircle2, AlertTriangle, Search, Filter } from "lucide-react";

import {
  getAllProducts,
  deleteProduct,
  toggleProductStatus,
} from "../../services/adminProductService";

import ProductTable from "../../components/Admin/ProductTable";
import ProductFormModal from "../../components/Admin/ProductFormModal";
import ProductDetailModal from "../../components/Admin/ProductDetailModal";
import DeleteModal from "../../components/Admin/DeleteModal";

// ✅ HÀM ÉP KIỂU TRẠNG THÁI DB SANG BOOLEAN
const parseDbStatus = (rawStatus) => {
  if (rawStatus === undefined || rawStatus === null) return true;
  if (typeof rawStatus === "boolean") return rawStatus;
  if (typeof rawStatus === "number") return rawStatus === 1;
  if (typeof rawStatus === "string") {
    const lower = rawStatus.trim().toLowerCase();
    return lower === "true" || lower === "1" || lower === "active";
  }
  return true;
};

function ManageProducts() {
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // State phân trang Client-side (Cố định limit = 18 sản phẩm/trang)
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 18; 

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Ref để định vị phần đầu trang
  const topRef = useRef(null);

  // HÀM TÍNH TỔNG TỒN KHO
  const calculateTotalStock = (item) => {
    if (!item) return 0;
    let flavList = item.Flavors || item.flavors || [];
    if (typeof flavList === "string") {
      try {
        flavList = JSON.parse(flavList);
      } catch (e) {
        flavList = [];
      }
    }

    if (Array.isArray(flavList) && flavList.length > 0) {
      return flavList.reduce((sum, f) => {
        const val = f.Stock ?? f.stock ?? f.quantity ?? f.Quantity ?? 0;
        return sum + (Number(val) || 0);
      }, 0);
    }

    const directStock = item.Stock ?? item.stock ?? item.quantity ?? item.Quantity ?? 0;
    return Number(directStock) || 0;
  };

  // ✅ HÀM KIỂM TRA SẢN PHẨM HẾT HÀNG
  const isProductOutOfStock = (item) => {
    if (!item) return false;
    const stock = calculateTotalStock(item);
    const isDbActive = parseDbStatus(item.Status !== undefined ? item.Status : item.status);
    return stock <= 0 || !isDbActive;
  };

  // Tải toàn bộ danh sách sản phẩm từ API
  const loadProducts = async () => {
    try {
      const res = await getAllProducts(); // Lấy toàn bộ danh sách
      const rawList = res?.data || res || [];

      const normalized = rawList.map((p) => {
        const totalStock = calculateTotalStock(p);
        return {
          ...p,
          Stock: totalStock,
          stock: totalStock,
        };
      });

      setProducts(normalized);
    } catch (error) {
      console.error("Lỗi khi tải danh sách sản phẩm:", error);
      setProducts([]);
    }
  };

  // HÀM XỬ LÝ BẬT/TẮT TRẠNG THÁI SẢN PHẨM
  const handleToggleStatus = async (targetItem) => {
    try {
      const targetId = targetItem?.ProductID || targetItem?.id || targetItem?._id;
      if (!targetId) return;

      const fullProduct = products.find(
        (p) => String(p.ProductID || p.id || p._id) === String(targetId)
      );
      if (!fullProduct) return;

      let nextStatus;
      if (typeof targetItem.Status === "boolean") {
        nextStatus = targetItem.Status;
      } else {
        const currentStatus = parseDbStatus(
          fullProduct.Status !== undefined ? fullProduct.Status : fullProduct.status
        );
        nextStatus = !currentStatus;
      }

      const payload = {
        ...fullProduct,
        Status: nextStatus,
        status: nextStatus,
      };

      setProducts((prev) =>
        prev.map((p) =>
          String(p.ProductID || p.id || p._id) === String(targetId)
            ? { ...p, Status: nextStatus, status: nextStatus }
            : p
        )
      );

      const success = await toggleProductStatus(targetId, payload);
      if (!success) {
        loadProducts();
      }
    } catch (err) {
      console.error("Lỗi khi bật/tắt trạng thái sản phẩm:", err);
      loadProducts();
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const handleProductsChange = () => {
      loadProducts();
    };

    window.addEventListener("productsChanged", handleProductsChange);
    return () => {
      window.removeEventListener("productsChanged", handleProductsChange);
    };
  }, []);

  // 1. Lọc sản phẩm theo tìm kiếm và trạng thái
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const name = product.Name || product.name || "";
      const code = product.ProductID || product.id || "";

      const matchesSearch =
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(code).toLowerCase().includes(searchTerm.toLowerCase());

      const isOut = isProductOutOfStock(product);

      if (statusFilter === "inStock") return matchesSearch && !isOut;
      if (statusFilter === "outOfStock") return matchesSearch && isOut;

      return matchesSearch;
    });
  }, [products, searchTerm, statusFilter]);

  // 2. Tính toán tổng số trang dựa trên danh sách đã lọc
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;

  // 3. Cắt mảng hiển thị theo trang hiện tại (Client-side Pagination)
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, limit]);

  // Reset về trang 1 khi thay đổi từ khóa tìm kiếm hoặc bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // ✅ Cuộn lên đầu trang mượt mà mỗi khi đổi trang (hỗ trợ cả custom container lẫn window)
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  const totalStockCount = useMemo(() => {
    return products.reduce((sum, item) => sum + calculateTotalStock(item), 0);
  }, [products]);

  const outOfStockProducts = useMemo(() => {
    return products.filter((item) => isProductOutOfStock(item)).length;
  }, [products]);

  return (
    <div ref={topRef} className="space-y-6">
      {/* Header Màn hình */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#14213D] tracking-tight">
            Quản lý Sản phẩm
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            Theo dõi danh mục, các biến thể hương vị và tổng tồn kho theo thời gian thực.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedProduct(null);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 bg-[#FCA311] hover:bg-[#e79500] text-white font-medium px-5 py-3 rounded-xl shadow-md transition-all cursor-pointer"
        >
          <Plus size={20} />
          <span>Thêm sản phẩm</span>
        </button>
      </div>

      {/* Thống kê Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Tổng sản phẩm (Hệ thống)
            </p>
            <h2 className="text-3xl font-bold text-[#14213D] mt-1">{products.length}</h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package size={24} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Tổng tồn kho (Hệ thống)
            </p>
            <h2 className="text-3xl font-bold text-emerald-600 mt-1">
              {totalStockCount.toLocaleString()}
            </h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 size={24} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Sản phẩm hết hàng
            </p>
            <h2 className="text-3xl font-bold text-red-500 mt-1">{outOfStockProducts}</h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
            <AlertTriangle size={24} />
          </div>
        </div>
      </div>

      {/* Bảng dữ liệu chính */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <h2 className="text-lg font-bold text-[#14213D]">
            Danh sách sản phẩm (Hiển thị {paginatedProducts.length} / Tổng {totalItems})
          </h2>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Ô tìm kiếm */}
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Tìm tên hoặc mã SP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14213D]/20 bg-white"
              />
            </div>

            {/* Filter trạng thái */}
            <div className="relative flex items-center">
              <Filter className="absolute left-3 text-gray-400" size={16} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#14213D]/20 bg-white appearance-none cursor-pointer text-gray-700"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="inStock">Còn hàng</option>
                <option value="outOfStock">Hết hàng</option>
              </select>
            </div>
          </div>
        </div>

        {/* Component Bảng render dữ liệu đã được cắt trang (paginatedProducts) */}
        <ProductTable
          products={paginatedProducts}
          onValues={{
            onView: (item) => {
              setSelectedProduct(item);
              setShowDetailModal(true);
            },
            onEdit: (item) => {
              setSelectedProduct(item);
              setShowEditModal(true);
            },
            onDelete: (id) => {
              const item = products.find((p) => String(p.ProductID || p.id) === String(id));
              if (item) {
                setSelectedProduct(item);
                setShowDeleteModal(true);
              }
            },
          }}
          onToggleStatus={handleToggleStatus}
        />

        {/* Thanh Phân Trang Căn Giữa */}
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
      </div>

      {/* Các Modal */}
      <ProductFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          loadProducts();
        }}
      />

      <ProductFormModal
        isOpen={showEditModal}
        editProduct={selectedProduct}
        onClose={() => {
          setShowEditModal(false);
          setSelectedProduct(null);
        }}
        onSuccess={() => {
          setShowEditModal(false);
          setSelectedProduct(null);
          loadProducts();
        }}
      />

      <ProductDetailModal
        isOpen={showDetailModal}
        product={selectedProduct}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedProduct(null);
        }}
      />

      <DeleteModal
        open={showDeleteModal}
        title="Xóa sản phẩm"
        message={`Bạn có chắc muốn xóa sản phẩm "${selectedProduct?.Name || selectedProduct?.name || ''}" không?`}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedProduct(null);
        }}
        onConfirm={async () => {
          if (!selectedProduct) return;
          try {
            await deleteProduct(selectedProduct.ProductID || selectedProduct.id);
            setShowDeleteModal(false);
            setSelectedProduct(null);
            loadProducts();
          } catch (error) {
            console.error("Lỗi khi xóa sản phẩm:", error);
          }
        }}
      />
    </div>
  );
}

export default ManageProducts;