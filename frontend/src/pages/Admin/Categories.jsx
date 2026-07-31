import React, { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  FolderTree,
  Package,
  Layers,
  X,
  RefreshCw,
  Loader2,
} from "lucide-react";

import {
  getAllCategories,
  deleteCategory,
} from "../../services/adminCategoryService";
import { getAllProducts } from "../../services/adminProductService";

import CategoryTable from "../../components/Admin/CategoryTable";
import CategoryFormModal from "../../components/Admin/CategoryFormModal";
import CategoryDetailModal from "../../components/Admin/CategoryDetailModal";
import DeleteModal from "../../components/Admin/DeleteModal";

// 🔤 HELPER: Chuẩn hóa tiếng Việt loại bỏ dấu
const removeVietnameseTones = (str) => {
  if (!str) return "";
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();
};

function Categories() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all' | 'root' | 'sub'

  // 🔥 STATE QUẢN LÝ MỞ RỘNG (EXPAND/COLLAPSE) CHO TỪNG DANH MỤC GỐC
  const [expandedRoots, setExpandedRoots] = useState(new Set());

  // 🔥 STATE PHÂN TRANG (3 danh mục gốc / trang)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(3);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 🔄 1. TẢI DỮ LIỆU
  async function loadData() {
    setLoading(true);
    try {
      const [catData, prodData] = await Promise.all([
        getAllCategories(1, 10000),
        getAllProducts ? getAllProducts(1, 10000) : Promise.resolve([]),
      ]);

      const rawCategoryList = Array.isArray(catData)
        ? catData
        : catData?.data || catData?.categories || [];
      const productList = Array.isArray(prodData)
        ? prodData
        : prodData?.data || prodData?.products || [];

      // 🔥 HÀM LÀM PHẲNG CÂY DANH MỤC (Xử lý trường hợp API trả về mảng có chứa thuộc tính `children`)
      const flattenCategories = (items) => {
        let result = [];
        if (!Array.isArray(items)) return result;
        
        items.forEach((item) => {
          result.push(item);
          if (item.children && Array.isArray(item.children) && item.children.length > 0) {
            result = result.concat(flattenCategories(item.children));
          }
        });
        return result;
      };

      const flattenedList = flattenCategories(rawCategoryList);

      const categoryList = flattenedList.map((cat) => {
        const pId =
          cat.ParentCategoryID ??
          cat.parentCategoryID ??
          cat.ParentID ??
          cat.parent_id;

        if (pId && !cat.ParentName && !cat.parentName && !cat.parent) {
          const parentObj = flattenedList.find(
            (c) => Number(c.CategoryID || c.id) === Number(pId)
          );
          if (parentObj) {
            return {
              ...cat,
              ParentName: parentObj.Name || parentObj.name,
            };
          }
        }
        return cat;
      });

      setCategories(categoryList);
      setProducts(productList);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu từ API:", error);
      setCategories([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Reset trang về 1 khi tìm kiếm hoặc đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  // 🛠️ HELPER CHECK DANH MỤC GỐC
  const isRootCategory = (item) => {
    if (!item) return false;
    const parentCatId =
      item.ParentCategoryID ??
      item.parentCategoryID ??
      item.ParentID ??
      item.parent_id;
    const parentName = item.parent ?? item.parentName ?? item.ParentName;

    const hasNoParentId =
      parentCatId === null ||
      parentCatId === undefined ||
      parentCatId === 0 ||
      parentCatId === "" ||
      parentCatId === "0";
    const hasNoParentName =
      !parentName ||
      String(parentName).trim().toLowerCase() === "gốc" ||
      String(parentName).trim().toLowerCase() === "goc";

    return hasNoParentId && hasNoParentName;
  };

  const totalCategories = Array.isArray(categories) ? categories.length : 0;
  const totalProducts = Array.isArray(products) ? products.length : 0;

  const rootCategoriesCount = useMemo(() => {
    if (!Array.isArray(categories)) return 0;
    return categories.filter((item) => isRootCategory(item)).length;
  }, [categories]);

  const subCategoriesCount = totalCategories - rootCategoriesCount;

  // 🔥 2. TÍNH SỐ LƯỢNG SẢN PHẨM CHO TỪNG DANH MỤC
  const categoriesWithCount = useMemo(() => {
    if (!Array.isArray(categories)) return [];

    return categories.map((cat) => {
      if (!cat) return { productCount: 0 };
      if (typeof cat.ProductCount === "number") {
        return { ...cat, productCount: cat.ProductCount };
      }
      if (!Array.isArray(products)) return { ...cat, productCount: 0 };

      const catName = String(cat.Name || cat.name || "").trim().toLowerCase();
      const catId = String(cat.CategoryID || cat.id || "").trim().toLowerCase();

      const count = products.filter((p) => {
        if (!p) return false;
        const isMatch = (fieldValue) => {
          if (!fieldValue) return false;
          if (typeof fieldValue === "object") {
            const fId = String(fieldValue.CategoryID || fieldValue.id || "")
              .trim()
              .toLowerCase();
            const fName = String(fieldValue.Name || fieldValue.name || "")
              .trim()
              .toLowerCase();
            return (
              fId === catId ||
              fId === catName ||
              fName === catId ||
              fName === catName
            );
          }
          const fString = String(fieldValue).trim().toLowerCase();
          return fString === catId || fString === catName;
        };

        return (
          isMatch(p.category) ||
          isMatch(p.subcategory) ||
          isMatch(p.subCategory) ||
          isMatch(p.subcate) ||
          isMatch(p.SubCategoryID) ||
          isMatch(p.CategoryID)
        );
      }).length;

      return { ...cat, productCount: count };
    });
  }, [categories, products]);

  // 🔥 3. LỌC DANH MỤC GỐC VÀ TỰ ĐỘNG MỞ RỘNG KHI TÌM KIẾM
  const filteredRootCategories = useMemo(() => {
    if (!Array.isArray(categoriesWithCount)) return [];

    const roots = categoriesWithCount.filter((item) => isRootCategory(item));
    const normalizedSearch = removeVietnameseTones(searchTerm);

    if (!normalizedSearch) {
      if (filterType === "root") return roots;
      if (filterType === "sub") return [];
      return roots;
    }

    return roots.filter((root) => {
      const rootId = String(root.CategoryID || root.id || "");
      const rootName = String(root.Name || root.name || "");
      const rootNameNorm = removeVietnameseTones(rootName);

      const children = categoriesWithCount.filter((sub) => {
        if (!sub || isRootCategory(sub)) return false;
        const subParentId = String(
          sub.ParentCategoryID ?? sub.parentCategoryID ?? sub.ParentID ?? ""
        ).trim();
        const subParentName = String(
          sub.parent ?? sub.parentName ?? sub.ParentName ?? ""
        )
          .trim()
          .toLowerCase();
        return (
          subParentId === rootId ||
          subParentName === rootName.trim().toLowerCase()
        );
      });

      const rootMatches = rootNameNorm.includes(normalizedSearch);
      const childMatches = children.some((sub) =>
        removeVietnameseTones(sub.Name || sub.name || "").includes(
          normalizedSearch
        )
      );

      return rootMatches || childMatches;
    });
  }, [categoriesWithCount, searchTerm, filterType]);

  // Tự động mở rộng danh mục gốc khi tìm kiếm khớp danh mục con
  useEffect(() => {
    if (searchTerm.trim()) {
      const normalizedSearch = removeVietnameseTones(searchTerm);
      const matchedRootIds = new Set();

      categoriesWithCount.forEach((root) => {
        if (!isRootCategory(root)) return;
        const rootId = String(root.CategoryID || root.id || "");
        const rootName = String(root.Name || root.name || "");
        const rootNameNorm = removeVietnameseTones(rootName);

        const children = categoriesWithCount.filter((sub) => {
          if (!sub || isRootCategory(sub)) return false;
          const subParentId = String(
            sub.ParentCategoryID ?? sub.parentCategoryID ?? sub.ParentID ?? ""
          ).trim();
          const subParentName = String(
            sub.parent ?? sub.parentName ?? sub.ParentName ?? ""
          )
            .trim()
            .toLowerCase();
          return (
            subParentId === rootId ||
            subParentName === rootName.trim().toLowerCase()
          );
        });

        const rootMatches = rootNameNorm.includes(normalizedSearch);
        const childMatches = children.some((sub) =>
          removeVietnameseTones(sub.Name || sub.name || "").includes(
            normalizedSearch
          )
        );

        if (rootMatches || childMatches) {
          matchedRootIds.add(rootId);
        }
      });
      setExpandedRoots(matchedRootIds);
    } else {
      setExpandedRoots(new Set());
    }
  }, [searchTerm, categoriesWithCount]);

  const handleToggleExpand = (rootId) => {
    setExpandedRoots((prev) => {
      const next = new Set(prev);
      if (next.has(rootId)) {
        next.delete(rootId);
      } else {
        next.add(rootId);
      }
      return next;
    });
  };

  // 🔥 4. PHÂN TRANG TRÊN DANH MỤC GỐC
  const totalPages = Math.ceil(filteredRootCategories.length / pageSize) || 1;

  const paginatedRootCategories = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRootCategories.slice(start, start + pageSize);
  }, [filteredRootCategories, currentPage, pageSize]);

  // 🗑️ 5. XÓA DANH MỤC
  const handleDeleteConfirm = async () => {
    if (!selectedCategory) return;
    const categoryId = selectedCategory.CategoryID || selectedCategory.id;
    const categoryName = selectedCategory.Name || selectedCategory.name;

    if (!categoryId) {
      alert("Không tìm thấy mã danh mục (CategoryID) hợp lệ!");
      return;
    }

    setDeleteLoading(true);
    try {
      await deleteCategory(categoryId, categoryName);
      setShowDeleteModal(false);
      setSelectedCategory(null);
      await loadData();
    } catch (error) {
      console.error("Lỗi khi xóa danh mục:", error);
      const serverMessage = error.response?.data?.message;
      alert(
        serverMessage ||
          "Xóa danh mục thất bại. Vui lòng kiểm tra lại ràng buộc dữ liệu!"
      );
    } finally {
      setDeleteLoading(false);
    }
  };

  const getSelectedCategoryName = () => {
    return selectedCategory?.Name || selectedCategory?.name || "danh mục này";
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER TRANG */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14213D] tracking-tight">
            Quản lý danh mục
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Giao diện gọn gàng với tính năng thu gọn/mở rộng danh mục gốc linh hoạt
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-[#FCA311] hover:bg-[#e08f07] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-amber-500/15 transition active:scale-95 cursor-pointer"
        >
          <Plus size={18} />
          Thêm danh mục mới
        </button>
      </div>

      {/* 2. THẺ THỐNG KÊ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Tổng danh mục
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-[#FCA311]">
              <FolderTree size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h2 className="text-2xl font-bold text-[#14213D]">
              {totalCategories}
            </h2>
            <span className="text-xs text-gray-400 font-medium">mục</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Tổng sản phẩm
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Package size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <h2 className="text-2xl font-bold text-[#14213D]">
              {totalProducts}
            </h2>
            <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
              Đang kinh doanh
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Cấu trúc phân cấp
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Layers size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div>
              <span className="text-2xl font-bold text-[#14213D]">
                {rootCategoriesCount}
              </span>
              <span className="text-xs text-gray-400 ml-1">Gốc</span>
            </div>
            <div className="h-6 w-px bg-gray-200" />
            <div>
              <span className="text-2xl font-bold text-[#14213D]">
                {subCategoriesCount}
              </span>
              <span className="text-xs text-gray-400 ml-1">Con</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. KHU VỰC BẢNG & BỘ LỌC */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Tìm danh mục Gốc hoặc Con..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-9 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-[#FCA311] focus:ring-2 focus:ring-[#FCA311]/20 transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200 shrink-0">
              <button
                onClick={() => setFilterType("all")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                  filterType === "all"
                    ? "bg-white text-[#14213D] shadow-xs"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                Tất cả gốc ({rootCategoriesCount})
              </button>
            </div>
          </div>
        </div>

        {/* 🔥 THANH PHÂN TRANG ĐẶT Ở PHÍA TRÊN */}
        {!loading && filteredRootCategories.length > 0 && (
          <div className="px-5 py-3 bg-gray-50/80 border-b border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="mr-2 font-medium">
                Trang <strong className="text-[#14213D]">{currentPage}</strong> /{" "}
                {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-xs"
              >
                Trước
              </button>

              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .map((page, index, array) => {
                    const previousPage = array[index - 1];
                    const showEllipsis = previousPage && page - previousPage > 1;
                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && (
                          <span className="px-1 text-gray-400">...</span>
                        )}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg font-semibold transition cursor-pointer shadow-xs ${
                            currentPage === page
                              ? "bg-[#FCA311] text-white"
                              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg font-semibold text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-xs"
              >
                Sau
              </button>
            </div>
          </div>
        )}

        {/* Loading / Table Component */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Loader2 size={32} className="animate-spin text-[#FCA311] mb-2" />
            <p className="text-xs font-medium">Đang tải dữ liệu từ máy chủ...</p>
          </div>
        ) : (
          <CategoryTable
            roots={paginatedRootCategories}
            allCategories={categoriesWithCount}
            expandedRoots={expandedRoots}
            onToggleExpand={handleToggleExpand}
            loading={loading}
            onDetail={(item) => {
              setSelectedCategory(item);
              setShowDetailModal(true);
            }}
            onEdit={(item) => {
              setSelectedCategory(item);
              setShowEditModal(true);
            }}
            onDelete={(item) => {
              setSelectedCategory(item);
              setShowDeleteModal(true);
            }}
          />
        )}

        {/* Empty State */}
        {!loading && filteredRootCategories.length === 0 && (
          <div className="text-center py-16 px-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-[#FCA311] flex items-center justify-center mx-auto mb-3">
              <FolderTree size={24} />
            </div>
            <h3 className="text-base font-bold text-[#14213D]">
              Không tìm thấy danh mục
            </h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {searchTerm
                ? `Không tìm thấy kết quả phù hợp với từ khóa "${searchTerm}".`
                : "Chưa có danh mục nào được khởi tạo trong hệ thống."}
            </p>
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterType("all");
                }}
                className="mt-4 text-xs font-semibold text-[#FCA311] hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <RefreshCw size={12} /> Đặt lại bộ lọc
              </button>
            )}
          </div>
        )}
      </div>

      {/* MODALS */}
      <CategoryFormModal
        open={showAddModal}
        mode="add"
        categories={categories}
        onClose={() => setShowAddModal(false)}
        onSuccess={loadData}
      />

      <CategoryFormModal
        open={showEditModal}
        mode="edit"
        category={selectedCategory}
        categories={categories}
        onClose={() => setShowEditModal(false)}
        onSuccess={loadData}
      />

      <CategoryDetailModal
        open={showDetailModal}
        category={selectedCategory}
        categories={categories}
        onClose={() => setShowDetailModal(false)}
      />

      <DeleteModal
        open={showDeleteModal}
        loading={deleteLoading}
        title="Xóa danh mục"
        message={`Bạn có chắc muốn xóa danh mục "${getSelectedCategoryName()}" không? Thao tác này sẽ không thể hoàn tác.`}
        onClose={() => !deleteLoading && setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}

export default Categories;