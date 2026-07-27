import React, { useEffect, useState } from "react";
import { X, UploadCloud, Image as ImageIcon, AlertCircle } from "lucide-react";
import { addGoal, updateGoal } from "../../services/adminGoalService";

function GoalFormModal({ open, mode = "add", goal, onClose }) {
  const [form, setForm] = useState({ name: "", description: "", image: "" });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setErrors({});
      if (mode === "edit" && goal) {
        setForm({
          name: goal.name || "",
          description: goal.description || "",
          image: goal.image || "",
        });
      } else {
        setForm({ name: "", description: "", image: "" });
      }
    }
  }, [mode, goal, open]);

  useEffect(() => {
    if (open) {
      setErrors({});
      if (mode === "edit" && goal) {
        setForm({
          name: goal.Name || goal.name || "",
          description: goal.Description || goal.description || "",
          image: goal.Image || goal.image || "",
        });
      } else {
        // Nếu là chế độ thêm mới, ép buộc reset form về rỗng ngay lập tức
        setForm({ name: "", description: "", image: "" });
      }
    } else {
      // Khi modal vừa đóng xong, dọn sạch form luôn để lần mở sau không bị chớp ảnh cũ
      setForm({ name: "", description: "", image: "" });
      setErrors({});
    }
  }, [open, mode, goal]);

  if (!open) return null;

  function handleImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Kích thước ảnh không được vượt quá 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      setErrors({ name: "Vui lòng nhập tên nhu cầu" });
      return;
    }

    setIsSubmitting(true);

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() ? form.description.trim() : null,
      image: form.image.trim() ? form.image.trim() : null,
    };

    try {
      if (mode === "add") {
        await addGoal(payload);
      } else {
        const goalId = goal?.id || goal?._id || goal?.Id || goal?.GoalID;
        await updateGoal(goalId, payload);
      }

      // 1. Reset state form về rỗng NGAY LẬP TỨC khi thành công
      setForm({ name: "", description: "", image: "" });
      setErrors({});

      // 2. Đóng modal
      onClose();
    } catch (err) {
      console.error("Lỗi khi lưu nhu cầu:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto transition-all"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white">
          <h2 className="text-xl font-bold text-[#14213D]">
            {mode === "add" ? "Thêm nhu cầu mới" : "Chỉnh sửa nhu cầu"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* UPLOAD IMAGE */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Logo nhu cầu
            </label>
            {form.image ? (
              <div className="relative border-2 border-gray-200 rounded-xl h-44 flex justify-center items-center bg-gray-50 overflow-hidden group">
                <img
                  src={form.image}
                  alt="Preview"
                  className="h-full w-full object-contain p-2"
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                  <label className="bg-white text-gray-800 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md hover:bg-gray-100 transition cursor-pointer flex items-center gap-1.5">
                    <ImageIcon size={14} /> Thay ảnh
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImage}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, image: "" })}
                    className="bg-rose-500 hover:bg-rose-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md transition cursor-pointer flex items-center gap-1.5"
                  >
                    <X size={14} /> Xóa
                  </button>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-gray-300 hover:border-[#FCA311] bg-gray-50/50 hover:bg-amber-50/20 rounded-xl h-44 flex flex-col justify-center items-center cursor-pointer transition-all duration-200 group">
                <div className="w-12 h-12 rounded-full bg-amber-50 group-hover:bg-amber-100/80 flex items-center justify-center mb-2 transition">
                  <UploadCloud
                    size={24}
                    className="text-[#FCA311] group-hover:scale-110 transition-transform"
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-[#FCA311] transition">
                  Nhấp để chọn ảnh hoặc kéo thả vào đây
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  Hỗ trợ PNG, JPG, WEBP (Tối đa 5MB)
                </span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImage}
                />
              </label>
            )}
          </div>

          {/* TÊN */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Tên nhu cầu <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: "" });
              }}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition duration-150 ${
                errors.name
                  ? "border-rose-400 bg-rose-50/30 focus:ring-2 focus:ring-rose-200"
                  : "border-gray-200 focus:border-[#FCA311] focus:ring-2 focus:ring-[#FCA311]/20 bg-white"
              }`}
              placeholder="Nhập tên nhu cầu..."
            />
            {errors.name && (
              <div className="flex items-center gap-1 text-rose-500 text-xs mt-1.5 font-medium">
                <AlertCircle size={13} />
                <span>{errors.name}</span>
              </div>
            )}
          </div>

          {/* MÔ TẢ */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Mô tả ngắn
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none resize-none focus:border-[#FCA311] focus:ring-2 focus:ring-[#FCA311]/20 transition"
              placeholder="Nhập mô tả..."
            />
          </div>

          {/* ACTIONS */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-sm font-semibold transition cursor-pointer active:scale-95"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#FCA311] hover:bg-[#e08f07] text-white text-sm font-bold shadow-md transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? "Đang lưu..."
                : mode === "add"
                ? "Thêm nhu cầu"
                : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default GoalFormModal;