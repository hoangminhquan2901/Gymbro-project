import axios from 'axios';

// Đường dẫn gốc tới API Backend của bạn
const API_URL = 'http://localhost:5000/api';

// Lấy toàn bộ danh sách sản phẩm từ Backend MySQL
export async function getWebsiteProducts() {
    try {
        const response = await axios.get(`${API_URL}/products`);
        // Trả về mảng dữ liệu nằm trong response.data.data
        return response.data.success ? response.data.data : [];
    } catch (error) {
        console.error('Lỗi khi lấy danh sách sản phẩm:', error);
        return [];
    }
}

// Lấy chi tiết 1 sản phẩm theo ProductID
export async function getProductById(id) {
    try {
        const response = await axios.get(`${API_URL}/products/${id}`);
        return response.data.success ? response.data.data : null;
    } catch (error) {
        console.error(`Lỗi khi lấy sản phẩm có ID ${id}:`, error);
        return null;
    }
}

// Lọc sản phẩm theo CategoryID hoặc SubCategoryID
export async function getProductsByCategory(categoryId) {
    try {
        const products = await getWebsiteProducts();
        return products.filter(
            (item) =>
                String(item.CategoryID) === String(categoryId) ||
                String(item.SubCategoryID) === String(categoryId)
        );
    } catch (error) {
        console.error('Lỗi lọc sản phẩm theo danh mục:', error);
        return [];
    }
}

// Lọc sản phẩm theo BrandID
export async function getProductsByBrand(brandId) {
    try {
        const products = await getWebsiteProducts();
        return products.filter(
            (item) => String(item.BrandID) === String(brandId)
        );
    } catch (error) {
        console.error('Lỗi lọc sản phẩm theo thương hiệu:', error);
        return [];
    }
}