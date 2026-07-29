import { getWebsiteProducts } from "../services/productService";

export function getMaxStockForProduct(productId, flavorName) {
  // 🟢 1. BÓC TÁCH MẢNG AN TOÀN (Sửa lỗi products.find is not a function)
  const rawData = getWebsiteProducts();
  let products = [];

  if (Array.isArray(rawData)) {
    products = rawData;
  } else if (rawData && Array.isArray(rawData.data)) {
    products = rawData.data;
  } else if (rawData && Array.isArray(rawData.products)) {
    products = rawData.products;
  }

  // Nếu không lấy được mảng sản phẩm, trả về mặc định để không chặn người dùng
  if (!products || products.length === 0) return 999;

  // 🟢 2. TÌM SẢN PHẨM (Khớp cả id hoặc ProductID)
  const product = products.find(
    (item) => String(item?.id || item?.ProductID) === String(productId)
  );

  if (!product) return 999;

  // Nếu sản phẩm không phân theo hương vị
  if (!product.flavors || product.flavors.length === 0) {
    return Number(product.stock ?? product.Stock ?? 999);
  }

  // 🟢 3. PARSE HƯƠNG VỊ
  let flavorsData = product.flavors;
  if (typeof flavorsData === "string") {
    try {
      flavorsData = JSON.parse(flavorsData);
    } catch (e) {
      return Number(product.stock ?? product.Stock ?? 999);
    }
  }

  if (Array.isArray(flavorsData)) {
    const matchedFlavor = flavorsData.find((f) => {
      if (typeof f === "string") {
        return f.trim().toLowerCase() === String(flavorName || "").trim().toLowerCase();
      }
      if (typeof f === "object" && f !== null) {
        const name = f.name || f.flavor || f.flavorName || f.FlavorName || f.title || f.label || f.value || f.ten;
        return String(name).trim().toLowerCase() === String(flavorName || "").trim().toLowerCase();
      }
      return false;
    });

    if (matchedFlavor && typeof matchedFlavor === "object") {
      return Number(matchedFlavor.stock ?? matchedFlavor.Stock ?? matchedFlavor.quantity ?? 999);
    }
  }

  return Number(product.stock ?? product.Stock ?? 999);
}