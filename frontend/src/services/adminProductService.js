import axios from 'axios';
import { logActivity } from "../utils/activityLogger";

const API_URL = 'http://localhost:5000/api';

// Hàm phát sự kiện đồng bộ nếu Frontend cần bắt sự kiện thay đổi dữ liệu realtime trên client
function dispatchProductChange() {
    window.dispatchEvent(new Event("productsChanged"));
}

/**
 * 1. Lấy tất cả sản phẩm (Có chống Cache 304 để luôn lấy dữ liệu mới nhất từ DB)
 */
export const getAllProducts = async () => {
    try {
        // Thêm timestamp ?_t=... và headers để ép Browser/Server trả về dữ liệu mới (Tránh mã 304)
        const response = await axios.get(`${API_URL}/products?_t=${Date.now()}`, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

        if (response.data && response.data.success) {
            return response.data.data || [];
        }
        return [];
    } catch (error) {
        console.error('Lỗi khi lấy danh sách sản phẩm:', error);
        return [];
    }
};

/**
 * Hàm bổ sung tương thích với trang Website bán hàng
 */
export const getWebsiteProducts = async () => {
    return await getAllProducts();
};

/**
 * 2. Lấy chi tiết sản phẩm theo ID
 */
export const getProductById = async (id) => {
    if (!id) return null;
    try {
        const cleanId = encodeURIComponent(String(id).trim());
        const response = await axios.get(`${API_URL}/products/${cleanId}?_t=${Date.now()}`, {
            headers: {
                'Cache-Control': 'no-cache'
            }
        });

        if (response.data && response.data.success) {
            return response.data.data;
        }
        return null;
    } catch (error) {
        console.error(`Lỗi khi lấy sản phẩm ID ${id}:`, error);
        return null;
    }
};

/**
 * 3. Thêm mới hoặc Cập nhật sản phẩm (Save Product)
 */
export const saveProduct = async (productData) => {
    try {
        // Xác định rõ đang Chỉnh sửa (PUT) hay Thêm mới (POST)
        const productId = productData.ProductID || productData.id;
        const isEditing = Boolean(productData.isEditing || productData.oldProductID || productData.editProduct);

        if (isEditing && productId) {
            // ==================== CẬP NHẬT (PUT) ====================
            const cleanId = encodeURIComponent(String(productId).trim());
            const response = await axios.put(`${API_URL}/products/${cleanId}`, productData);

            if (response.data && response.data.success) {
                logActivity("UPDATE_PRODUCT", `"${productData.Name || productData.name}"`);
                dispatchProductChange();
                return response.data;
            }
            throw new Error(response.data?.message || "Cập nhật sản phẩm thất bại!");

        } else {
            // ==================== THÊM MỚI (POST) ====================
            // Tự tạo ProductID nếu người dùng không tự nhập
            const payload = {
                ...productData,
                ProductID: productId || "PRD-" + Date.now()
            };

            const response = await axios.post(`${API_URL}/products`, payload);

            if (response.data && response.data.success) {
                logActivity("ADD_PRODUCT", `Thêm sản phẩm "${payload.Name || payload.name}"`);
                dispatchProductChange();
                return response.data;
            }
            throw new Error(response.data?.message || "Thêm sản phẩm thất bại!");
        }
    } catch (error) {
        console.error('Lỗi khi lưu sản phẩm:', error);
        throw error;
    }
};

/**
 * 4. Xóa sản phẩm theo ProductID
 */
export const deleteProduct = async (id) => {
    if (!id) return false;
    try {
        const cleanId = encodeURIComponent(String(id).trim());

        // Lấy tên sản phẩm trước khi xóa để ghi log
        const productToDelete = await getProductById(cleanId);
        
        const response = await axios.delete(`${API_URL}/products/${cleanId}`);
        
        if (response.data && response.data.success) {
            if (productToDelete) {
                logActivity("DELETE_PRODUCT", `Xóa sản phẩm "${productToDelete.Name || productToDelete.name}"`);
            }
            dispatchProductChange();
            return response.data;
        }
        throw new Error(response.data?.message || "Xóa sản phẩm thất bại!");
    } catch (error) {
        console.error('Lỗi khi xóa sản phẩm:', error);
        throw error;
    }
};

/**
 * 5. Trừ kho sản phẩm (Gợi ý xử lý qua Checkout/Order tại Backend)
 */
export const decreaseProductStock = async (productId, quantityToDeduct, selectedFlavor = null) => {
    try {
        console.warn("Hành động trừ kho nên được xử lý trực tiếp tại Backend qua Transaction tạo đơn hàng (Checkout).");
        return true;
    } catch (error) {
        console.error("Lỗi khi trừ kho:", error);
        return false;
    }
};

/**
 * 6. Bật / Tắt trạng thái sản phẩm
 */
export const toggleProductStatus = async (productId, product) => {
  try {
    const cleanId = encodeURIComponent(String(productId).trim());

    const payload = {
      ...product,
      Status: product.Status !== undefined ? product.Status : product.status,
    };

    const response = await axios.put(`${API_URL}/products/${cleanId}`, payload);

    // Chấp nhận nếu HTTP status = 200/201 hoặc response.data.success = true
    if (response.status === 200 || response.status === 201 || response.data?.success) {
      dispatchProductChange();
      return true;
    }

    return false;
  } catch (error) {
    console.error("Lỗi cập nhật trạng thái:", error);
    return false;
  }
};