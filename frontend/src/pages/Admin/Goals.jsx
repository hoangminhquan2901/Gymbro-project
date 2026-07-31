import React, { useState, useEffect, useMemo, useRef } from "react";
import { Plus, Target, Package, Clock, Search, RefreshCw } from "lucide-react";

import { 
  getAllGoals, 
  deleteGoal,
  updateGoal 
} from "../../services/adminGoalService"; 
import { getAllProducts } from "../../services/adminProductService";

import GoalTable from "../../components/Admin/GoalTable";
import GoalFormModal from "../../components/Admin/GoalFormModal";
import GoalDetailModal from "../../components/Admin/GoalDetailModal";
import DeleteModal from "../../components/Admin/DeleteModal";

function Goals() {
  const [goals, setGoals] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // State phân trang Client-side (Cố định limit = 18 mục tiêu/trang)
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 18;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Ref để định vị phần đầu trang khi chuyển trang
  const topRef = useRef(null);

  // Tải danh sách Nhu cầu & Sản phẩm bất đồng bộ từ Service API
  const loadGoals = async () => {
    setLoading(true);
    try {
      const resGoals = await getAllGoals();
      const resProducts = await Promise.resolve(getAllProducts());
      
      const goalList = Array.isArray(resGoals) 
        ? resGoals 
        : (resGoals?.data || resGoals?.goals || []);

      const productList = Array.isArray(resProducts) 
        ? resProducts 
        : (resProducts?.data || resProducts?.products || []);

      setGoals(goalList);
      setProducts(productList);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu mục tiêu:", error);
      setGoals([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();

    window.addEventListener("goalsChanged", loadGoals);
    window.addEventListener("productsChanged", loadGoals);

    return () => {
      window.removeEventListener("goalsChanged", loadGoals);
      window.removeEventListener("productsChanged", loadGoals);
    };
  }, []);

  // 📊 Thống kê chỉ số
  const totalGoals = goals.length;
  const totalProducts = products.length;

  // 🛠️ Tính toán động số lượng sản phẩm gán vào từng mục tiêu
  const goalsWithCount = useMemo(() => {
    const safeGoals = Array.isArray(goals) ? goals : [];
    const safeProducts = Array.isArray(products) ? products : [];

    return safeGoals.map((g) => {
      const goalId = g?.GoalID ?? g?.id;
      const goalSlug = String(g?.Slug || g?.slug || "").toLowerCase();

      const count = safeProducts.filter((p) => {
        if (Array.isArray(p?.Goals)) {
          return p.Goals.some((item) => {
            const itemGoalId = item?.GoalID ?? item?.id;
            const itemSlug = String(item?.Slug || item?.slug || "").toLowerCase();

            return (
              (itemGoalId !== undefined && Number(itemGoalId) === Number(goalId)) ||
              (goalSlug && itemSlug === goalSlug)
            );
          });
        }
        return false;
      }).length;

      return {
        ...g,
        productCount: count
      };
    });
  }, [goals, products]);

  // 1. Lọc mục tiêu theo từ khóa tìm kiếm
  const filteredGoals = useMemo(() => {
    if (!searchTerm.trim()) return goalsWithCount;
    const term = searchTerm.toLowerCase();
    return goalsWithCount.filter(
      (g) =>
        g.name?.toLowerCase().includes(term) ||
        g.description?.toLowerCase().includes(term) ||
        g.slug?.toLowerCase().includes(term)
    );
  }, [goalsWithCount, searchTerm]);

  // 2. Tính toán tổng số trang dựa trên danh sách đã lọc
  const totalItems = filteredGoals.length;
  const totalPages = Math.ceil(totalItems / limit) || 1;

  // 3. Cắt mảng hiển thị theo trang hiện tại (Client-side Pagination)
  const paginatedGoals = useMemo(() => {
    const startIndex = (currentPage - 1) * limit;
    const endIndex = startIndex + limit;
    return filteredGoals.slice(startIndex, endIndex);
  }, [filteredGoals, currentPage, limit]);

  // Reset về trang 1 khi thay đổi từ khóa tìm kiếm
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // ✅ Cuộn lên đầu trang mượt mà mỗi khi đổi trang
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  // Cập nhật gần nhất (Đã định dạng lại thời gian hiển thị gọn gàng, rõ ràng)
  const lastUpdated = useMemo(() => {
    if (!goals || goals.length === 0) return "Chưa có dữ liệu";

    const latestGoal = goals.reduce((latest, current) => {
      const latestDate = new Date(latest.updatedAt || 0);
      const currentDate = new Date(current.updatedAt || 0);
      return currentDate > latestDate ? current : latest;
    }, goals[0]);

    if (!latestGoal?.updatedAt) return "Vừa cập nhật";

    const date = new Date(latestGoal.updatedAt);
    if (isNaN(date.getTime())) return latestGoal.updatedAt;

    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }, [goals]);

  // Thao tác chỉnh sửa
  const handleEdit = (goal) => {
    const goalKey = goal.GoalID ?? goal.id;
    const originalGoal = goals.find((g) => (g.GoalID ?? g.id) === goalKey);
    setEditingGoal(originalGoal || goal);
    setIsModalOpen(true);
  };

  // Thao tác đổi trạng thái Ẩn / Hiện trực tiếp (Async)
  const handleToggleStatus = async (goalId, currentStatus) => {
    const goalToUpdate = goals.find((g) => (g.GoalID ?? g.id) === goalId);
    if (!goalToUpdate) return;

    const realId = goalToUpdate.GoalID ?? goalToUpdate.id;
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    await updateGoal(realId, { ...goalToUpdate, status: newStatus });
    loadGoals();
  };

  const handleDeleteTrigger = (goal) => {
    setSelectedGoal(goal);
    setShowDeleteModal(true);
  };

  const handleDetailTrigger = (goal) => {
    setSelectedGoal(goal);
    setShowDetailModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedGoal) return;
    const realId = selectedGoal.GoalID ?? selectedGoal.id;
    await deleteGoal(realId, selectedGoal.name);
    setShowDeleteModal(false);
    setSelectedGoal(null);
    loadGoals();
  };

  return (
    <div ref={topRef} className="space-y-6 animate-in fade-in duration-200">
      {/* TIÊU ĐỀ TRANG */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#14213D] tracking-tight">
            Quản lý Mục tiêu & Nhu cầu
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Thiết lập danh mục nhu cầu tập luyện để phân loại và gợi ý sản phẩm phù hợp cho GymBro
          </p>
        </div>

        <button
          type="button"
          onClick={loadGoals}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 transition shadow-2xs cursor-pointer disabled:opacity-50"
          title="Tải lại dữ liệu"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>{loading ? "Đang tải..." : "Làm mới"}</span>
        </button>
      </div>

      {/* 📊 KHU VỰC THỐNG KÊ KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Mục tiêu / Nhu cầu
            </p>
            <h2 className="text-3xl font-extrabold text-[#14213D] mt-1">
              {totalGoals}
            </h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#FCA311] flex items-center justify-center border border-amber-100/60 shrink-0">
            <Target size={24} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Tổng sản phẩm
            </p>
            <h2 className="text-3xl font-extrabold text-[#14213D] mt-1">
              {totalProducts}
            </h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-100/60 shrink-0">
            <Package size={24} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Cập nhật gần nhất
            </p>
            <h2 className="text-lg font-bold text-[#14213D] mt-2 truncate max-w-[180px]" title={lastUpdated}>
              {lastUpdated}
            </h2>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100/60 shrink-0">
            <Clock size={24} />
          </div>
        </div>
      </div>

      {/* DANH SÁCH BẢNG NHU CẦU */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-gray-100 bg-gray-50/40">
          <div>
            <h2 className="text-lg font-bold text-[#14213D]">
              Danh sách nhu cầu luyện tập (Hiển thị {paginatedGoals.length} / Tổng {totalItems})
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Phân trang quản lý danh mục mục tiêu hệ thống
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-64">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm nhu cầu..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs outline-none focus:border-[#FCA311] focus:ring-2 focus:ring-[#FCA311]/20 transition"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setEditingGoal(null);
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-2 bg-[#FCA311] hover:bg-[#e28e00] active:scale-95 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer shrink-0"
            >
              <Plus size={16} />
              <span>Thêm nhu cầu</span>
            </button>
          </div>
        </div>

        <div className="p-0">
          {paginatedGoals.length > 0 ? (
            <GoalTable
              goals={paginatedGoals}
              onEdit={handleEdit}
              onDelete={handleDeleteTrigger}
              onDetail={handleDetailTrigger}
              onToggleStatus={handleToggleStatus}
            />
          ) : (
            <div className="text-center py-16 px-4">
              <div className="w-12 h-12 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-3">
                <Target size={24} />
              </div>
              <p className="text-gray-500 text-sm font-medium">
                {searchTerm
                  ? "Không tìm thấy nhu cầu nào phù hợp với từ khóa"
                  : "Chưa có nhu cầu nào được tạo trong hệ thống"}
              </p>
            </div>
          )}
        </div>

        {/* Thanh Phân Trang Căn Giữa */}
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

      {/* MODAL FORM */}
      <GoalFormModal
        open={isModalOpen}
        mode={editingGoal ? "edit" : "add"}
        goal={editingGoal}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGoal(null);
          loadGoals();
        }}
      />

      {/* MODAL CHI TIẾT */}
      <GoalDetailModal
        open={showDetailModal}
        goal={selectedGoal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedGoal(null);
        }}
        onToggleStatus={handleToggleStatus}
      />

      {/* MODAL XÁC NHẬN XÓA */}
      <DeleteModal
        open={showDeleteModal}
        title="Xóa nhu cầu luyện tập"
        message={`Bạn có chắc chắn muốn xóa nhu cầu "${selectedGoal?.name}" không? Hành động này không thể hoàn tác.`}
        onClose={() => {
          setShowDeleteModal(false);
          setSelectedGoal(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

export default Goals;