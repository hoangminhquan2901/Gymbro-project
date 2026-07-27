// src/services/categoryService.js
import { getAllCategories, getCategoryBySlug as getAdminCategoryBySlug } from "./adminCategoryService";
import axiosClient from "./axiosClient";

export async function getWebsiteCategories() {
  return await getAllCategories();
}

export async function getCategoryById(id) {
  try {
    const response = await axiosClient.get(`/categories/${id}`);
    return response.data;
  } catch (error) {
    console.error(`Lỗi khi lấy danh mục ID ${id}:`, error);
    return null;
  }
}

export async function getCategoryBySlug(slug) {
  return await getAdminCategoryBySlug(slug);
}