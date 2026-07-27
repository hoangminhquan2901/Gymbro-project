import axiosClient from "./axiosClient";
import { logActivity } from "../utils/activityLogger";

// 1. Lấy tất cả danh mục
export async function getAllCategories() {
  try {
    const response = await axiosClient.get("/categories");
    return response.data;
  } catch (error) {
    console.error("Lỗi khi tải danh sách danh mục:", error);
    throw error;
  }
}

// 2. Thêm danh mục mới (Đã sửa truyền đa dạng PascalCase + camelCase)
export async function addCategory(category) {
  try {
    // Xác định tên danh mục nhập từ form
    const categoryName = (category.Name || category.name || "").trim();
    const slugValue =
      category.Slug ||
      category.slug ||
      categoryName.toLowerCase().replace(/\s+/g, "-");

    // Xử lý ParentCategoryID: Nếu không có hoặc là "Gốc" thì gán null, ngược lại chuyển thành số
    const parentVal =
      category.ParentCategoryID ??
      category.parentCategoryId ??
      category.parent;
    
    const parsedParent =
      !parentVal || parentVal === "Gốc" || parentVal === "goc"
        ? null
        : Number(parentVal);

    // Payload linh hoạt truyền cả PascalCase lẫn camelCase
    const payload = {
      // PascalCase cho Backend SQL / Express
      Name: categoryName,
      Slug: slugValue,
      Description: category.Description || category.description || null,
      ParentCategoryID: parsedParent,
      Image: category.Image || category.image || null,

      // camelCase dự phòng
      name: categoryName,
      slug: slugValue,
      description: category.Description || category.description || null,
      parentCategoryId: parsedParent,
      parent: parsedParent,
      image: category.Image || category.image || null,
    };

    const response = await axiosClient.post("/categories", payload);
    const resultData = response.data;

    // Ghi log sau khi lưu API thành công
    logActivity(
      "Tạo danh mục mới",
      `Thêm danh mục "${categoryName}"`,
      "success"
    );

    return resultData;
  } catch (error) {
    console.error("Lỗi khi thêm danh mục:", error);
    throw error;
  }
}

// 3. Cập nhật danh mục
export async function updateCategory(id, newData) {
  try {
    const categoryName = (newData.Name || newData.name || "").trim();
    const parentVal =
      newData.ParentCategoryID ??
      newData.parentCategoryId ??
      newData.parent;

    const parsedParent =
      !parentVal || parentVal === "Gốc" || parentVal === "goc"
        ? null
        : Number(parentVal);

    const payload = {
      Name: categoryName,
      Slug: newData.Slug || newData.slug,
      Description: newData.Description || newData.description || null,
      ParentCategoryID: parsedParent,
      Image: newData.Image || newData.image || null,

      name: categoryName,
      slug: newData.Slug || newData.slug,
      description: newData.Description || newData.description || null,
      parentCategoryId: parsedParent,
      parent: parsedParent,
      image: newData.Image || newData.image || null,
    };

    const response = await axiosClient.put(`/categories/${id}`, payload);
    const updatedCategory = response.data;

    logActivity(
      "Cập nhật danh mục",
      `Cập nhật thông tin danh mục "${categoryName || id}"`,
      "info"
    );

    return updatedCategory;
  } catch (error) {
    console.error("Lỗi khi cập nhật danh mục:", error);
    throw error;
  }
}

// 4. Xóa danh mục
export async function deleteCategory(id, categoryName = "") {
  try {
    await axiosClient.delete(`/categories/${id}`);

    logActivity(
      "Xóa danh mục",
      `Xóa danh mục "${categoryName || id}"`,
      "danger"
    );

    return true;
  } catch (error) {
    console.error("Lỗi khi xóa danh mục:", error);
    throw error;
  }
}

// 5. Lấy danh mục theo Slug
export async function getCategoryBySlug(slug) {
  try {
    const response = await axiosClient.get(`/categories/slug/${slug}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy danh mục slug ${slug}:`, error);
    throw error;
  }
}

// 6. Lấy các danh mục gốc (ParentCategoryID = null)
export async function getRootCategories() {
  try {
    const response = await axiosClient.get("/categories?parent=null");
    return response.data;
  } catch (error) {
    const categories = await getAllCategories();
    return categories.filter(
      (item) =>
        item.ParentCategoryID === null ||
        item.parent === null ||
        item.parent === ""
    );
  }
}

// 7. Lấy các danh mục con theo parent ID/Slug
export async function getChildren(parent) {
  try {
    const response = await axiosClient.get(`/categories?parent=${parent}`);
    return response.data;
  } catch (error) {
    const categories = await getAllCategories();
    return categories.filter(
      (item) =>
        String(item.ParentCategoryID) === String(parent) ||
        String(item.parent) === String(parent)
    );
  }
}