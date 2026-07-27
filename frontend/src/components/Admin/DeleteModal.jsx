import React, { useEffect } from "react";
import { TriangleAlert, Loader2 } from "lucide-react";

function DeleteModal({
  open,
  title = "Xóa dữ liệu",
  message = "Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa mục này không?",
  onClose,
  onConfirm,
  loading = false,
  confirmText = "Xóa",
  cancelText = "Hủy",
}) {
  // Lắng nghe sự kiện phím ESC để đóng modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, loading, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-opacity animate-in fade-in duration-200"
      onClick={!loading ? onClose : undefined}
    >
      {/* Modal Container */}
      <div
        className="w-[480px] max-w-[90vw] rounded-2xl bg-white shadow-2xl overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} // Ngăn sự kiện click lan ra overlay
      >
        {/* Content Section */}
        <div className="flex flex-col items-center px-8 pt-8">
          {/* Cảnh báo tam giác trong vòng tròn đỏ nhạt */}
          <div className="w-20 h-20 rounded-full bg-red-100/80 flex items-center justify-center shrink-0">
            <TriangleAlert
              size={40}
              className="text-red-600 stroke-[2.25]"
            />
          </div>

          {/* Tiêu đề dùng màu thương hiệu #14213D */}
          <h2 className="mt-5 text-2xl font-bold text-[#14213D] text-center tracking-tight">
            {title}
          </h2>

          {/* Nội dung mô tả */}
          <p className="mt-3 text-center text-gray-500 text-sm leading-relaxed max-w-[380px]">
            {message}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center gap-4 px-8 py-8 mt-2">
          {/* Nút Hủy (Secondary Action) */}
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 max-w-[160px] py-3 px-5 rounded-xl border border-gray-300 font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            {cancelText}
          </button>

          {/* Nút Xóa (Primary Danger Action) */}
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 max-w-[160px] py-3 px-5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-medium shadow-sm transition duration-150 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Đang xóa...</span>
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteModal;