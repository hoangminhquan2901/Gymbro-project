import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const PROVINCES = ["Hà Nội"];

const DISTRICTS = {
  "Hà Nội": [
    "Thị xã Sơn Tây", "Quận Ba Đình", "Quận Cầu Giấy", "Quận Đống Đa",
    "Quận Hà Đông", "Quận Hai Bà Trưng", "Quận Hoàn Kiếm", "Quận Hoàng Mai",
    "Quận Long Biên", "Quận Nam Từ Liêm", "Quận Tây Hồ", "Quận Thanh Xuân",
    "Quận Bắc Từ Liêm", "Huyện Ba Vì", "Huyện Chương Mỹ", "Huyện Đan Phượng",
    "Huyện Đông Anh", "Huyện Gia Lâm", "Huyện Hoài Đức", "Huyện Mê Linh",
  ],
};

const WARDS = {
  "Quận Thanh Xuân": [
    "Phường Khương Đình", "Phường Khương Mai", "Phường Khương Trung",
    "Phường Kim Giang", "Phường Nhân Chính", "Phường Phương Liệt",
    "Phường Thanh Xuân Bắc", "Phường Thanh Xuân Nam", "Phường Thanh Xuân Trung",
    "Phường Thượng Đình",
  ],
  "Quận Ba Đình": [
    "Phường Cống Vị", "Phường Điện Biên", "Phường Đội Cấn", "Phường Giảng Võ",
    "Phường Kim Mã", "Phường Liễu Giai", "Phường Ngọc Hà", "Phường Ngọc Khánh",
    "Phường Phúc Xá", "Phường Quán Thánh", "Phường Thành Công", "Phường Trúc Bạch",
    "Phường Vĩnh Phúc",
  ],
  "Quận 1": [
    "Phường Bến Nghé", "Phường Bến Thành", "Phường Cầu Kho", "Phường Cầu Ông Lãnh",
    "Phường Cô Giang", "Phường Đa Kao", "Phường Nguyễn Cư Trinh", "Phường Nguyễn Thái Bình",
    "Phường Phạm Ngũ Lão", "Phường Tân Định",
  ],
};

// Ảnh mặc định dạng SVG nội bộ (Không gọi internet)
const FALLBACK_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='150' height='150' viewBox='0 0 24 24' fill='none' stroke='%23cbd5e1' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";

function SearchableSelect({ label, value, onChange, options, placeholder, disabled, isOpen, onToggle }) {
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        onToggle(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onToggle]);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(search.toLowerCase())
  );

  function handleSelect(opt) {
    onChange(opt);
    onToggle(false);
    setSearch("");
  }

  return (
    <div className="relative" ref={containerRef}>
      <label className="text-xs text-gray-500 absolute top-2 left-3 z-10 pointer-events-none">
        {label}
      </label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onToggle(!isOpen)}
        className={`w-full text-left pt-6 pb-2 px-3 border rounded-lg text-sm transition ${
          disabled
            ? "bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed"
            : "bg-white border-gray-300 hover:border-[#FCA311] cursor-pointer"
        } ${isOpen ? "border-[#FCA311] ring-1 ring-[#FCA311]" : ""}`}
      >
        <span className={value ? "text-[#14213D] font-medium" : "text-gray-400"}>
          {value || placeholder || "---"}
        </span>
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▼</span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-40 bg-white border border-gray-300 rounded-lg shadow-xl mt-1 max-h-60 flex flex-col">
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm..."
              className="w-full px-2 py-1.5 border border-[#FCA311] rounded text-sm focus:outline-none"
            />
          </div>
          <div className="overflow-y-auto flex-1">
            {filtered.length > 0 ? (
              filtered.map((opt) => {
                const isSelected = value === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className={`w-full text-left px-3 py-2.5 text-sm cursor-pointer transition ${
                      isSelected
                        ? "bg-[#14213D] text-white hover:bg-[#1c2b4d]"
                        : "text-[#14213D] hover:bg-gray-100"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-4 text-sm text-gray-400 text-center">Không tìm thấy</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const cartContext = useCart();
  const items = cartContext?.items || [];
  const loading = cartContext?.loading || false;
  const fetchCart = cartContext?.fetchCart;
  const clearCart = cartContext?.clearCart;

  const token = localStorage.getItem("token");
  const [submitting, setSubmitting] = useState(false);

  const { deliveryDate, deliveryTime, cartNote } = location.state || {};
  const [activeDropdown, setActiveDropdown] = useState("");

  const [form, setForm] = useState({
    email: "",
    name: "",
    phone: "",
    address: "",
    province: "",
    district: "",
    ward: "",
    note: "",
  });

  const total = items.reduce(
    (sum, item) => sum + parsePrice(item.price || item.Price) * Number(item.quantity || item.Quantity || 1),
    0
  );

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        email: user.email || prev.email,
        name: user.name || user.fullName || prev.name,
        phone: user.phone || prev.phone,
      }));
    }
  }, [user]);

  useEffect(() => {
    let generatedNotes = [];

    let formattedDate = deliveryDate;
    if (deliveryDate && deliveryDate.includes("-")) {
      const [yyyy, mm, dd] = deliveryDate.split("-");
      formattedDate = `${dd}/${mm}/${yyyy}`;
    }

    const timeLabels = {
      "hanh-chinh": "giờ hành chính",
      "08-12": "khung giờ 08h00 - 12h00",
      "14-18": "khung giờ 14h00 - 18h00",
      "19-21": "khung giờ 19h00 - 21h00",
    };

    if (deliveryTime && timeLabels[deliveryTime]) {
      generatedNotes.push(`Giao vào ${timeLabels[deliveryTime]} ngày ${formattedDate}`);
    } else if (deliveryDate) {
      generatedNotes.push(`Giao vào ngày ${formattedDate}`);
    }

    if (cartNote && cartNote.trim() !== "") {
      generatedNotes.push(cartNote.trim());
    }

    if (generatedNotes.length > 0) {
      setForm((prev) => ({
        ...prev,
        note: generatedNotes.join(". "),
      }));
    }
  }, [deliveryDate, deliveryTime, cartNote]);

  const isAddressComplete = form.province && form.district && form.ward && form.address;
  const availableDistricts = DISTRICTS[form.province] ?? [];
  const availableWards = WARDS[form.district] ?? [];

  function handleChange(field, value) {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "province") { next.district = ""; next.ward = ""; }
      if (field === "district") { next.ward = ""; }
      return next;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!isAddressComplete) {
      alert("Vui lòng chọn đầy đủ Tỉnh thành, Quận huyện và Phường xã!");
      return;
    }

    const fullAddress = `${form.address}, ${form.ward}, ${form.district}, ${form.province}`;

    const orderPayload = {
      customerName: form.name,
      phone: form.phone,
      email: form.email,
      address: fullAddress,
      note: form.note || "Không có ghi chú",
      paymentMethod: "COD",
    };

    try {
      setSubmitting(true);
      const res = await axios.post("http://localhost:5000/api/orders/checkout", orderPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        alert(`Đặt hàng thành công! Mã đơn hàng: ${res.data.orderId || res.data.data?.orderId}`);

        if (typeof clearCart === "function") {
          clearCart();
        }
        if (typeof fetchCart === "function") {
          await fetchCart();
        }
        
        localStorage.removeItem("gymbro_cart");
        window.dispatchEvent(new Event("cartUpdated"));

        navigate("/profile/orders");
      }
    } catch (error) {
      console.error("Lỗi khi đặt hàng:", error);
      alert(error.response?.data?.message || "Đặt hàng thất bại, vui lòng thử lại!");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading && items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto my-20 text-center">
        <p className="text-gray-500 mb-4">Đang tải thông tin đơn hàng...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto my-20 text-center">
        <p className="text-gray-500 mb-4">Giỏ hàng trống, không thể thanh toán.</p>
        <Link to="/" className="text-[#FCA311] font-bold hover:underline">← Quay về trang chủ</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E5E5E5] py-8 px-4">
      <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">

        {/* LEFT — FORM */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-8 shadow-sm border border-[#d6d6d6]">
          <h2 className="text-xl font-black text-[#14213D] mb-6">Thông tin mua hàng</h2>

          <div className="flex flex-col gap-4">
            <div className="relative">
              <label className="text-xs text-gray-500 absolute top-2 left-3 pointer-events-none">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="email@example.com"
                className="w-full pt-6 pb-2 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FCA311] focus:border-[#FCA311]"
              />
            </div>

            <div className="relative">
              <label className="text-xs text-gray-500 absolute top-2 left-3 pointer-events-none">Họ và tên</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
                className="w-full pt-6 pb-2 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FCA311] focus:border-[#FCA311]"
              />
            </div>

            <div className="relative">
              <label className="text-xs text-gray-500 absolute top-2 left-3 pointer-events-none">Số điện thoại</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                required
                className="w-full pt-6 pb-2 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FCA311] focus:border-[#FCA311]"
              />
            </div>

            <div className="relative">
              <label className="text-xs text-gray-500 absolute top-2 left-3 pointer-events-none">Địa chỉ</label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                required
                placeholder="Số nhà, tên đường..."
                className="w-full pt-6 pb-2 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FCA311] focus:border-[#FCA311]"
              />
            </div>

            <SearchableSelect
              label="Tỉnh thành"
              value={form.province}
              onChange={(v) => handleChange("province", v)}
              options={PROVINCES}
              placeholder="Chọn tỉnh thành"
              isOpen={activeDropdown === "province"}
              onToggle={(open) => setActiveDropdown(open ? "province" : "")}
            />

            <SearchableSelect
              label="Quận huyện"
              value={form.district}
              onChange={(v) => handleChange("district", v)}
              options={availableDistricts}
              placeholder={form.province ? "Chọn quận huyện" : "---"}
              disabled={!form.province}
              isOpen={activeDropdown === "district"}
              onToggle={(open) => setActiveDropdown(open ? "district" : "")}
            />

            <SearchableSelect
              label="Phường xã"
              value={form.ward}
              onChange={(v) => handleChange("ward", v)}
              options={availableWards}
              placeholder={form.district ? "Chọn phường xã" : "---"}
              disabled={!form.district}
              isOpen={activeDropdown === "ward"}
              onToggle={(open) => setActiveDropdown(open ? "ward" : "")}
            />

            <div className="relative">
              <label className="text-xs text-gray-500 absolute top-2 left-3 pointer-events-none">Ghi chú (tùy chọn)</label>
              <textarea
                rows={3}
                value={form.note}
                onChange={(e) => handleChange("note", e.target.value)}
                className="w-full pt-6 pb-2 px-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#FCA311] focus:border-[#FCA311] resize-none"
              />
            </div>
          </div>

          {/* VẬN CHUYỂN */}
          <div className="mt-8">
            <h3 className="text-base font-black text-[#14213D] mb-3">Vận chuyển</h3>
            {isAddressComplete ? (
              <div className="flex items-center justify-between p-4 border border-[#d6d6d6] rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full bg-[#FCA311] flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white" />
                  </div>
                  <span className="text-sm font-medium text-[#14213D]">Giao hàng {form.province}</span>
                </div>
                <span className="text-sm font-bold text-green-600">Miễn phí</span>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-600">
                Vui lòng nhập đầy đủ thông tin giao hàng
              </div>
            )}
          </div>

          {/* THANH TOÁN */}
          <div className="mt-6">
            <h3 className="text-base font-black text-[#14213D] mb-3">Thanh toán</h3>
            <div className="flex items-center justify-between p-4 border-2 border-[#FCA311] rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full bg-[#FCA311] flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
                <span className="text-sm font-medium text-[#14213D]">Thanh Toán Khi Giao Hàng (COD)</span>
              </div>
              <span className="text-xl">💵</span>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="mt-8 flex items-center justify-between">
            <Link to="/cart" className="text-sm text-[#FCA311] hover:underline font-medium">
              ← Quay về giỏ hàng
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#FCA311] text-white font-black uppercase tracking-wider text-sm px-8 py-3 rounded-xl hover:bg-[#e69200] active:scale-[0.98] transition-all cursor-pointer disabled:bg-gray-400"
            >
              {submitting ? "Đang xử lý..." : "Đặt Hàng"}
            </button>
          </div>
        </form>

        {/* RIGHT — ĐƠN HÀNG */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-[#d6d6d6] h-fit">
          <h3 className="text-base font-black text-[#14213D] mb-4">
            Đơn hàng ({items.reduce((s, i) => s + Number(i.quantity || i.Quantity || 1), 0)} sản phẩm)
          </h3>

          <div className="divide-y divide-gray-100 mb-6">
            {items.map((item, idx) => {
              const itemKey = item.cartItemId || item.CartItemID || item.id || idx;
              const name = item.name || item.ProductName || "Sản phẩm";
              
              // Sử dụng FALLBACK_IMAGE thay vì via.placeholder.com
              const image = item.image || item.ProductImage || FALLBACK_IMAGE;
              
              const price = parsePrice(item.price || item.Price);
              const qty = Number(item.quantity || item.Quantity || 1);
              const subTotal = item.SubTotal ? parsePrice(item.SubTotal) : price * qty;
              const flavor = item.flavor || item.FlavorName;

              return (
                <div key={itemKey} className="flex items-center gap-3 py-3">
                  <div className="relative flex-shrink-0">
                    <img
                      src={image}
                      alt={name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = FALLBACK_IMAGE;
                      }}
                      className="w-14 h-14 rounded-lg object-cover bg-gray-100 border border-gray-100"
                    />
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#14213D] text-white text-[10px] font-black rounded-full flex items-center justify-center">
                      {qty}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#14213D] line-clamp-2">{name}</p>
                    {flavor && (
                      <p className="text-[10px] text-gray-400">{flavor}</p>
                    )}
                  </div>
                  <p className="text-sm font-bold text-[#14213D] flex-shrink-0">
                    {formatPrice(subTotal)}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="border-t border-gray-100 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tạm tính</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Phí vận chuyển</span>
              <span className="text-green-600 font-medium">Miễn phí</span>
            </div>
            <div className="flex justify-between text-base font-black text-[#14213D] pt-2 border-t border-gray-100">
              <span>Tổng cộng</span>
              <span className="text-[#FCA311] text-lg">{formatPrice(total)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}