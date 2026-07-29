import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const CartContext = createContext(null);

// Hàm lấy token động chuẩn xác
const getToken = () => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("admin_token") ||
    localStorage.getItem("accessToken")
  );
};

const generateCartItemId = (product) => {
  const pId = product.id ?? product.ProductID ?? "unknown";
  const flavor = product.flavor ? String(product.flavor).trim().toLowerCase() : "default";
  const size = product.size ? String(product.size).trim().toLowerCase() : "default";
  return `${pId}_${flavor}_${size}`;
};

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. ĐỌC DỮ LIỆU TỪ DATABASE HOẶC LOCALSTORAGE
  const fetchCart = useCallback(async () => {
    setLoading(true);
    const token = getToken();

    // TH 1: Người dùng ĐÃ ĐĂNG NHẬP -> Ưu tiên lấy từ DB
    if (token) {
      try {
        const res = await axios.get("http://localhost:5000/api/cart", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data && res.data.success) {
          const rawItems = res.data.data?.items || res.data.items || [];
          
          // Format lại dữ liệu từ Database về chuẩn chung của Client
          const dbItems = rawItems.map((item, index) => ({
            id: item.ProductID || item.productId || item.id,
            cartItemId: item.CartItemID || item.cartItemId || item.id || index,
            name: item.ProductName || item.productName || item.name,
            image: item.ProductImage || item.productImage || item.image,
            price: Number(item.Price || item.price || 0),
            quantity: Number(item.Quantity || item.quantity || 1),
            flavor: item.FlavorName || item.flavorName || item.flavor || "",
            size: item.SizeName || item.sizeName || item.size || "",
          }));

          setItems(dbItems);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error("Lỗi lấy giỏ hàng từ Database, chuyển sang dùng LocalStorage:", error);
      }
    }

    // TH 2: Khách CHƯA ĐĂNG NHẬP (hoặc lỗi API) -> Lấy từ LocalStorage
    try {
      const saved = localStorage.getItem("cart");
      setItems(saved ? JSON.parse(saved) : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Hàm đồng bộ giỏ hàng xuống LocalStorage khi chưa đăng nhập
  const saveToLocal = (newItems) => {
    setItems(newItems);
    localStorage.setItem("cart", JSON.stringify(newItems));
  };

  // 2. THÊM SẢN PHẨM VÀO GIỎ
  const addToCart = async (product, quantity = 1) => {
    const token = getToken(); // ✅ Đã sửa: Dùng getToken() thay vì getItem("token")

    if (!token) {
      alert("🔑 Bạn cần đăng nhập để thực hiện thao tác này!");
      return;
    }

    try {
      const payload = {
        productId: product.id || product.ProductID,
        flavorId: product.flavorId || 1,
        flavor: product.flavor || "",
        quantity: Number(quantity),
        price: Number(product.price || product.Price || 0),
      };

      const response = await axios.post("http://localhost:5000/api/cart", payload, {
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });

      if (response.data?.success) {
        // Cập nhật lại giỏ hàng lập tức
        await fetchCart();
      }
    } catch (err) {
      console.error("❌ [LỖI GỌI API CART]:", err.response?.data || err.message);
      throw err;
    }
  };

  // 3. XÓA SẢN PHẨM KHỎI GIỎ HÀNG (CẬP NHẬT TỨC THÌ)
  async function removeFromCart(targetKey) {
    // ⚡ Cập nhật Giao diện ngay lập tức trước khi gọi Server
    setItems((prevItems) =>
      prevItems.filter((item) => {
        const itemKey = item.cartItemId || generateCartItemId(item);
        return String(itemKey) !== String(targetKey) && String(item.id) !== String(targetKey);
      })
    );

    const token = getToken();

    if (token) {
      try {
        await axios.delete(`http://localhost:5000/api/cart/items/${targetKey}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await fetchCart(); // Đồng bộ lại chuẩn xác từ DB
      } catch (err) {
        console.error("Lỗi xóa sản phẩm khỏi Database:", err);
        await fetchCart(); // Khôi phục lại state nếu server báo lỗi
      }
      return; // ✅ Ngăn trôi xuống code LocalStorage
    }

    // Khách chưa đăng nhập
    const newItems = items.filter((item) => {
      const itemKey = item.cartItemId || generateCartItemId(item);
      return String(itemKey) !== String(targetKey) && String(item.id) !== String(targetKey);
    });

    saveToLocal(newItems);
  }

  // 4. CẬP NHẬT SỐ LƯỢNG SẢN PHẨM (CẬP NHẬT TỨC THÌ)
  async function updateQuantity(targetKey, newQuantity) {
    if (newQuantity < 1) {
      removeFromCart(targetKey);
      return;
    }

    // ⚡ Cập nhật Giao diện ngay lập tức trước khi gọi Server
    setItems((prevItems) =>
      prevItems.map((item) => {
        const itemKey = item.cartItemId || generateCartItemId(item);
        if (String(itemKey) === String(targetKey) || String(item.id) === String(targetKey)) {
          return { ...item, quantity: Number(newQuantity) };
        }
        return item;
      })
    );

    const token = getToken();

    if (token) {
      try {
        await axios.put(
          `http://localhost:5000/api/cart/items/${targetKey}`,
          { quantity: Number(newQuantity) },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await fetchCart(); // Đồng bộ chuẩn lại với DB
      } catch (err) {
        console.error("Lỗi cập nhật số lượng trong Database:", err);
        await fetchCart(); // Revert lại nếu có lỗi
      }
      return; // ✅ Ngăn trôi xuống code LocalStorage
    }

    // Khách chưa đăng nhập
    const newItems = items.map((item) => {
      const itemKey = item.cartItemId || generateCartItemId(item);
      if (String(itemKey) === String(targetKey) || String(item.id) === String(targetKey)) {
        return { ...item, quantity: Number(newQuantity) };
      }
      return item;
    });

    saveToLocal(newItems);
  }

  // 5. XÓA SẠCH GIỎ HÀNG
  async function clearCart() {
    setItems([]);
    localStorage.removeItem("cart");

    const token = getToken();

    if (token) {
      try {
        await axios.delete("http://localhost:5000/api/cart/clear", {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Lỗi xóa giỏ hàng Database:", err);
      }
    }
  }

  // Tính tổng số lượng hiển thị Badge trên Header
  const totalCount = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        fetchCart,
        totalCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart phải dùng bên trong CartProvider");
  return context;
}