import { adminProductData } from "../data/adminProductData";

const STORAGE_KEY = "gymbro_admin_products";

export function getAdminProducts() {
  const data = localStorage.getItem(STORAGE_KEY);

  if (data) {
    return JSON.parse(data);
  }

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(adminProductData)
  );

  return adminProductData;
}

export function saveAdminProducts(products) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(products)
  );

  window.dispatchEvent(
    new Event("productsChanged")
  );
}