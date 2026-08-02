import React, { useState } from "react";
import axios from "axios";
import {
  FaRulerVertical,
  FaWeightHanging,
  FaHeartbeat,
  FaNotesMedical,
  FaCheckCircle,
  FaInfoCircle,
  FaRobot,
  FaSpinner,
  FaArrowRight,
} from "react-icons/fa";

// Hàm tính vị trí % con trỏ BMI trên thanh đo
function calculateBmiPercent(bmi) {
  if (bmi < 18.5) {
    const minBmi = 15;
    const maxBmi = 18.5;
    const progress = Math.max(0, bmi - minBmi) / (maxBmi - minBmi);
    return progress * 20;
  } else if (bmi < 25) {
    const progress = (bmi - 18.5) / (25 - 18.5);
    return 20 + progress * 30;
  } else if (bmi < 30) {
    const progress = (bmi - 25) / (30 - 25);
    return 50 + progress * 25;
  } else {
    const progress = Math.min(1, (bmi - 30) / (40 - 30));
    return 75 + progress * 25;
  }
}

function getBmiCategory(bmiValue) {
  const percent = calculateBmiPercent(bmiValue);
  if (bmiValue < 18.5) return { name: "Gầy", color: "text-blue-500", percent };
  if (bmiValue < 25) return { name: "Bình thường", color: "text-emerald-500", percent };
  if (bmiValue < 30) return { name: "Thừa cân", color: "text-amber-500", percent };
  if (bmiValue < 35) return { name: "Béo phì độ I", color: "text-orange-500", percent };
  if (bmiValue < 40) return { name: "Béo phì độ II", color: "text-red-500", percent };
  return { name: "Béo phì độ III", color: "text-red-700", percent };
}

const QUICK_TAGS = [
  "mất ngủ",
  "tập mãi không lên cơ",
  "nhiều mỡ bụng",
  "mệt mỏi",
  "đau khớp",
  "stress",
];

export default function BMI() {
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [condition, setCondition] = useState("");

  const [bmi, setBmi] = useState(null);
  const [categoryInfo, setCategoryInfo] = useState({ name: "", color: "", percent: 0 });

  // State nhận phản hồi từ AI Backend
  const [aiAdvice, setAiAdvice] = useState("");
  const [subCategories, setSubCategories] = useState([]);

  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState("");

  const handleHeightChange = (e) => {
    const val = e.target.value;
    setHeight(val);
    if (!val || !weight) {
      setBmi(null);
      setSubCategories([]);
      setAiAdvice("");
    }
  };

  const handleWeightChange = (e) => {
    const val = e.target.value;
    setWeight(val);
    if (!val || !height) {
      setBmi(null);
      setSubCategories([]);
      setAiAdvice("");
    }
  };

  const calculateBMI = () => {
    if (!height || !weight) {
      setError("Vui lòng nhập đầy đủ Chiều cao và Cân nặng!");
      return;
    }
    if (Number(height) <= 0 || Number(weight) <= 0) {
      setError("Chiều cao và Cân nặng phải lớn hơn 0!");
      return;
    }

    setError("");
    const h = Number(height) / 100;
    const w = Number(weight);
    const bmiValue = parseFloat((w / (h * h)).toFixed(1));
    const category = getBmiCategory(bmiValue);

    setBmi(bmiValue);
    setCategoryInfo(category);
    setSubCategories([]);
    setAiAdvice("");
  };

  // GỌI API AI ĐỂ LẤY DANH MỤC GỢI Ý QUA CẦU NỐI SQL
  const generateSuggestionsWithAI = async () => {
    if (!bmi) {
      setError("Vui lòng phân tích BMI trước!");
      return;
    }

    setLoadingAI(true);
    setError("");

    try {
      const response = await axios.post("http://localhost:5000/api/ai/recommend-bmi", {
        height,
        weight,
        bmi,
        category: categoryInfo.name,
        condition,
      });

      if (response.data && response.data.success) {
        setAiAdvice(response.data.advice);
        setSubCategories(response.data.subCategories || []);
      } else {
        setError(response.data?.message || "Không nhận được phản hồi từ AI!");
      }
    } catch (err) {
      console.error("Lỗi khi kết nối AI:", err);
      setError("Có lỗi xảy ra khi gọi AI phân tích. Vui lòng thử lại!");
    } finally {
      setLoadingAI(false);
    }
  };

  const addQuickTag = (tag) => {
    if (!condition.includes(tag)) {
      setCondition((prev) => (prev ? `${prev}, ${tag}` : tag));
    }
  };

  return (
    <div className="min-h-screen bg-[#E5E5E5] py-10 px-4 font-sans text-[#14213D]">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* HEADER SECTION */}
        <div className="bg-[#14213D] text-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-800">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
            HEALTH & BMI EVALUATOR <span className="text-[#FCA311] text-xs px-2.5 py-1 bg-amber-500/20 border border-[#FCA311] rounded-full uppercase font-bold">AI Powered</span>
          </h1>
          <p className="text-sm text-gray-300 mt-1 max-w-xl">
            Đánh giá chỉ số khối cơ thể chuẩn xác và nhận định hướng danh mục sản phẩm phù hợp từ chuyên gia AI.
          </p>
        </div>

        {/* INPUT CARDS AREA (Chỉ còn Chiều cao & Cân nặng) */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-lg border border-gray-200">
          <h2 className="text-lg font-bold text-[#14213D] mb-4 flex items-center gap-2">
            <FaHeartbeat className="text-[#FCA311]" /> Nhập thông tin chỉ số thể trạng
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Chiều cao */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 focus-within:border-[#FCA311] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#FCA311]/20 transition-all">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Chiều cao</span>
                <span className="text-[#14213D] font-mono">(cm)</span>
              </label>
              <div className="flex items-center gap-3 mt-1">
                <div className="p-2.5 bg-[#14213D] text-[#FCA311] rounded-xl">
                  <FaRulerVertical className="text-lg" />
                </div>
                <input
                  type="number"
                  placeholder="VD: 170"
                  value={height}
                  onChange={handleHeightChange}
                  className="w-full bg-transparent text-xl font-black text-[#14213D] focus:outline-none placeholder:text-gray-300 placeholder:font-normal"
                />
              </div>
            </div>

            {/* Cân nặng */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 focus-within:border-[#FCA311] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#FCA311]/20 transition-all">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Cân nặng</span>
                <span className="text-[#14213D] font-mono">(kg)</span>
              </label>
              <div className="flex items-center gap-3 mt-1">
                <div className="p-2.5 bg-[#14213D] text-[#FCA311] rounded-xl">
                  <FaWeightHanging className="text-lg" />
                </div>
                <input
                  type="number"
                  placeholder="VD: 65"
                  value={weight}
                  onChange={handleWeightChange}
                  className="w-full bg-transparent text-xl font-black text-[#14213D] focus:outline-none placeholder:text-gray-300 placeholder:font-normal"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2">
              <FaInfoCircle /> {error}
            </div>
          )}

          <button
            onClick={calculateBMI}
            className="w-full mt-6 bg-[#FCA311] text-[#14213D] py-4 rounded-2xl font-black text-base uppercase tracking-wider hover:bg-[#e59400] active:scale-[0.99] transition cursor-pointer shadow-lg shadow-[#FCA311]/20 flex items-center justify-center gap-2"
          >
            <FaCalculatorIcon /> Phân Tích Chỉ Số BMI
          </button>
        </div>

        {/* HEALTH SCORE DASHBOARD */}
        {bmi && (
          <div className="bg-[#14213D] text-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-800 space-y-6 animate-fadeIn">
            <div className="flex justify-between items-center border-b border-gray-700 pb-4">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dashboard Kết Quả</span>
                <h3 className="text-xl font-bold">HEALTH SCORE & CONDITION</h3>
              </div>
              <span className="bg-[#FCA311] text-[#14213D] text-xs font-black px-3 py-1 rounded-full uppercase">
                {categoryInfo.name}
              </span>
            </div>

            <div className="grid md:grid-cols-3 gap-6 items-center">
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center">
                <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Chỉ số BMI</span>
                <div className="text-5xl font-black text-[#FCA311] my-1">{bmi}</div>
                <span className={`text-xs font-bold ${categoryInfo.color}`}>
                  Phân loại: {categoryInfo.name}
                </span>
              </div>

              <div className="md:col-span-2 space-y-3 bg-white/5 p-6 rounded-2xl border border-white/10">
                <div className="flex justify-between text-xs font-bold text-gray-300">
                  <span>Gầy (&lt;18.5)</span>
                  <span>Chuẩn (18.5-24.9)</span>
                  <span>Thừa cân (25-29.9)</span>
                  <span>Béo phì (&ge;30)</span>
                </div>

                <div className="relative w-full h-4 bg-gray-700 rounded-full overflow-hidden flex">
                  <div className="w-[20%] bg-blue-500 h-full"></div>
                  <div className="w-[30%] bg-emerald-500 h-full"></div>
                  <div className="w-[25%] bg-amber-500 h-full"></div>
                  <div className="w-[25%] bg-red-500 h-full"></div>

                  <div
                    className="absolute top-0 bottom-0 w-2 bg-white rounded-full shadow-lg transition-all duration-500 transform -translate-x-1/2"
                    style={{ left: `${Math.min(Math.max(categoryInfo.percent, 2), 98)}%` }}
                  />
                </div>

                <p className="text-xs text-gray-300 leading-relaxed pt-1">
                  {categoryInfo.name === "Gầy" && "Cơ thể bạn đang thiếu năng lượng và khối lượng cơ. Cần tăng cường Calo và Protein."}
                  {categoryInfo.name === "Bình thường" && "Thân hình cân đối tuyệt vời! Hãy duy trì tập luyện và dinh dưỡng đa lượng."}
                  {categoryInfo.name === "Thừa cân" && "Chỉ số hơi cao. Khuyên dùng các dòng Whey Isolate và L-Carnitine để tối ưu mỡ."}
                  {categoryInfo.name.includes("Béo phì") && "Cần chú trọng kiểm soát calo nạp vào và duy trì vận động đều đặn."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* KHU VỰC ĐÁNH GIÁ CÁ NHÂN & TRIỆU CHỨNG */}
        {bmi && (
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-lg border border-gray-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#14213D] text-[#FCA311] rounded-xl">
                <FaNotesMedical className="text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#14213D]">Vấn Đề & Triệu Chứng Sức Khỏe</h3>
                <p className="text-xs text-gray-500">
                  Mô tả tình trạng cá nhân (VD: mất ngủ, đau khớp, mệt mỏi, tập mãi không lên cơ...)
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="text-xs font-bold text-gray-400 self-center">Chọn nhanh:</span>
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => addQuickTag(tag)}
                  className="text-xs font-semibold bg-slate-100 hover:bg-[#FCA311] hover:text-[#14213D] text-gray-700 px-3 py-1.5 rounded-lg border border-slate-200 transition cursor-pointer"
                >
                  + {tag}
                </button>
              ))}
            </div>

            <textarea
              rows="3"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="Nhập tình trạng sức khỏe chi tiết..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FCA311] focus:bg-white text-sm text-[#14213D] placeholder:text-gray-400 transition"
            />

            <button
              onClick={generateSuggestionsWithAI}
              disabled={loadingAI}
              className="w-full bg-[#14213D] text-white py-3.5 rounded-2xl font-bold text-sm uppercase tracking-wider hover:bg-[#1f3157] transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loadingAI ? (
                <>
                  <FaSpinner className="animate-spin text-lg" /> GymBro AI Đang Phân Tích...
                </>
              ) : (
                <>
                  <FaRobot className="text-lg text-[#FCA311]" /> GymBro AI Phân Tích & Gợi Ý Danh Mục Mua Sắm
                </>
              )}
            </button>
          </div>
        )}

        {/* KHUNG HIỂN THỊ LỜI KHUYÊN & DANH MỤC CON GỢI Ý (SUBCATEGORIES) */}
        {aiAdvice && (
          <div className="bg-amber-50 border border-[#FCA311] rounded-3xl p-6 md:p-8 shadow-md space-y-6 animate-fadeIn">
            <div>
              <h4 className="font-bold text-[#14213D] text-lg mb-2 flex items-center gap-2">
                <FaRobot className="text-[#FCA311] text-2xl" /> Lời khuyên từ Chuyên gia GymBro AI:
              </h4>
              <p className="text-sm text-gray-800 leading-relaxed italic bg-white/60 p-4 rounded-2xl border border-amber-200">{aiAdvice}</p>
            </div>

            {subCategories.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider block">
                  Danh mục sản phẩm con bạn nên tìm mua:
                </span>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {subCategories.map((sub) => (
                    <div
                      key={sub.CategoryID}
                      className="bg-white border border-amber-200 p-4 rounded-2xl shadow-sm hover:shadow-md transition flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#14213D] text-[#FCA311] flex items-center justify-center font-bold text-xs">
                          <FaCheckCircle />
                        </div>
                        <span className="font-bold text-[#14213D] text-sm group-hover:text-[#FCA311] transition">
                          {sub.SubCategoryName}
                        </span>
                      </div>
                      <a
                        href={`/products?category=${sub.CategoryID}`}
                        className="p-2 rounded-xl bg-slate-100 group-hover:bg-[#FCA311] group-hover:text-[#14213D] text-gray-600 transition"
                        title="Xem sản phẩm"
                      >
                        <FaArrowRight className="text-xs" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

function FaCalculatorIcon() {
  return (
    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
      <path d="M19 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 16H7v-2h10v2zm0-4H7v-2h10v2zm0-4H7V6h10v4z" />
    </svg>
  );
}