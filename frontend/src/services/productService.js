import axios from 'axios';

// Đường dẫn gốc tới API Backend của bạn
const API_URL = 'http://localhost:5000/api';

// Lấy danh sách sản phẩm phân trang Cursor-Based cho khách hàng (hỗ trợ cuộn vô tận / xem thêm)
export async function getCustomerProductsCursor(cursor = null, limit = 12, category = null) {
    try {
        let url = `${API_URL}/products/customer-products?limit=${limit}`;
        
        // Truyền thêm category lên backend nếu có
        if (category && category !== 'thuc-pham-bo-sung') {
            url += `&category=${encodeURIComponent(category)}`;
        }
        
        // Hỗ trợ truyền lastId linh hoạt (dù cursor là chuỗi ID hay object chứa lastId)
        if (cursor) {
            let lastId = null;
            if (typeof cursor === 'object' && cursor !== null) {
                lastId = cursor.lastId || cursor.lastProductId;
            } else {
                lastId = cursor;
            }
            
            if (lastId) {
                url += `&lastId=${encodeURIComponent(lastId)}`;
            }
        }

        const response = await axios.get(url);
        if (response.data && response.data.success) {
            return {
                data: response.data.data || [],
                pagination: response.data.pagination || { hasMore: false, nextCursor: null }
            };
        }
        return { data: [], pagination: { hasMore: false, nextCursor: null } };
    } catch (error) {
        console.error('Lỗi khi lấy danh sách sản phẩm cursor:', error);
        return { data: [], pagination: { hasMore: false, nextCursor: null } };
    }
}

// Tương thích ngược: Lấy toàn bộ danh sách sản phẩm (cho các trang cũ đang gọi hàm này)
export async function getWebsiteProducts() {
    try {
        let allProducts = [];
        let cursor = null;
        let hasMore = true;

        // Lặp để lấy toàn bộ sản phẩm qua cơ chế cursor pagination
        while (hasMore) {
            const result = await getCustomerProductsCursor(cursor, 50);
            if (result.data && result.data.length > 0) {
                allProducts.push(...result.data);
            }
            
            hasMore = result.pagination?.hasMore || false;
            cursor = result.pagination?.nextCursor || null;

            // Phòng hặp toán tử lặp vô tận nếu API trả về trùng cursor
            if (!cursor || result.data.length === 0) {
                break;
            }
        }

        return allProducts;
    } catch (error) {
        console.error('Lỗi khi lấy toàn bộ danh sách sản phẩm:', error);
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