import React from "react";
import { Eye, Pencil, Trash2, Target, PackageCheck } from "lucide-react";

function GoalTable({ goals = [], onDetail, onEdit, onDelete }) {
  const formatDate = (dateString) => {
    if (!dateString) return "---";
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? dateString : d.toLocaleDateString("vi-VN");
  };

  // Sắp xếp danh sách từ cũ đến mới (tăng dần theo thời gian)
  // Ưu tiên dùng createdAt, nếu không có sẽ dùng updatedAt hoặc id
  const sortedGoals = [...goals].sort((a, b) => {
  // 1. Nếu có ID kiểu số tăng dần (Auto Increment trong SQL)
  if (typeof a.id === "number" && typeof b.id === "number") {
    return a.id - b.id;
  }

  // 2. Nếu dùng ngày tháng (createdAt / updatedAt)
  const timeA = new Date(a.createdAt || a.updatedAt || a.created_at || 0).getTime();
  const timeB = new Date(b.createdAt || b.updatedAt || b.created_at || 0).getTime();

  // Nếu item mới chưa có ngày (NaN hoặc 0), gán thời gian hiện tại để ép nó nằm dưới cùng
  const validTimeA = isNaN(timeA) || timeA === 0 ? Date.now() : timeA;
  const validTimeB = isNaN(timeB) || timeB === 0 ? Date.now() : timeB;

  return validTimeA - validTimeB;
});

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-xs sm:text-sm">
        <thead>
          <tr className="bg-gray-50/80 border-b border-gray-100 text-[#14213D]">
            <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[11px] text-gray-500 w-20">
              Hình ảnh
            </th>
            <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[11px] text-gray-500 min-w-[160px]">
              Tên nhu cầu
            </th>
            <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[11px] text-gray-500 max-w-xs">
              Mô tả chi tiết
            </th>
            <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[11px] text-gray-500 text-center w-36">
              Sản phẩm
            </th>
            <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[11px] text-gray-500 w-32">
              Cập nhật
            </th>
            <th className="px-5 py-3.5 font-bold uppercase tracking-wider text-[11px] text-gray-500 text-center w-28">
              Thao tác
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-100 bg-white">
          {sortedGoals.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="py-12 text-center text-gray-400 font-medium italic"
              >
                Chưa có mục tiêu & nhu cầu nào trong danh sách.
              </td>
            </tr>
          ) : (
            sortedGoals.map((goal) => {
              const productCount =
                goal.productCount ?? (goal.products?.length || 0);
              const keyId = goal.id || goal._id || goal.slug;

              return (
                <tr
                  key={keyId}
                  className="hover:bg-amber-50/30 transition-colors duration-150 group"
                >
                  {/* HÌNH ẢNH */}
                  <td className="px-5 py-3.5 align-middle">
                    {goal.image ? (
                      <img
                        src={goal.image}
                        alt={goal.name}
                        className="w-12 h-12 rounded-xl object-cover border border-gray-100 shadow-2xs group-hover:scale-105 transition-transform duration-200"
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.nextSibling.style.display = "flex";
                        }}
                      />
                    ) : null}
                    <div
                      className={`w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 ${
                        goal.image ? "hidden" : "flex"
                      }`}
                    >
                      <Target size={22} className="text-[#FCA311]" />
                    </div>
                  </td>

                  {/* TÊN */}
                  <td className="px-5 py-3.5 align-middle">
                    <div className="font-bold text-[#14213D] text-sm group-hover:text-[#FCA311] transition-colors">
                      {goal.name}
                    </div>
                    {goal.slug && (
                      <span className="text-[11px] font-mono text-gray-400 block mt-0.5">
                        #{goal.slug}
                      </span>
                    )}
                  </td>

                  {/* MÔ TẢ */}
                  <td className="px-5 py-3.5 align-middle max-w-xs">
                    <p
                      className="text-gray-600 text-xs leading-relaxed line-clamp-2"
                      title={goal.description}
                    >
                      {goal.description || (
                        <span className="italic text-gray-400">
                          Chưa có mô tả chi tiết.
                        </span>
                      )}
                    </p>
                  </td>

                  {/* SỐ SẢN PHẨM */}
                  <td className="px-5 py-3.5 align-middle text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-100">
                      <PackageCheck size={13} className="text-sky-600" />
                      {productCount}
                    </span>
                  </td>

                  {/* CẬP NHẬT */}
                  <td className="px-5 py-3.5 align-middle text-gray-500 text-xs font-medium whitespace-nowrap">
                    {formatDate(goal.updatedAt)}
                  </td>

                  {/* THAO TÁC */}
                  <td className="px-5 py-3.5 align-middle text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        title="Xem chi tiết"
                        onClick={() => onDetail && onDetail(goal)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sky-600 hover:bg-sky-50 hover:scale-110 active:scale-95 transition cursor-pointer"
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        type="button"
                        title="Chỉnh sửa"
                        onClick={() => onEdit && onEdit(goal)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-600 hover:bg-emerald-50 hover:scale-110 active:scale-95 transition cursor-pointer"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        title="Xóa mục tiêu"
                        onClick={() => onDelete && onDelete(goal)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-50 hover:scale-110 active:scale-95 transition cursor-pointer"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default GoalTable;