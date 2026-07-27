import React, { useState, useEffect } from "react";
import { Plus, Trash2, X, Check, Loader2, Image as ImageIcon } from "lucide-react";
import { getAllCategories } from "../../services/adminCategoryService";
import { getAllBrands } from "../../services/adminBrandService";
import { getAllGoals } from "../../services/adminGoalService";
import { saveProduct } from "../../services/adminProductService";
// import { uploadImageApi } from "../../services/uploadService"; // Uncomment nếu dự án có service upload riêng

// Hàm helper format số tiền thành dạng "150.000.000"
const formatCurrency = (value) => {
  if (value === null || value === undefined || value === "") return "";
  const numbers = String(value).replace(/\D/g, "");
  return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

function ProductFormModal({ isOpen, onClose, editProduct, onSuccess }) {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [goalsList, setGoalsList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form States
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [imageFile, setImageFile] = useState(null); 
  const [imageUrl, setImageUrl] = useState(""); // Lưu URL chuẩn (chuỗi ảnh từ DB hoặc sau khi upload)
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [selectedGoals, setSelectedGoals] = useState([]);

  // Flavors state: Mặc định có 1 dòng trống
  const [flavors, setFlavors] = useState([{ flavorName: "", stock: 0 }]);

  // Fetch danh mục, thương hiệu, goals khi mở Modal
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catData, brandData, goalData] = await Promise.all([
          getAllCategories(),
          getAllBrands(),
          getAllGoals(),
        ]);

        const catList = Array.isArray(catData) ? catData : (catData?.data || []);
        const brandList = Array.isArray(brandData) ? brandData : (brandData?.data || []);
        const goalList = Array.isArray(goalData) ? goalData : (goalData?.data || []);

        setCategories(catList);
        setBrands(brandList);
        setGoalsList(goalList);

        // NẠP DỮ LIỆU KHI CHỈNH SỬA (EDIT)
        if (editProduct) {
          setName(editProduct.Name || editProduct.name || "");
          const rawPrice = editProduct.Price !== undefined ? editProduct.Price : (editProduct.price || 0);
          const exactPrice = Math.trunc(Number(rawPrice)); 
          setPrice(exactPrice ? String(exactPrice) : "");
          
          // Lấy đúng trường ảnh từ sản phẩm cũ (Khắc phục lỗi mất ảnh khi Edit)
          const existingImg = editProduct.Image || editProduct.image || editProduct.ImageUrl || editProduct.imageUrl || "";
          setImageUrl(existingImg);
          setImageFile(null);

          // 1. Brand
          const foundBrand = brandList.find(
            (b) => String(b.BrandID || b.id) === String(editProduct.BrandID) ||
                   (b.Name || b.name) === (editProduct.BrandName || editProduct.brand)
          );
          setBrand(foundBrand ? (foundBrand.Name || foundBrand.name) : (editProduct.BrandName || editProduct.brand || ""));

          // 2. Category & SubCategory
          const foundMainCat = catList.find(
            (c) => String(c.CategoryID || c.id) === String(editProduct.CategoryID) ||
                   (c.Name || c.name) === editProduct.CategoryName
          );
          const foundSubCat = catList.find(
            (c) => String(c.CategoryID || c.id) === String(editProduct.SubCategoryID) ||
                   (c.Name || c.name) === editProduct.SubCategoryName
          );

          setCategory(foundMainCat ? (foundMainCat.Name || foundMainCat.name) : (editProduct.CategoryName || ""));
          setSubCategory(foundSubCat ? (foundSubCat.Name || foundSubCat.name) : (editProduct.SubCategoryName || ""));

          // 3. Chuẩn hóa Goals
          const rawGoals = editProduct.Goals || editProduct.goals || [];
          const goalNames = rawGoals.map((g) => {
            if (typeof g === "object" && g !== null) return g.Name || g.name;
            const found = goalList.find((item) => String(item.GoalID || item.id) === String(g));
            return found ? (found.Name || found.name) : g;
          }).filter(Boolean);
          setSelectedGoals(goalNames);

          // 4. Chuẩn hóa Flavors & Stock
          const rawFlavors = editProduct.Flavors || editProduct.flavors || [];
          if (Array.isArray(rawFlavors) && rawFlavors.length > 0) {
            setFlavors(
              rawFlavors.map((f) => ({
                flavorName: f.FlavorName || f.flavorName || f.name || "",
                stock: f.Stock !== undefined ? f.Stock : (f.stock !== undefined ? f.stock : 0),
              }))
            );
          } else {
            setFlavors([{ flavorName: "Mặc định", stock: editProduct.Stock || editProduct.stock || 0 }]);
          }
        } else {
          // Reset form khi Thêm Mới
          setName("");
          setPrice("");
          setImageFile(null);
          setImageUrl("");
          setBrand("");
          setCategory("");
          setSubCategory("");
          setSelectedGoals([]);
          setFlavors([{ flavorName: "", stock: 0 }]);
        }
      } catch (err) {
        console.error("Lỗi nạp danh mục/thương hiệu:", err);
      }
    };

    if (isOpen) fetchData();
  }, [isOpen, editProduct]);

  // Xử lý khi chọn file ảnh từ máy
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Kiểm tra dung lượng (ví dụ giới hạn ảnh dưới 2MB để tránh làm nặng DB)
      if (file.size > 2 * 1024 * 1024) {
        alert("Kích thước ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB.");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        // reader.result chính là chuỗi Base64 hoàn chỉnh của ảnh
        setImageUrl(reader.result); 
        setImageFile(file); // Lưu lại file nếu cần dùng việc khác
      };
      reader.readAsDataURL(file);
    }
  };

  // Danh mục chính
  const mainCategories = categories.filter((c) => !c.ParentCategoryID || c.ParentCategoryID === 0);

  // Danh mục phụ thuộc theo danh mục chính đang chọn
  const subCategories = categories.filter((c) => {
    if (!category) return false;
    const selectedMain = mainCategories.find((m) => (m.Name || m.name) === category);
    if (!selectedMain) return false;
    return String(c.ParentCategoryID) === String(selectedMain.CategoryID || selectedMain.id);
  });

  // Tính TỔNG TỒN KHO hiển thị realtime ngay trên Modal
  const totalCalculatedStock = flavors.reduce((sum, f) => sum + (Number(f.stock) || 0), 0);

  const handleGoalToggle = (gName) => {
    if (selectedGoals.includes(gName)) {
      setSelectedGoals(selectedGoals.filter((item) => item !== gName));
    } else {
      setSelectedGoals([...selectedGoals, gName]);
    }
  };

  const handleFlavorChange = (index, field, val) => {
    const updated = [...flavors];
    updated[index][field] = val;
    setFlavors(updated);
  };

  const addFlavorRow = () => setFlavors([...flavors, { flavorName: "", stock: 0 }]);

  const removeFlavorRow = (index) => {
    if (flavors.length > 1) {
      setFlavors(flavors.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const selectedBrandObj = brands.find((b) => (b.Name || b.name) === brand);
      const selectedMainCatObj = categories.find((c) => (c.Name || c.name) === category);
      const selectedSubCatObj = categories.find((c) => (c.Name || c.name) === subCategory);

      const mappedGoalIDs = selectedGoals
        .map((gName) => {
          const found = goalsList.find((g) => (g.Name || g.name) === gName);
          return found ? (found.GoalID || found.id) : null;
        })
        .filter(Boolean);

      const currentProductId = editProduct?.ProductID || editProduct?.id;
      const cleanPrice = Number(String(price).replace(/\D/g, "")) || 0;

      // Đóng gói payload gửi lên Backend
      const payload = {
        isEditing: Boolean(editProduct),
        ProductID: currentProductId,
        Name: name,
        Price: cleanPrice,
        Image: imageUrl, // Lúc này `imageUrl` đang chứa chuỗi Base64 dài, lưu thẳng vào DB cột Image (LONGTEXT)
        Status: editProduct?.Status ?? true,
        BrandID: selectedBrandObj ? (selectedBrandObj.BrandID || selectedBrandObj.id) : "",
        CategoryID: selectedMainCatObj ? (selectedMainCatObj.CategoryID || selectedMainCatObj.id) : "",
        SubCategoryID: selectedSubCatObj ? (selectedSubCatObj.CategoryID || selectedSubCatObj.id) : "",
        Stock: totalCalculatedStock,
        Flavors: flavors.map((f) => ({
          FlavorName: f.flavorName,
          Stock: Number(f.stock) || 0,
        })),
        Goals: mappedGoalIDs,
      };

      const result = await saveProduct(payload); 
      console.log("Lưu sản phẩm thành công:", result);

      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error("Lỗi khi lưu sản phẩm:", error);
      alert(error.response?.data?.message || "Không thể lưu sản phẩm. Vui lòng kiểm tra lại!");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="relative bg-white w-full max-w-4xl rounded-xl shadow-xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="font-bold text-xl text-[#14213D]">
              {editProduct ? "Cập Nhật Sản Phẩm" : "Thêm Sản Phẩm Mới"}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Quản lý chi tiết sản phẩm, hương vị và số lượng tồn kho từng loại.
            </p>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-500 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Thông tin sản phẩm */}
          <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
            <h3 className="font-bold text-sm text-[#14213D] uppercase tracking-wider">Thông Tin Sản Phẩm</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">TÊN SẢN PHẨM *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#14213D]/20 bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">THƯƠNG HIỆU *</label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#14213D]/20 bg-white"
                >
                  <option value="">Chọn thương hiệu...</option>
                  {brands.map((b) => (
                    <option key={b.BrandID || b.id} value={b.Name || b.name}>
                      {b.Name || b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">GIÁ BÁN (VNĐ) *</label>
                <input
                  type="text"
                  value={formatCurrency(price)}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/\D/g, "");
                    setPrice(rawValue);
                  }}
                  placeholder="Nhập giá sản phẩm..."
                  required
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm font-semibold text-red-600 focus:outline-none focus:ring-2 focus:ring-[#14213D]/20 bg-white"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-1">HÌNH ẢNH SẢN PHẨM (TỪ MÁY TÍNH)</label>
                <div>
                  <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-2 pb-2">
                      <ImageIcon size={18} className="text-gray-400 mb-1" />
                      <p className="text-xs text-gray-500 font-medium">
                        {imageFile ? imageFile.name : (imageUrl ? "Đã có ảnh trong hệ thống (Click để thay đổi ảnh mới)" : "Click để chọn file ảnh từ máy")}
                      </p>
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Phân loại & Goals */}
          <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
            <h3 className="font-bold text-sm text-[#14213D] uppercase tracking-wider">Phân Loại & Mục Tiêu</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">DANH MỤC CHÍNH *</label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    setSubCategory("");
                  }}
                  required
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm bg-white"
                >
                  <option value="">Chọn danh mục chính...</option>
                  {mainCategories.map((c) => (
                    <option key={c.CategoryID || c.id} value={c.Name || c.name}>
                      {c.Name || c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">DANH MỤC PHỤ *</label>
                <select
                  value={subCategory}
                  onChange={(e) => setSubCategory(e.target.value)}
                  required
                  disabled={!category || subCategories.length === 0}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm bg-white disabled:bg-gray-100"
                >
                  <option value="">Chọn danh mục phụ...</option>
                  {subCategories.map((sub) => (
                    <option key={sub.CategoryID || sub.id} value={sub.Name || sub.name}>
                      {sub.Name || sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-semibold text-gray-700 mb-2">MỤC TIÊU (GOALS)</label>
                <div className="flex flex-wrap gap-2">
                  {goalsList.map((g) => {
                    const gName = g.Name || g.name;
                    const isSelected = selectedGoals.includes(gName);
                    return (
                      <button
                        key={g.GoalID || g.id}
                        type="button"
                        onClick={() => handleGoalToggle(gName)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold"
                            : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {isSelected && <Check size={14} />}
                        <span>{gName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Quản lý Hương Vị & Tồn Kho Từng Loại */}
          <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm text-[#14213D] uppercase tracking-wider">Hương Vị & Tồn Kho</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Tổng tồn kho sản phẩm: <span className="font-bold text-emerald-600">{totalCalculatedStock}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={addFlavorRow}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer"
              >
                <Plus size={14} /> Thêm Hương Vị
              </button>
            </div>

            <div className="space-y-3">
              {flavors.map((flv, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Tên hương vị (VD: Socola, Dâu, Vani...)"
                      value={flv.flavorName}
                      onChange={(e) => handleFlavorChange(idx, "flavorName", e.target.value)}
                      required
                      className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#14213D]/20"
                    />
                  </div>
                  <div className="w-32">
                    <input
                      type="number"
                      placeholder="Số lượng"
                      value={flv.stock}
                      onChange={(e) => handleFlavorChange(idx, "stock", parseInt(e.target.value, 10) || 0)}
                      required
                      min="0"
                      className="w-full h-9 px-3 bg-white border border-gray-200 rounded-lg text-center font-bold text-sm text-[#14213D] focus:outline-none focus:ring-2 focus:ring-[#14213D]/20"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={flavors.length === 1}
                    onClick={() => removeFlavorRow(idx)}
                    className="p-2 text-gray-400 hover:text-red-500 disabled:opacity-30 transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-[#14213D] text-white font-medium text-sm flex items-center gap-2 hover:bg-[#1a2b50] transition-colors cursor-pointer"
            >
              {isSubmitting && <Loader2 size={16} className="animate-spin" />}
              {editProduct ? "Cập Nhật" : "Lưu Sản Phẩm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductFormModal;