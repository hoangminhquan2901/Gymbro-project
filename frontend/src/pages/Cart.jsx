import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Breadcrumb from "../components/Breadcrumb";
import { useAuth } from "../context/AuthContext";
import { getMaxStockForProduct } from "../utils/stockHelper";

const TIME_SLOTS = [
  { label: "Chọn thời gian", value: "" },
  { label: "Giao giờ hành chính", value: "hanh-chinh" },
  { label: "08h00 - 12h00", value: "08-12" },
  { label: "14h00 - 18h00", value: "14-18" },
  { label: "19h00 - 21h00", value: "19-21" },
];

function parsePrice(priceStr) {
  if (priceStr === undefined || priceStr === null || priceStr === "") return 0;
  if (typeof priceStr === "number") return priceStr;
  const cleaned = String(priceStr).replace(/\D/g, "");
  return parseInt(cleaned, 10) || 0;
}

function formatPrice(num) {
  const val = parsePrice(num);
  return val.toLocaleString("vi-VN") + "đ";
}

function todayString() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${yyyy}-${mm}-${dd}`;
}

export default function Cart() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State quản lý giỏ hàng
  const [cartItems, setCartItems] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);

  // State hẹn giờ & ghi chú
  const [note, setNote] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(todayString());
  const [deliveryTime, setDeliveryTime] = useState("");

  // Lấy token xác thực của người dùng
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    user?.token;

  // ==========================================
  // 1. TẢI GIỎ HÀNG TRỰC TIẾP TỪ API DATABASE
  // ==========================================
  const fetchCartData = async () => {
    setLoading(true);

    if (!token) {
      // Nếu chưa đăng nhập, chuyển hướng hoặc để trống giỏ hàng DB
      setCartItems([]);
      setTotalAmount(0);
      setLoading(false);
      return;
    }

    try {
      const res = await axios.get("http://localhost:5000/api/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data && res.data.success) {
        const rawItems = res.data.data?.items || res.data.items || [];
        
        // Chuẩn hóa dữ liệu trả về từ Database MySQL
        const normalizedApiItems = rawItems.map((item, index) => {
          const pId = item.ProductID || item.productId || item.id || index;
          const fName = item.FlavorName || item.flavorName || item.flavor || item.selectedFlavor || "";
          return {
            CartItemID: item.CartItemID || item.cartItemId || item.id, // Khóa chính từ bảng CartItems trong DB
            ProductID: pId,
            ProductName: item.ProductName || item.productName || item.name || "Sản phẩm",
            ProductImage: item.ProductImage || item.productImage || item.image || item.img,
            FlavorName: fName,
            Price: parsePrice(item.Price || item.price),
            Quantity: item.Quantity || item.quantity || 1,
          };
        });

        const total = res.data.data?.totalAmount ?? res.data.totalAmount ?? 0;

        setCartItems(normalizedApiItems);
        setTotalAmount(total);
      }
    } catch (error) {
      console.error("Lỗi khi tải giỏ hàng từ Database API:", error);
      setCartItems([]);
      setTotalAmount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCartData();
  }, [token]);

  // ==========================================
  // 2. CẬP NHẬT SỐ LƯỢNG MÓN HÀNG QUA API
  // ==========================================
  const handleUpdateQuantity = async (cartItemId, newQuantity, item) => {
    if (newQuantity <= 0) {
      handleRemoveItem(cartItemId);
      return;
    }

    const maxStock = getMaxStockForProduct ? getMaxStockForProduct(item.ProductID, item.FlavorName) : 999;
    if (maxStock && newQuantity > maxStock) {
      alert(`Số lượng bạn chọn đã đạt mức tối đa trong kho (${maxStock} sản phẩm)!`);
      return;
    }

    // Cập nhật giao diện tạm thời (Optimistic Update) cho mượt mà
    const updated = cartItems.map((i) =>
      i.CartItemID === cartItemId ? { ...i, Quantity: newQuantity } : i
    );
    setCartItems(updated);
    setTotalAmount(updated.reduce((sum, i) => sum + i.Price * i.Quantity, 0));

    if (!token) return;

    try {
      // Gửi request PUT cập nhật số lượng xuống Database
      await axios.put(
        `http://localhost:5000/api/cart/items/${cartItemId}`,
        { quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Gọi lại API fetch để đồng bộ chính xác tổng tiền từ server tính toán
      fetchCartData();
    } catch (error) {
      console.error("Lỗi cập nhật số lượng lên Database:", error);
      fetchCartData(); // Revert lại dữ liệu cũ nếu lỗi xảy ra
    }
  };

  // ==========================================
  // 3. XÓA MÓN HÀNG KHỎI GIỎ HÀNG (DATABASE)
  // ==========================================
  const handleRemoveItem = async (cartItemId) => {
    if (!token) return;

    try {
      const res = await axios.delete(
        `http://localhost:5000/api/cart/items/${cartItemId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data && res.data.success) {
        fetchCartData(); // Tải lại giỏ hàng từ DB sau khi xóa thành công
      }
    } catch (error) {
      console.error("Lỗi khi xóa sản phẩm qua API:", error);
    }
  };

  // ==========================================
  // 4. CHUYỂN SANG TRANG THANH TOÁN
  // ==========================================
  const handleGoToCheckout = () => {
    if (!user) {
      navigate("/login", {
        state: {
          from: "/checkout",
          deliveryDate,
          deliveryTime,
          cartNote: note,
        },
      });
      return;
    }

    navigate("/checkout", {
      state: {
        deliveryDate,
        deliveryTime,
        cartNote: note,
      },
    });
  };

  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-20 text-center">
        <p className="text-gray-500 font-medium">Đang tải giỏ hàng từ hệ thống...</p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <Breadcrumb
          items={[
            { label: "Trang chủ", path: "/" },
            { label: "Giỏ hàng" },
          ]}
        />
        <div className="max-w-4xl mx-auto my-10 bg-white border border-snd-bg-color/10 rounded-xl p-10 text-center shadow-sm">
          <h2 className="text-2xl font-black text-snd-bg-color uppercase tracking-wider mb-4">
            Giỏ Hàng Của Bạn
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            Hiện tại chưa có sản phẩm nào trong giỏ hàng.
          </p>
          <Link
            to="/"
            className="inline-block bg-main-color text-snd-bg-color font-bold text-sm px-6 py-3 rounded-lg hover:bg-[#e69200] hover:text-white transition cursor-pointer"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8 text-text-color">
      <Breadcrumb
        items={[
          { label: "Trang chủ", path: "/" },
          { label: "Giỏ hàng" },
        ]}
      />

      <h1 className="text-3xl font-bold text-snd-bg-color mb-6 mt-4">Giỏ hàng</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        {/* LEFT — DANH SÁCH SẢN PHẨM */}
        <div>
          <div className="bg-white border border-snd-bg-color/10 rounded-xl divide-y divide-gray-100 shadow-sm">
            {cartItems.map((item) => (
              <div key={item.CartItemID} className="flex items-start gap-4 p-5">
                {/* Xóa sản phẩm */}
                <button
                  onClick={() => handleRemoveItem(item.CartItemID)}
                  aria-label="Xóa sản phẩm"
                  className="text-gray-300 hover:text-main-color transition cursor-pointer mt-2"
                >
                  ✕
                </button>

                {/* Ảnh */}
                <Link to={`/product/${item.ProductID}`} className="flex-shrink-0">
                  <img
                    src={item.ProductImage || "https://via.placeholder.com/150"}
                    alt={item.ProductName}
                    className="w-20 h-20 rounded-lg object-cover bg-bg-color border border-snd-bg-color/10"
                  />
                </Link>

                {/* Thông tin */}
                <div className="flex-1 min-w-0">
                  <Link
                    to={`/product/${item.ProductID}`}
                    className="text-sm font-semibold text-snd-bg-color hover:text-main-color transition"
                  >
                    {item.ProductName}
                  </Link>

                  <div className="mt-1 flex flex-col gap-0.5">
                    {item.FlavorName && (
                      <p className="text-xs text-amber-600 font-bold">
                        Hương vị: <span className="text-gray-700 font-semibold">{item.FlavorName}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Giá sản phẩm */}
                <p className="text-sm font-bold text-main-color flex-shrink-0 mt-1">
                  {formatPrice(item.Price)}
                </p>

                {/* Tăng / Giảm Số lượng */}
                <div className="flex items-center border border-snd-bg-color/20 rounded-lg overflow-hidden flex-shrink-0">
                  <button
                    onClick={() => handleUpdateQuantity(item.CartItemID, item.Quantity - 1, item)}
                    className="w-8 h-8 flex items-center justify-center text-snd-bg-color hover:bg-bg-color font-bold cursor-pointer select-none"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={item.Quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      handleUpdateQuantity(item.CartItemID, isNaN(val) ? 1 : val, item);
                    }}
                    className="w-10 h-8 text-center text-sm font-bold border-x border-snd-bg-color/20 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button
                    onClick={() => handleUpdateQuantity(item.CartItemID, item.Quantity + 1, item)}
                    className="w-8 h-8 flex items-center justify-center text-snd-bg-color hover:bg-bg-color font-bold cursor-pointer select-none"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* GHI CHÚ */}
          <div className="mt-6">
            <p className="text-sm font-semibold text-snd-bg-color mb-2">Ghi chú đơn hàng</p>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú thêm cho đơn hàng (nếu có)..."
              className="w-full p-3 border border-snd-bg-color/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-main-color"
            />
          </div>
        </div>

        {/* RIGHT — HẸN GIỜ NHẬN HÀNG + TỔNG */}
        <div className="bg-white border border-snd-bg-color/10 rounded-xl p-6 shadow-sm h-fit">
          <h3 className="text-sm font-black uppercase text-snd-bg-color tracking-wider mb-4">
            Hẹn Giờ Nhận Hàng
          </h3>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Ngày nhận hàng</label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full p-2 border border-snd-bg-color/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-main-color"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Thời gian nhận hàng</label>
              <select
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
                className="w-full p-2 border border-snd-bg-color/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-main-color cursor-pointer"
              >
                {TIME_SLOTS.map((slot) => (
                  <option key={slot.value} value={slot.value}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* TỔNG CỘNG */}
          <div className="flex items-center justify-between text-base border-t border-snd-bg-color/10 pt-5 mb-5">
            <span className="font-bold text-snd-bg-color">Tổng cộng:</span>
            <span className="font-black text-main-color text-xl">
              {formatPrice(totalAmount)}
            </span>
          </div>

          {/* THANH TOÁN */}
          <button
            onClick={handleGoToCheckout}
            className="w-full bg-main-color text-snd-bg-color font-black uppercase tracking-wider text-sm py-3 rounded-xl hover:bg-[#e69200] hover:text-white active:scale-[0.98] transition-all duration-150 cursor-pointer"
          >
            Thanh Toán
          </button>
        </div>
      </div>
    </div>
  );
}