import { getWebsiteProducts } from "../services/productService";

export function getMaxStockForProduct(productId, flavorName) {
  const products = getWebsiteProducts() || [];
  const product = products.find((item) => String(item?.id) === String(productId));

  if (!product) return 999; // Fallback an toàn nếu không tìm thấy sản phẩm

  // Nếu sản phẩm có quản lý theo kho tổng (stock) mà không có flavors
  if (!product.flavors || product.flavors.length === 0) {
    return Number(product.stock) ?? 999;
  }

  // Parse flavors từ nhiều định dạng dữ liệu khác nhau của Admin
  let flavorsData = product.flavors;
  if (typeof flavorsData === "string") {
    try {
      flavorsData = JSON.parse(flavorsData);
    } catch (e) {
      return Number(product.stock) ?? 999;
    }
  }

  if (Array.isArray(flavorsData)) {
    // Tìm hương vị khớp với lựa chọn của người dùng
    const matchedFlavor = flavorsData.find((f) => {
      if (typeof f === "string") return f === flavorName;
      if (typeof f === "object" && f !== null) {
        const name = f.name || f.flavor || f.flavorName || f.title || f.label || f.value || f.ten;
        return String(name).trim().toLowerCase() === String(flavorName || "").trim().toLowerCase();
      }
      return false;
    });

    if (matchedFlavor) {
      if (typeof matchedFlavor === "object") {
        return Number(matchedFlavor.stock ?? matchedFlavor.quantity ?? matchedFlavor.soLuong ?? 999);
      }
    }
  }

  // Nếu không tìm thấy vị khớp, trả về stock tổng hoặc mặc định
  return Number(product.stock) ?? 999;
}