import React, { useEffect } from "react";
import {
  X,
  Target,
  PackageCheck,
  Calendar,
  Clock,
  FileText,
  Tag,
} from "lucide-react";

function GoalDetailModal({ open, goal, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);
console.log("Goal Detail:", goal);
  if (!open || !goal) return null;

  // Hỗ trợ linh hoạt các kiểu tên thuộc tính (chữ hoa / chữ thường từ DB)
  const goalName = goal.name || goal.Name || "";
  const goalSlug = goal.slug || goal.Slug || "";
  const goalImage = goal.image || goal.Image || "";
  const goalDesc = goal.description || goal.Description || "";
  
  const goalCreatedAt = goal.createdAt || goal.CreatedAt || goal.created_at;
  const goalUpdatedAt = goal.updatedAt || goal.UpdatedAt || goal.updated_at;

  const productCount = goal.productCount ?? (goal.products?.length || 0);

  const formatDate = (dateString) => {
    if (!dateString) return "---";
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? dateString : d.toLocaleString("vi-VN");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto transition-all"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-[#FCA311]">
              <Target size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#14213D]">
                Chi tiết nhu cầu
              </h2>
              <p className="text-xs text-gray-500">
                Thông tin tổng quan và các thông số liên quan
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition cursor-pointer"
            title="Đóng Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6">
          {/* BANNER HÌNH ẢNH */}
          <div className="flex justify-center">
            <div className="relative w-full h-52 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center overflow-hidden group">
              {goalImage ? (
                <img
                  src={goalImage}
                  alt={goalName}
                  className="h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                />
              ) : null}

              <div
                className={`flex-col items-center justify-center text-gray-300 ${
                  goalImage ? "hidden" : "flex"
                }`}
              >
                <Target size={64} className="text-amber-200 mb-2" />
                <span className="text-xs font-medium text-gray-400">
                  Chưa có ảnh nhận diện
                </span>
              </div>
            </div>
          </div>

          {/* TÊN VÀ TAG */}
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold text-[#14213D] leading-tight">
                  {goalName}
                </h3>
                {goalSlug && (
                  <span className="inline-flex items-center gap-1 text-xs font-mono text-gray-400 mt-1">
                    <Tag size={12} /> #{goalSlug}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* GRID THÔNG SỐ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-100/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100/80 flex items-center justify-center text-[#FCA311]">
                  <PackageCheck size={20} />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-amber-800/70 block">
                    Số sản phẩm
                  </span>
                  <span className="text-xl font-bold text-[#14213D]">
                    {productCount}{" "}
                    <span className="text-xs font-normal text-gray-500">
                      sản phẩm
                    </span>
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-500">
                <Calendar size={18} />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
                  Ngày khởi tạo
                </span>
                <span className="text-sm font-bold text-[#14213D]">
                  {formatDate(goalCreatedAt)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3 sm:col-span-2">
              <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-gray-500">
                <Clock size={18} />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 block">
                  Lần cập nhật gần nhất
                </span>
                <span className="text-sm font-bold text-[#14213D]">
                  {formatDate(goalUpdatedAt)}
                </span>
              </div>
            </div>
          </div>

          {/* MÔ TẢ */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
              <FileText size={14} />
              <span>Mô tả nhu cầu</span>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-sm text-gray-700 leading-relaxed min-h-[80px]">
              {goalDesc ? (
                <p className="whitespace-pre-line">{goalDesc}</p>
              ) : (
                <span className="italic text-gray-400">
                  Chưa có thông tin mô tả chi tiết cho nhu cầu này.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="border-t border-gray-100 px-6 py-4 bg-gray-50/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-[#14213D] hover:bg-[#1d335f] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-md transition active:scale-95 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

export default GoalDetailModal;