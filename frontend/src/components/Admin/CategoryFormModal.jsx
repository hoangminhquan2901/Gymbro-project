import React, { useEffect, useState } from "react";
import { X, ImagePlus, UploadCloud, FolderTree, Loader2 } from "lucide-react";

import {
  addCategory,
  updateCategory,
} from "../../services/adminCategoryService";

import { slugify } from "../../utils/slugify";

function CategoryFormModal({
  open,
  mode = "add",
  category,
  categories = [],
  onClose,
  onSuccess,
}) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    parentCategoryId: null,
    image: "",
  });

  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 🔄 Synchronize state when modal opens or mode/category changes
  useEffect(() => {
    if (open) {
      if (mode === "edit" && category) {
        const rawParentId =
          category.ParentCategoryID ??
          category.parentCategoryId ??
          category.ParentID ??
          null;

        // Chuẩn hóa parentCategoryId về dạng Number hoặc null
        const parsedParentId =
          rawParentId !== null &&
          rawParentId !== undefined &&
          rawParentId !== "" &&
          rawParentId !== 0 &&
          rawParentId !== "0"
            ? Number(rawParentId)
            : null;

        setForm({
          name: category.Name || category.name || "",
          description: category.Description || category.description || "",
          parentCategoryId: parsedParentId,
          image: category.Image || category.image || "",
        });
      } else {
        setForm({
          name: "",
          description: "",
          parentCategoryId: null,
          image: "",
        });
      }
    }
  }, [mode, category, open]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && open && !submitting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose, submitting]);

  if (!open) return null;

  // Process uploaded image file
  const processImageFile = (file) => {
    if (!file || !file.type.startsWith("image/")) {
      alert("Vui lòng chọn một tệp hình ảnh hợp lệ!");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        image: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) processImageFile(file);
  };

  // Drag & Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processImageFile(file);
  };

  // 🔥 XỬ LÝ SUBMIT CHUẨN HÓA FIELD THEO BACKEND
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Vui lòng nhập tên danh mục");
      return;
    }

    // Ép kiểu ParentCategoryID chính xác: Chuỗi rỗng/null/0 => null, ngược lại => Number
    const finalParentId =
      form.parentCategoryId !== null &&
      form.parentCategoryId !== "" &&
      form.parentCategoryId !== 0 &&
      form.parentCategoryId !== "0"
        ? Number(form.parentCategoryId)
        : null;

    const submitData = {
      Name: form.name.trim(),
      name: form.name.trim(),
      Slug: slugify(form.name.trim()),
      slug: slugify(form.name.trim()),
      Description: form.description.trim(),
      description: form.description.trim(),
      ParentCategoryID: finalParentId,
      parentCategoryId: finalParentId,
      Image: form.image || null,
      image: form.image || null,
    };

    setSubmitting(true);

    try {
      const currentId = category?.CategoryID || category?.id;
      if (mode === "add") {
        await addCategory(submitData);
      } else if (currentId) {
        await updateCategory(currentId, submitData);
      }

      if (onSuccess) {
        await onSuccess();
      }

      onClose();
    } catch (error) {
      console.error("Lỗi chi tiết từ API:", error.response?.data || error);

      const serverMsg =
        error.response?.data?.message ||
        "Có lỗi xảy ra trong quá trình lưu. Vui lòng thử lại!";

      alert(serverMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // 🎯 LỌC DANH MỤC CHA KHẢ THI (Tránh trường hợp chọn chính nó làm cha của nó)
  const validParentCategories = (
    Array.isArray(categories) ? categories : []
  ).filter((c) => {
    if (!c) return false;

    const cId = c.CategoryID || c.id;
    const currentCatId = category?.CategoryID || category?.id;

    // Khi edit: Không cho chọn chính nó làm danh mục cha
    if (mode === "edit" && currentCatId) {
      if (Number(cId) === Number(currentCatId)) return false;
    }

    // Chỉ cho phép chọn các DANH MỤC GỐC làm danh mục cha (để duy trì cây phân cấp 2 cấp chuẩn)
    const parentVal = c.ParentCategoryID ?? c.parentCategoryId ?? c.parent;
    const isRoot =
      parentVal === null ||
      parentVal === undefined ||
      parentVal === "" ||
      parentVal === 0 ||
      parentVal === "0" ||
      parentVal === "Gốc" ||
      parentVal === "goc";

    return isRoot;
  });

  return (
    <div className="fixed inset-0 bg-[#14213D]/40 backdrop-blur-xs flex justify-center items-center z-50 p-4 transition-all">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-[#FCA311]">
              <FolderTree size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[#14213D]">
                {mode === "add" ? "Thêm danh mục mới" : "Chỉnh sửa danh mục"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer disabled:opacity-50"
            title="Đóng cửa sổ"
          >
            <X size={20} />
          </button>
        </div>

        {/* FORM BODY */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar"
        >
          {/* 1. Upload Logo */}
          <div>
            <label className="block text-xs font-bold tracking-wider text-gray-700 mb-2">
              Logo danh mục
            </label>

            {form.image ? (
              <div className="relative border-2 border-slate-200 rounded-2xl h-44 flex justify-center items-center bg-gray-50 overflow-hidden group">
                <img
                  src={form.image}
                  alt="Category preview"
                  className="h-full w-full object-contain p-2"
                />
                <div className="absolute inset-0 bg-[#14213D]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => setForm({ ...form, image: "" })}
                    className="bg-rose-500 hover:bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-semibold transition shadow-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <X size={16} /> Gỡ ảnh này
                  </button>
                </div>
              </div>
            ) : (
              <label
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl h-44 flex flex-col justify-center items-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-[#FCA311] bg-amber-50/50 scale-[0.99]"
                    : "border-gray-200 hover:border-[#FCA311] hover:bg-amber-50/20"
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-[#FCA311] mb-2">
                  {isDragging ? (
                    <UploadCloud size={26} className="animate-bounce" />
                  ) : (
                    <ImagePlus size={26} />
                  )}
                </div>
                <span className="text-sm font-semibold text-[#14213D]">
                  Kéo thả ảnh vào đây hoặc{" "}
                  <span className="text-[#FCA311]">duyệt file</span>
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  Hỗ trợ định dạng PNG, JPG, WEBP (Tối đa 5MB)
                </span>
                <input
                  hidden
                  type="file"
                  accept="image/*"
                  disabled={submitting}
                  onChange={handleImageChange}
                />
              </label>
            )}
          </div>

          {/* 2. Tên Danh Mục */}
          <div>
            <label className="block text-xs font-bold tracking-wider text-gray-700 mb-2">
              Tên danh mục <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              disabled={submitting}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-[#FCA311] focus:ring-2 focus:ring-[#FCA311]/20 transition disabled:opacity-50"
              placeholder="Nhập tên danh mục..."
            />
            {form.name.trim() && (
              <p className="text-[11px] text-gray-400 mt-1">
                Slug tự động:{" "}
                <span className="font-mono text-gray-600">
                  /{slugify(form.name)}
                </span>
              </p>
            )}
          </div>

          {/* 3. Dropdown Chọn Danh Mục Cha */}
          <div>
            <label className="block text-xs font-bold tracking-wider text-gray-700 mb-2">
              Danh mục cha (Phân cấp)
            </label>
            <select
              disabled={submitting}
              value={
                form.parentCategoryId !== null &&
                form.parentCategoryId !== undefined
                  ? String(form.parentCategoryId)
                  : ""
              }
              onChange={(e) =>
                setForm({
                  ...form,
                  parentCategoryId: e.target.value
                    ? Number(e.target.value)
                    : null,
                })
              }
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:bg-white focus:border-[#FCA311] focus:ring-2 focus:ring-[#FCA311]/20 transition cursor-pointer disabled:opacity-50 font-medium text-[#14213D]"
            >
              {/* Option gốc để chuyển danh mục con thành danh mục gốc */}
              <option value="" className="font-bold text-[#14213D]">
                -- Danh mục gốc (Không có danh mục cha) --
              </option>

              {validParentCategories.map((c) => {
                const catId = c.CategoryID || c.id;
                const catName = c.Name || c.name;
                return (
                  <option key={catId} value={catId}>
                    └─ {catName}
                  </option>
                );
              })}
            </select>
          </div>

          {/* 4. Mô tả */}
          <div>
            <label className="block text-xs font-bold tracking-wider text-gray-700 mb-2">
              Mô tả chi tiết
            </label>
            <textarea
              rows={3}
              disabled={submitting}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm outline-none resize-none focus:bg-white focus:border-[#FCA311] focus:ring-2 focus:ring-[#FCA311]/20 transition disabled:opacity-50"
              placeholder="Nhập mô tả..."
            />
          </div>

          {/* BUTTON ACTIONS */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 active:scale-95 transition cursor-pointer disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-[#FCA311] hover:bg-[#e08f07] text-white font-bold text-sm shadow-md shadow-amber-500/15 active:scale-95 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {submitting
                ? "Đang xử lý..."
                : mode === "add"
                ? "Thêm danh mục"
                : "Lưu thay đổi"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CategoryFormModal;