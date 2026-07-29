import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { getMaxStockForProduct } from "../utils/stockHelper";

const TIME_SLOTS = [
  { label: "Chọn thời gian", value: "" },
  { label: "Giao giờ hành chính", value: "hanh-chinh" },
  { label: "08h00 - 12h00", value: "08-12" },
  { label: "14h00 - 18h00", value: "14-18" },
  { label: "19h00 - 21h00", value: "19-21" },
];

// Ảnh mặc định dạng SVG nội bộ (Không cần gọi internet)
const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 24 24' fill='none' stroke='%23cbd5e1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";

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

  const { items: cartItems, updateQuantity, removeFromCart, loading } = useCart();

  const [note, setNote] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(todayString());
  const [deliveryTime, setDeliveryTime] = useState("");

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + parsePrice(item.price || item.Price) * Number(item.quantity || item.Quantity || 1),
    0
  );

  const handleUpdateQuantity = async (item, newQuantity) => {
    const cartItemId = item.cartItemId || item.CartItemID || item.id || item.ProductID;

    if (!cartItemId) {
      alert("Lỗi: Không tìm thấy ID của sản phẩm trong giỏ hàng!");
      return;
    }

    if (newQuantity <= 0) {
      await removeFromCart(cartItemId);
      return;
    }

    const productId = item.id || item.ProductID;
    const flavorName = item.flavor || item.FlavorName;
    const maxStock = getMaxStockForProduct(productId, flavorName);

    if (typeof maxStock === "number" && maxStock > 0 && newQuantity > maxStock) {
      alert(`Chỉ còn ${maxStock} sản phẩm trong kho!`);
      return;
    }

    await updateQuantity(cartItemId, newQuantity);
  };

  const handleRemoveItem = async (item) => {
    const cartItemId = item.cartItemId || item.CartItemID || item.id || item.ProductID;
    if (!cartItemId) {
      alert("Lỗi: Không tìm thấy ID sản phẩm để xóa!");
      return;
    }
    await removeFromCart(cartItemId);
  };

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

  if (loading && cartItems.length === 0) {
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
            {cartItems.map((item, idx) => {
              const itemKey = item.cartItemId || item.CartItemID || item.id || idx;
              const name = item.name || item.ProductName || "Sản phẩm";
              
              // Sử dụng FALLBACK_IMAGE thay vì via.placeholder.com
              const image = item.image || item.ProductImage || FALLBACK_IMAGE;
              
              const price = item.price || item.Price;
              const quantity = Number(item.quantity || item.Quantity || 1);
              const flavor = item.flavor || item.FlavorName;
              const productId = item.id || item.ProductID;

              return (
                <div key={itemKey} className="flex items-start gap-4 p-5">
                  {/* Nút Xóa sản phẩm */}
                  <button
                    onClick={() => handleRemoveItem(item)}
                    className="text-gray-400 hover:text-red-500 font-bold transition px-1 cursor-pointer"
                    title="Xóa khỏi giỏ hàng"
                  >
                    ✕
                  </button>

                  {/* Ảnh sản phẩm */}
                  <Link to={`/product/${productId}`} className="flex-shrink-0">
                    <img
                      src={image}
                      alt={name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = FALLBACK_IMAGE;
                      }}
                      className="w-20 h-20 rounded-lg object-cover bg-bg-color border border-snd-bg-color/10"
                    />
                  </Link>

                  {/* Thông tin sản phẩm */}
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/product/${productId}`}
                      className="text-sm font-semibold text-snd-bg-color hover:text-main-color transition"
                    >
                      {name}
                    </Link>

                    <div className="mt-1 flex flex-col gap-0.5">
                      {flavor && (
                        <p className="text-xs text-amber-600 font-bold">
                          Hương vị:{" "}
                          <span className="text-gray-700 font-semibold">{flavor}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Giá sản phẩm */}
                  <p className="text-sm font-bold text-main-color flex-shrink-0 mt-1">
                    {formatPrice(price)}
                  </p>

                  {/* Nút Tăng / Giảm Số lượng */}
                  <div className="flex items-center border border-snd-bg-color/20 rounded-lg overflow-hidden flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(item, quantity - 1)}
                      className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 font-bold text-gray-600 transition cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        handleUpdateQuantity(item, isNaN(val) ? 1 : val);
                      }}
                      className="w-10 h-8 text-center text-sm font-bold border-x border-snd-bg-color/20 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(item, quantity + 1)}
                      className="w-8 h-8 flex items-center justify-center bg-gray-50 hover:bg-gray-100 font-bold text-gray-600 transition cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* GHI CHÚ */}
          <div className="mt-6">
            <p className="text-sm font-semibold text-snd-bg-color mb-2">
              Ghi chú đơn hàng
            </p>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ghi chú thêm cho đơn hàng (nếu có)..."
              className="w-full p-3 border border-snd-bg-color/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-main-color"
            />
          </div>
        </div>

        {/* RIGHT — HẸN GIỜ NHẬN HÀNG + TỔNG CỘNG */}
        <div className="bg-white border border-snd-bg-color/10 rounded-xl p-6 shadow-sm h-fit">
          <h3 className="text-sm font-black uppercase text-snd-bg-color tracking-wider mb-4">
            Hẹn Giờ Nhận Hàng
          </h3>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Ngày nhận hàng
              </label>
              <input
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                className="w-full p-2 border border-snd-bg-color/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-main-color"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Thời gian nhận hàng
              </label>
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

          {/* NÚT THANH TOÁN */}
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