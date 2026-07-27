import axios from 'axios';
import { logActivity } from "../utils/activityLogger";

const API_URL = 'http://localhost:5000/api/brands';

// Hàm phụ thông báo thay đổi để UI tự render lại nếu cần
function dispatchChange() {
  window.dispatchEvent(new Event("brandsChanged"));
}

// 1. Lấy toàn bộ danh sách thương hiệu từ MySQL API (Chuẩn hóa BrandID -> id)
export async function getAllBrands() {
  try {
    const response = await axios.get(API_URL);
    if (response.data && response.data.success) {
      return response.data.data.map(brand => ({
        ...brand,
        id: brand.BrandID || brand.id,
        name: brand.name || brand.Name || "Chưa có tên",
        slug: brand.slug || brand.Slug || "",
        description: brand.description || brand.Description || "",
        country: brand.country || brand.Country || "Chưa xác định",
        // Ép buộc ánh xạ cả trường chữ hoa lẫn chữ thường để UI nhận diện được ảnh
        image: brand.image || brand.Image || "", 
        status: brand.status !== undefined ? brand.status : (brand.Status !== undefined ? brand.Status : "active"),
        updatedAt: brand.updatedAt || brand.UpdatedAt || brand.CreatedAt || null
      }));
    }
    return [];
  } catch (error) {
    console.error("Lỗi lấy danh sách thương hiệu:", error);
    return [];
  }
}

// 2. Thêm thương hiệu mới vào MySQL qua API
export async function addBrand(brand) {
    const payload = {
        name: brand.name,
        slug: brand.slug || brand.name.toLowerCase().trim().replace(/\s+/g, "-"),
        country: brand.country || "Việt Nam",
        description: brand.description || "",
        image: brand.image || "",
        status: brand.status || "active"
    };

    const response = await axios.post(API_URL, payload);

    if (response.data.success) {
        dispatchChange();
        logActivity("ADD_BRAND", `Thêm thương hiệu "${payload.name}"`);
    }

    return response;
}

// 3. Cập nhật thông tin thương hiệu qua API
export async function updateBrand(id, newData) {
  const brandName =
    newData.name || newData.Name || "";

  const brandSlug =
    newData.slug ||
    newData.Slug ||
    brandName.toLowerCase().trim().replace(/\s+/g, "-");

  const brandCountry =
    newData.country || newData.Country || "Việt Nam";

  const brandDesc =
    newData.description || newData.Description || "";

  const brandImage =
    newData.image || newData.Image || "";

  let brandStatus =
    newData.status !== undefined
      ? newData.status
      : newData.Status !== undefined
      ? newData.Status
      : "active";

  if (brandStatus === "inactive") {
    brandStatus = "hidden";
  }

  const payload = {
    name: brandName,
    slug: brandSlug,
    country: brandCountry,
    description: brandDesc,
    image: brandImage,
    productCount:
      newData.productCount !== undefined
        ? newData.productCount
        : newData.ProductCount || 0,
    status: brandStatus,
  };

  try {
    const response = await axios.put(`${API_URL}/${id}`, payload);

    if (response.data.success) {
      dispatchChange();
      logActivity(
        "UPDATE_BRAND",
        `Cập nhật thương hiệu "${brandName}"`
      );
    }

    return response;
  } catch (error) {
    console.error("Lỗi khi cập nhật thương hiệu:", error);
    throw error;
  }
}

// 3.1. Thêm hàm riêng để đổi nhanh trạng thái ẩn/hiện (Toggle Status)
export async function toggleBrandStatus(id, currentStatus, brandName = "") {
  try {
    // Đảo ngược trạng thái: nếu đang active thì chuyển thành hidden, ngược lại thì active
    const newStatus = currentStatus === "active" ? "hidden" : "active";

    const response = await axios.patch(`${API_URL}/${id}/status`, { status: newStatus })
      .catch(() => axios.put(`${API_URL}/${id}`, { status: newStatus })); // Fallback nếu API dùng PUT

    if (response.data && response.data.success) {
      dispatchChange();
      logActivity("UPDATE_BRAND_STATUS", `Chuyển trạng thái thương hiệu "${brandName || id}" thành ${newStatus}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Lỗi khi đổi trạng thái thương hiệu:", error);
    return false;
  }
}

// 4. Xóa thương hiệu qua API
export async function deleteBrand(id, brandName = "") {
  try {
    const response = await axios.delete(`${API_URL}/${id}`);

    if (response.data && response.data.success) {
      dispatchChange();
      logActivity("DELETE_BRAND", `Xóa thương hiệu "${brandName || id}"`);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Lỗi khi xóa thương hiệu:", error);
    return false;
  }
}