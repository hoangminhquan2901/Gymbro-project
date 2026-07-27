/**
 * Chuyển đổi chuỗi tiếng Việt thành slug URL an toàn
 * @param {string} text
 * @returns {string}
 */
export function slugify(text) {
  if (!text) return "";

  return text
    .toString()
    .trim()                           // 1. Trim khoảng trắng thừa ở đầu/cuối TRƯỚC
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")  // Xóa dấu tiếng Việt
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .replace(/[^0-9a-z\s-]/g, "")     // Xóa ký tự đặc biệt (giữ lại số, chữ, space, dấu -)
    .replace(/\s+/g, "-")             // Thay khoảng trắng bằng dấu -
    .replace(/-+/g, "-")              // Gom nhiều dấu - liên tiếp thành 1
    .replace(/^-+|-+$/g, "");         // 2. Xóa dấu - bị dư ở đầu hoặc cuối chuỗi
}