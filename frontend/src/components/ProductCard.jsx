import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaStar } from "react-icons/fa";

// 🎯 HÀM HELPER ĐÃ FIX: Tránh lỗi bóc tách sai chuỗi dẫn đến nhân giá tiền
const formatPrice = (price) => {
  if (price === undefined || price === null || price === "") return "";
  
  // Nếu đã là chuỗi hiển thị có chữ "đ" thì trả về luôn, không xử lý lại để tránh lỗi nhân số
  if (typeof price === "string" && price.includes("đ")) return price;

  // Nếu là số thuần túy hoặc chuỗi thuần số từ DB trả về
  const numericValue = typeof price === "number" 
    ? price 
    : Number(String(price).replace(/\D/g, ""));

  if (isNaN(numericValue)) return price;

  return numericValue.toLocaleString("vi-VN") + "đ";
};

function ProductCard({ product }) {
  const navigate = useNavigate();

  // Chuyển hướng sang trang chi tiết sản phẩm
  function handleViewDetail(e) {
    e.preventDefault();
    e.stopPropagation(); // Ngăn sự kiện click bị lặp với thẻ Link cha

    if (product?.id) {
      navigate(`/product/${product.id}`);
    }
  }

  return (
    <Link
      to={`/product/${product?.id}`}
      className="
        group
        flex
        flex-col
        h-full
        bg-white
        border
        border-gray-200
        hover:border-[#FCA311]
        rounded-2xl
        p-3.5
        transition-all
        duration-300
        shadow-sm
        hover:shadow-xl
        hover:-translate-y-1.5
        relative
        select-none
        cursor-pointer
        overflow-hidden
      "
    >
      {/* 1. BADGE GIẢM GIÁ */}
      {product?.discount && (
        <div
          className="
            absolute
            top-3
            left-3
            bg-red-500
            text-white
            text-[10px]
            font-black
            uppercase
            tracking-wider
            px-2
            py-0.5
            rounded-md
            shadow-sm
            z-10
          "
        >
          {product.discount}
        </div>
      )}

      {/* 2. HIỂN THỊ HÌNH ẢNH */}
      <div
        className="
          w-full
          aspect-square
          rounded-xl
          overflow-hidden
          bg-gray-50
          mb-3.5
          flex
          items-center
          justify-center
          p-2
          border
          border-gray-100
        "
      >
        <img
          src={product?.img || product?.image || "/placeholder.png"}
          alt={product?.name || "Sản phẩm GymBro"}
          loading="lazy"
          className="
            object-contain
            max-h-[160px]
            w-auto
            group-hover:scale-105
            transition-transform
            duration-300
            ease-out
          "
        />
      </div>

      {/* 3. NỘI DUNG SẢN PHẨM */}
      <div className="flex flex-col flex-grow justify-between">
        <div>
          {/* TÊN SẢN PHẨM */}
          <h3
            className="
              text-sm
              font-semibold
              text-gray-900
              group-hover:text-[#14213D]
              line-clamp-2
              min-h-[2.625rem]
              leading-snug
              transition-colors
              duration-200
            "
          >
            {product?.name}
          </h3>

          {/* RATING */}
          {product?.rating && (
            <div
              aria-label={`Đánh giá: ${product.rating} sao`}
              className="
                flex
                items-center
                gap-1
                mt-1.5
                text-xs
                text-[#FCA311]
                font-bold
              "
            >
              <FaStar className="text-[11px]" />
              <span>{product.rating}</span>
            </div>
          )}
        </div>

        {/* GIÁ CẢ */}
        <div className="mt-3 pt-2 border-t border-gray-50 flex items-baseline gap-2">
          <p className="text-lg font-extrabold text-[#14213D] tracking-tight leading-none">
            {formatPrice(product?.price)}
          </p>
          {product?.oldPrice && (
            <p className="text-xs text-gray-400 line-through font-medium">
              {formatPrice(product.oldPrice)}
            </p>
          )}
        </div>
      </div>

      {/* 4. NÚT CHUYỂN HƯỚNG SANG TRANG CHI TIẾT */}
      <button
        type="button"
        onClick={handleViewDetail}
        className="
          w-full
          mt-3.5
          text-xs
          font-bold
          py-2.5
          px-3
          rounded-xl
          uppercase
          tracking-wider
          flex
          items-center
          justify-center
          gap-2
          transition-all
          duration-200
          pointer-events-auto
          bg-[#14213D]
          text-white
          hover:bg-[#1B2B4A]
          active:scale-[0.98]
          cursor-pointer
          shadow-sm
          hover:shadow
        "
      >
        <FaEye className="text-xs" />
        <span>Xem chi tiết</span>
      </button>
    </Link>
  );
}

export default ProductCard;