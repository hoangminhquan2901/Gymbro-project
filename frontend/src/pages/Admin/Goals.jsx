import React, { useState, useEffect, useMemo } from "react";
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Tải danh sách Nhu cầu & Sản phẩm bất đồng bộ từ Service API
  const loadGoals = async () => {
    setLoading(true);
    try {
      const fetchedGoals = await getAllGoals();
      // Nếu getAllProducts chưa async thì dùng trực tiếp, nếu đã đổi sang async thì thêm await
      const fetchedProducts = await Promise.resolve(getAllProducts());
      
      setGoals(fetchedGoals || []);
      setProducts(fetchedProducts || []);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu mục tiêu:", error);
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
  return goals.map((g) => {
    const goalId = g?.GoalID ?? g?.id;
    const goalSlug = String(g?.Slug || g?.slug || "").toLowerCase();

    // Lọc xem có bao nhiêu sản phẩm chứa GoalID hoặc Slug này trong mảng p.Goals
    const count = products.filter((p) => {
      // Trường p.Goals từ API là một mảng []
      if (Array.isArray(p?.Goals)) {
        return p.Goals.some((item) => {
          const itemGoalId = item?.GoalID ?? item?.id;
          const itemSlug = String(item?.Slug || item?.slug || "").toLowerCase();

          // Khớp theo GoalID hoặc Slug
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

  // Lọc mục tiêu theo từ khóa tìm kiếm
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

  // Cập nhật gần nhất
  const lastUpdated = useMemo(() => {
    if (!goals || goals.length === 0) return "Chưa có dữ liệu";

    const latestGoal = goals.reduce((latest, current) => {
      const latestDate = new Date(latest.updatedAt || 0);
      const currentDate = new Date(current.updatedAt || 0);
      return currentDate > latestDate ? current : latest;
    }, goals[0]);

    return latestGoal?.updatedAt || "Vừa cập nhật";
  }, [goals]);

  // Thao tác chỉnh sửa
  const handleEdit = (goal) => {
    const originalGoal = goals.find((g) => g.id === goal.id);
    setEditingGoal(originalGoal || goal);
    setIsModalOpen(true);
  };

  // Thao tác đổi trạng thái Ẩn / Hiện trực tiếp (Async)
  const handleToggleStatus = async (goalId, currentStatus) => {
    const goalToUpdate = goals.find((g) => g.id === goalId);
    if (!goalToUpdate) return;

    const newStatus = currentStatus === "active" ? "inactive" : "active";
    await updateGoal(goalId, { ...goalToUpdate, status: newStatus });
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
    await deleteGoal(selectedGoal.id, selectedGoal.name);
    setShowDeleteModal(false);
    setSelectedGoal(null);
    loadGoals();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
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
            <h2 className="text-lg font-bold text-[#14213D] mt-2 truncate max-w-[180px]">
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
              Danh sách nhu cầu luyện tập
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Hiển thị {filteredGoals.length} trên tổng số {totalGoals} mục tiêu
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
          {filteredGoals.length > 0 ? (
            <GoalTable
              goals={filteredGoals}
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