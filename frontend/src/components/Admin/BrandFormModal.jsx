import React, { useEffect, useState } from "react";
import { X, UploadCloud, Loader2 } from "lucide-react";

import {
  addBrand,
  updateBrand,
} from "../../services/adminBrandService";

import Swal from 'sweetalert2';

function BrandFormModal({
  open,
  mode = "add",
  brand,
  onClose,
  onSuccess, // Thêm prop này để load lại danh sách sau khi thêm/sửa thành công (nếu cần)
}) {
  const [form, setForm] = useState({
    name: "",
    country: "",
    description: "",
    image: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset/Fill form khi modal mở hoặc thay đổi mode
  useEffect(() => {
    if (open) {
      setErrors({});
      if (mode === "edit" && brand) {
        setForm({
          name: brand.name || brand.Name || "",
          country: brand.country || brand.Country || "",
          description: brand.description || brand.Description || "",
          image: brand.image || brand.Image || "",
        });
      } else {
        setForm({
          name: "",
          country: "",
          description: "",
          image: "",
        });
      }
    }
  }, [mode, brand, open]);

  // Lắng nghe sự kiện phím ESC để đóng Modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, isSubmitting, onClose]);

  if (!open) return null;

  // Xử lý chọn ảnh từ máy tính
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        image: "Kích thước ảnh không được vượt quá 2MB để tối ưu lưu trữ",
      }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, image: reader.result }));
      setErrors((prev) => ({ ...prev, image: null }));
    };
    reader.readAsDataURL(file);
  };

  // 1, 2, 3. Validate thông tin trống trước khi submit
  const validateForm = () => {
    const newErrors = {};
    
    // Kiểm tra tên thương hiệu
    if (!form.name || !form.name.trim()) {
      newErrors.name = "Vui lòng nhập tên thương hiệu";
    }
    
    // Kiểm tra quốc gia
    if (!form.country || !form.country.trim()) {
      newErrors.country = "Vui lòng nhập tên quốc gia";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
        const response =
            mode === "add"
                ? await addBrand(form)
                : await updateBrand(brand.BrandID || brand.id, form);

        const resData = response?.data ?? response;

        if (resData.success === false) {
            throw new Error(resData.message);
        }

        Swal.fire({
            icon: "success",
            title: "Thành công!",
            text:
                mode === "add"
                    ? "Thêm thương hiệu mới thành công."
                    : "Cập nhật thương hiệu thành công.",
            confirmButtonColor: "#FCA311",
            timer: 2000,
            showConfirmButton: false,
        });

        onSuccess?.();
        onClose();

    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "Thất bại!",
            text:
                error.response?.data?.message ??
                error.message ??
                "Có lỗi xảy ra, vui lòng thử lại.",
            confirmButtonColor: "#14213D",
        });
    } finally {
        setIsSubmitting(false);
    }
};

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex justify-center items-center z-50 p-4 transition-opacity animate-in fade-in duration-200"
      onClick={!isSubmitting ? onClose : undefined}
    >
      {/* Modal Container */}
      <div
        className="bg-white rounded-2xl shadow-2xl w-[600px] max-w-full overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-[#14213D]">
              {mode === "add" ? "Thêm thương hiệu mới" : "Chỉnh sửa thương hiệu"}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {mode === "add"
                ? "Thêm đối tác cung cấp mới vào hệ thống GymBro"
                : "Cập nhật lại thông tin thương hiệu hiện tại"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto space-y-5">
          {/* Vùng Upload Logo Drop-Zone */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Logo thương hiệu
            </label>

            {form.image ? (
              <div className="relative border border-gray-200 rounded-xl h-44 flex justify-center items-center bg-gray-50/80 p-3 group overflow-hidden">
                <img
                  src={form.image}
                  alt="Logo preview"
                  className="max-h-full max-w-full object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
                />

                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, image: "" }))}
                  className="absolute top-3 right-3 bg-rose-500 hover:bg-rose-600 text-white p-2 rounded-xl transition shadow-md cursor-pointer active:scale-95"
                  title="Gỡ ảnh này"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-gray-200 hover:border-[#FCA311] bg-gray-50/50 hover:bg-amber-50/10 rounded-xl h-44 flex flex-col justify-center items-center cursor-pointer transition-all duration-200 group">
                <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-gray-100 flex items-center justify-center text-gray-400 group-hover:text-[#FCA311] group-hover:scale-110 transition duration-200">
                  <UploadCloud size={24} />
                </div>

                <span className="text-sm font-medium text-gray-700 mt-3 group-hover:text-[#FCA311] transition">
                  Nhấp để tải lên logo
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  Định dạng hỗ trợ: PNG, JPG, WEBP (Tối đa 5MB)
                </span>

                <input
                  hidden
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            )}
            {errors.image && (
              <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.image}</p>
            )}
          </div>

          {/* Tên thương hiệu */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Tên thương hiệu <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, name: e.target.value }));
                if (errors.name) setErrors((prev) => ({ ...prev, name: null }));
              }}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition duration-150 ${
                errors.name
                  ? "border-rose-500 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20"
                  : "border-gray-200 focus:border-[#FCA311] focus:ring-2 focus:ring-[#FCA311]/20 bg-white"
              }`}
              placeholder="Nhập tên thương hiệu..."
            />
            {errors.name && (
              <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.name}</p>
            )}
          </div>

          {/* Quốc gia */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Quốc gia <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={form.country}
              onChange={(e) => {
                setForm((prev) => ({ ...prev, country: e.target.value }));
                if (errors.country) setErrors((prev) => ({ ...prev, country: null }));
              }}
              className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition duration-150 ${
                errors.country
                  ? "border-rose-500 bg-rose-50/20 focus:ring-2 focus:ring-rose-500/20"
                  : "border-gray-200 focus:border-[#FCA311] focus:ring-2 focus:ring-[#FCA311]/20 bg-white"
              }`}
              placeholder="Nhập quốc gia..."
            />
            {errors.country && (
              <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.country}</p>
            )}
          </div>

          {/* Mô tả thương hiệu */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Mô tả ngắn
            </label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none resize-none focus:border-[#FCA311] focus:ring-2 focus:ring-[#FCA311]/20 bg-white transition duration-150"
              placeholder="Nhập mô tả..."
            />
          </div>

          {/* BUTTON ACTIONS */}
          <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-gray-300 font-medium text-gray-700 hover:bg-gray-50 active:bg-gray-100 text-sm transition cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-[#FCA311] hover:bg-[#e28e00] active:scale-95 text-white font-medium text-sm shadow-xs transition duration-150 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Đang xử lý...</span>
                </>
              ) : mode === "add" ? (
                "Thêm thương hiệu"
              ) : (
                "Lưu thay đổi"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BrandFormModal;