// src/components/Admin/StatCard.jsx
import React from "react";

function StatCard({
  title,
  value,
  icon,
  color = "text-[#FCA311]",
  bg = "bg-[#FFF8EC]",
}) {
  return (
    <div
      className="
        bg-white
        rounded-2xl
        border
        border-gray-200
        p-6
        shadow-sm
        hover:shadow-md
        transition-all
        duration-300
      "
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>

          <h2 className="text-3xl font-bold text-[#14213D] mt-2">
            {value}
          </h2>
        </div>

        <div
          className={`
            w-14
            h-14
            rounded-xl
            flex
            items-center
            justify-center
            ${bg}
          `}
        >
          <div className={color}>{icon}</div>
        </div>
      </div>
    </div>
  );
}

export default StatCard;