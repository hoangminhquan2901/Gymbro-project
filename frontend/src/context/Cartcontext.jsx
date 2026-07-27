import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const CartContext = createContext(null);

const generateCartItemId = (product) => {
  const pId = product.id ?? product.ProductID ?? "unknown";
  const flavor = product.flavor ? String(product.flavor).trim().toLowerCase() : "default";
  const size = product.size ? String(product.size).trim().toLowerCase() : "default";
  return `${pId}_${flavor}_${size}`;
};

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy token xác thực người dùng từ LocalStorage (chỉnh lại key token nếu cần)
  const token = localStorage.getItem("token") || localStorage.getItem("accessToken");

  // 1. ĐỌC DỮ LIỆU TỪ DATABASE HOẶC LOCALSTORAGE
  const fetchCart = useCallback(async () => {
    setLoading(true);

    // TH 1: Người dùng ĐÃ ĐĂNG NHẬP -> Ưu tiên lấy từ DB
    if (token) {
      try {
        const res = await axios.get("http://localhost:5000/api/cart", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data && res.data.success) {
          // Format lại dữ liệu từ Database về chuẩn chung của Client
          const dbItems = (res.data.data?.items || res.data.items || []).map((item) => ({
            id: item.ProductID || item.id,
            cartItemId: item.CartItemID || item.cartItemId || item.id, // Đảm bảo lấy chuẩn CartItemID từ MySQL
            name: item.ProductName || item.name,
            image: item.ProductImage || item.image,
            price: item.Price || item.price,
            quantity: item.Quantity || item.quantity || 1,
            flavor: item.FlavorName || item.flavor || "",
            size: item.SizeName || item.size || "",
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
  }, [token]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Hàm đồng bộ giỏ hàng xuống LocalStorage khi chưa đăng nhập
  const saveToLocal = (newItems) => {
    setItems(newItems);
    localStorage.setItem("cart", JSON.stringify(newItems));
  };

  // 2. THÊM SẢN PHẨM VÀO GIỎ
  async function addToCart(product, quantity = 1) {
    const cartItemId = product.cartItemId || generateCartItemId(product);

    if (token) {
      try {
        await axios.post(
            "http://localhost:5000/api/cart/add",
            {
                productId: product.ProductID || product.id,
                flavorId: product.FlavorID || product.flavorId,
                quantity,
                price: product.Price || product.price
            },
            {
                headers:{
                    Authorization:`Bearer ${token}`
                }
            }
        );
        // Tải lại giỏ hàng từ DB sau khi thêm thành công
        await fetchCart();
        return;
      } catch (err) {
        console.error("Lỗi thêm vào giỏ hàng Database:", err);
      }
    }

    // Nếu chưa đăng nhập: Lưu vào LocalStorage
    const existingIndex = items.findIndex((item) => {
      const itemKey = item.cartItemId || generateCartItemId(item);
      return itemKey === cartItemId;
    });

    let newItems;
    if (existingIndex > -1) {
      newItems = items.map((item, index) =>
        index === existingIndex
          ? { ...item, cartItemId, quantity: item.quantity + quantity }
          : item
      );
    } else {
      newItems = [...items, { ...product, cartItemId, quantity }];
    }

    saveToLocal(newItems);
  }

  // 3. XÓA SẢN PHẨM
  async function removeFromCart(targetKey) {
    if (token) {
      try {
        await axios.delete(`http://localhost:5000/api/cart/items/${targetKey}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        await fetchCart();
        return;
      } catch (err) {
        console.error("Lỗi xóa sản phẩm khỏi Database:", err);
      }
    }

    // Nếu chưa đăng nhập
    const newItems = items.filter((item) => {
      const itemKey = item.cartItemId || generateCartItemId(item);
      return itemKey !== targetKey && String(item.id) !== String(targetKey);
    });

    saveToLocal(newItems);
  }

  // 4. CẬP NHẬT SỐ LƯỢNG
  async function updateQuantity(targetKey, newQuantity) {
    if (newQuantity < 1) {
      removeFromCart(targetKey);
      return;
    }

    if (token) {
      try {
        await axios.put(
          `http://localhost:5000/api/cart/items/${targetKey}`,
          { quantity: newQuantity },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        await fetchCart();
        return;
      } catch (err) {
        console.error("Lỗi cập nhật số lượng trong Database:", err);
      }
    }

    // Nếu chưa đăng nhập
    const newItems = items.map((item) => {
      const itemKey = item.cartItemId || generateCartItemId(item);
      if (itemKey === targetKey || String(item.id) === String(targetKey)) {
        return { ...item, quantity: newQuantity };
      }
      return item;
    });

    saveToLocal(newItems);
  }

  // 5. XÓA SẠCH GIỎ HÀNG
  async function clearCart() {
    if (token) {
      try {
        await axios.delete("http://localhost:5000/api/cart/clear", {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.error("Lỗi xóa giỏ hàng Database:", err);
      }
    }

    setItems([]);
    localStorage.removeItem("cart");
  }

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