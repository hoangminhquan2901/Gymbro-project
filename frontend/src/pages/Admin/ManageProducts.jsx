import React, { useEffect, useMemo, useState } from "react";
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

// ✅ HÀM ÉP KIỂU TRẠNG THÁI DB SANG BOOLEAN (ĐỒNG BỘ CẢ 2 FILE)
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

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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

  // ✅ HÀM KIỂM TRA SẢN PHẨM HẾT HÀNG (SỬ DỤNG parseDbStatus ĐỂ ĐỒNG BỘ VỚI BẢNG)
  const isProductOutOfStock = (item) => {
    if (!item) return false;
    const stock = calculateTotalStock(item);
    const isDbActive = parseDbStatus(item.Status !== undefined ? item.Status : item.status);

    // Hết hàng khi: Tồn kho <= 0 HOẶC Trạng thái đang TẮT (isDbActive === false)
    return stock <= 0 || !isDbActive;
  };

  const loadProducts = async () => {
    try {
      const res = await getAllProducts();
      const rawList = Array.isArray(res) ? res : res?.data || [];

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

    const handleProductsChange = () => {
      loadProducts();
    };

    window.addEventListener("productsChanged", handleProductsChange);
    return () => {
      window.removeEventListener("productsChanged", handleProductsChange);
    };
  }, []);

  const totalProducts = products.length;

  const totalStockCount = useMemo(() => {
    return products.reduce((sum, item) => sum + calculateTotalStock(item), 0);
  }, [products]);

  // Đếm số sản phẩm hết hàng
  const outOfStockProducts = useMemo(() => {
    return products.filter((item) => isProductOutOfStock(item)).length;
  }, [products]);

  // Bộ lọc sản phẩm theo từ khóa và trạng thái
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

  return (
    <div className="space-y-6">
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
              Tổng sản phẩm
            </p>
            <h2 className="text-3xl font-bold text-[#14213D] mt-1">{totalProducts}</h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Package size={24} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Tổng tồn kho (Tất cả vị)
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
            Danh sách sản phẩm ({filteredProducts.length})
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

        {/* Component Bảng render */}
        <ProductTable
          products={filteredProducts}
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
      </div>

      {/* Modal Thêm Sản Phẩm */}
      <ProductFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          loadProducts();
        }}
      />

      {/* Modal Cập Nhật Sản Phẩm */}
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

      {/* Modal Chi Tiết Sản Phẩm */}
      <ProductDetailModal
        isOpen={showDetailModal}
        product={selectedProduct}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedProduct(null);
        }}
      />

      {/* Modal Xác Nhận Xóa */}
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