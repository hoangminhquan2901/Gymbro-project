import React, { useState } from "react";
import {
  FaRulerVertical,
  FaWeightHanging,
  FaHeartbeat,
  FaNotesMedical,
  FaShoppingCart,
  FaCheckCircle,
  FaInfoCircle,
  FaSearch,
  FaStar,
} from "react-icons/fa";

// Quy tắc map triệu chứng -> Tên sản phẩm & thông tin E-Commerce
const SYMPTOM_RULES = {
  "mất ngủ": ["Melatonin", "Magnesium", "ZMA"],
  "khó ngủ": ["Melatonin", "Magnesium", "ZMA"],
  "ngủ không sâu": ["Melatonin", "Magnesium"],
  "stress": ["Ashwagandha", "Magnesium", "Omega 3"],
  "căng thẳng": ["Ashwagandha", "Omega 3"],
  "lo âu": ["Ashwagandha", "Magnesium"],
  "mệt mỏi": ["Multivitamin", "Vitamin B Complex", "Electrolytes"],
  "uể oải": ["Multivitamin", "Vitamin B Complex"],
  "thiếu năng lượng": ["Vitamin B Complex", "CoQ10"],
  "đau cơ": ["BCAA", "EAA", "Whey Protein"],
  "phục hồi chậm": ["BCAA", "EAA", "Creatine"],
  "tập mãi không lên cơ": ["Whey Protein", "Creatine", "Mass Gainer"],
  "nhiều mỡ bụng": ["L-Carnitine", "Whey Isolate"],
  "khó giảm cân": ["L-Carnitine", "Green Tea Extract"],
  "đầy bụng": ["Digestive Enzyme", "Probiotic"],
  "khó tiêu": ["Digestive Enzyme", "Probiotic"],
  "rối loạn tiêu hóa": ["Probiotic"],
  "đau khớp": ["Glucosamine", "Collagen", "Omega 3"],
  "đau gối": ["Glucosamine", "Collagen"],
  "xương khớp": ["Glucosamine", "MSM"],
  "rụng tóc": ["Biotin", "Collagen", "Zinc"],
  "tóc yếu": ["Biotin", "Collagen"],
  "da khô": ["Collagen", "Omega 3"],
  "lão hóa da": ["Collagen", "Vitamin C"],
  "cholesterol cao": ["Omega 3", "CoQ10"],
  "tim mạch": ["Omega 3", "CoQ10"],
  "hay ốm": ["Vitamin C", "Zinc", "Multivitamin"],
  "sức đề kháng kém": ["Vitamin C", "Zinc"],
  "sinh lý nam": ["ZMA", "Tribulus", "Tongkat Ali"],
  "testosterone thấp": ["Tongkat Ali", "ZMA"],
  "thiếu sắt": ["Iron", "Multivitamin Women"],
  "mỏi mắt": ["Lutein", "Omega 3"],
  "khô mắt": ["Lutein", "Omega 3"],
};

// Database chi tiết từng sản phẩm hiển thị trên Product Card
const PRODUCT_DETAILS = {
  "Whey Protein": {
    badge: "Top Seller",
    tagColor: "bg-amber-500",
    image: "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?auto=format&fit=crop&q=80&w=400",
    desc: "Hỗ trợ phát triển và phục hồi cơ bắp tối ưu sau khi tập.",
    price: "850.000 đ",
  },
  "Whey Isolate": {
    badge: "Tinh Khiết",
    tagColor: "bg-blue-600",
    image: "https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&q=80&w=400",
    desc: "Hấp thụ siêu nhanh, ít Calo, không chứa Lactose.",
    price: "1.150.000 đ",
  },
  "Mass Gainer": {
    badge: "Tăng Cân Nhanh",
    tagColor: "bg-red-600",
    image: "https://images.unsplash.com/photo-1546483875-ad9014c88eba?auto=format&fit=crop&q=80&w=400",
    desc: "Bổ sung Calo & Carb dồi dào cho người gầy xơ xác.",
    price: "990.000 đ",
  },
  "Creatine": {
    badge: "High Energy",
    tagColor: "bg-purple-600",
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=400",
    desc: "Tăng sức mạnh bùng nổ và độ phồng cơ bắp.",
    price: "450.000 đ",
  },
  "Omega 3": {
    badge: "Tim Mạch & Não",
    tagColor: "bg-emerald-600",
    image: "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?auto=format&fit=crop&q=80&w=400",
    desc: "Giảm viêm, tốt cho tim mạch, mắt và xương khớp.",
    price: "380.000 đ",
  },
  "Multivitamin": {
    badge: "Daily Vitality",
    tagColor: "bg-yellow-600",
    image: "https://images.unsplash.com/photo-1550572017-edf79225c053?auto=format&fit=crop&q=80&w=400",
    desc: "Bổ sung đầy đủ Vitamin & Khoáng chất thiết yếu.",
    price: "320.000 đ",
  },
  "Melatonin": {
    badge: "Sleep Aid",
    tagColor: "bg-[#14213D]",
    image: "https://images.unsplash.com/photo-1512069772995-ec65ed45afd6?auto=format&fit=crop&q=80&w=400",
    desc: "Hỗ trợ giấc ngủ tự nhiên, sâu giấc và giảm trằn trọc.",
    price: "290.000 đ",
  },
  "Magnesium": {
    badge: "Thư Giãn Cơ",
    tagColor: "bg-indigo-600",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400",
    desc: "Thư thần kinh, chống chuột rút và hỗ trợ giấc ngủ.",
    price: "350.000 đ",
  },
  "L-Carnitine": {
    badge: "Fat Burner",
    tagColor: "bg-orange-600",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=400",
    desc: "Chuyển hóa mỡ thừa thành năng lượng tập luyện.",
    price: "520.000 đ",
  },
};

const DEFAULT_PRODUCT = {
  badge: "GymBro Recommend",
  tagColor: "bg-slate-700",
  image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400",
  desc: "Sản phẩm bổ sung sức khỏe chính hãng được GymBro khuyên dùng.",
  price: "Liên hệ GymBro",
};

// Hàm tính vị trí phần trăm động chính xác của con trỏ trên thanh đo theo vạch chia
function calculateBmiPercent(bmi) {
  if (bmi < 18.5) {
    // Vùng Gầy: BMI 15 -> 18.5 tương ứng 0% -> 20%
    const minBmi = 15;
    const maxBmi = 18.5;
    const progress = Math.max(0, bmi - minBmi) / (maxBmi - minBmi);
    return progress * 20;
  } else if (bmi < 25) {
    // Vùng Bình thường: BMI 18.5 -> 25 tương ứng 20% -> 50%
    const progress = (bmi - 18.5) / (25 - 18.5);
    return 20 + progress * 30;
  } else if (bmi < 30) {
    // Vùng Thừa cân: BMI 25 -> 30 tương ứng 50% -> 75%
    const progress = (bmi - 25) / (30 - 25);
    return 50 + progress * 25;
  } else {
    // Vùng Béo phì: BMI 30 -> 40 tương ứng 75% -> 100%
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
  const [bmi, setBmi] = useState(null);
  const [categoryInfo, setCategoryInfo] = useState({ name: "", color: "", percent: 0 });
  const [condition, setCondition] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [error, setError] = useState("");

  // Hàm xử lý khi thay đổi chiều cao
  const handleHeightChange = (e) => {
    const val = e.target.value;
    setHeight(val);
    if (!val || !weight) {
      setBmi(null);
      setSuggestions([]);
    }
  };

  // Hàm xử lý khi thay đổi cân nặng
  const handleWeightChange = (e) => {
    const val = e.target.value;
    setWeight(val);
    if (!val || !height) {
      setBmi(null);
      setSuggestions([]);
    }
  };

  const calculateBMI = () => {
    if (!height || !weight) {
      setError("Vui lòng nhập đầy đủ Chiều cao và Cân nặng!");
      return;
    }
    if (Number(height) <= 0 || Number(weight) <= 0) {
      setError("Chỉ số nhập vào phải lớn hơn 0!");
      return;
    }

    setError("");
    const h = Number(height) / 100;
    const w = Number(weight);
    const bmiValue = parseFloat((w / (h * h)).toFixed(1));
    const category = getBmiCategory(bmiValue);

    setBmi(bmiValue);
    setCategoryInfo(category);
    setSuggestions([]);
  };

  const generateSuggestions = () => {
    const text = condition.toLowerCase();
    let result = [];

    if (categoryInfo.name === "Gầy") {
      result.push("Mass Gainer", "Whey Protein", "Creatine");
    } else if (categoryInfo.name === "Bình thường") {
      result.push("Whey Protein", "Creatine", "Omega 3", "Multivitamin");
    } else if (categoryInfo.name.includes("Thừa cân") || categoryInfo.name.includes("Béo phì")) {
      result.push("Whey Isolate", "L-Carnitine", "Omega 3");
    }

    Object.keys(SYMPTOM_RULES).forEach((key) => {
      if (text.includes(key)) {
        result.push(...SYMPTOM_RULES[key]);
      }
    });

    setSuggestions([...new Set(result)]);
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
        <div className="bg-[#14213D] text-white rounded-3xl p-6 md:p-8 shadow-xl border border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">HEALTH & BMI EVALUATOR</h1>
            <p className="text-sm text-gray-300 mt-1 max-w-xl">
              Đánh giá chỉ số khối cơ thể chuẩn xác, phân tích thể trạng và nhận lộ trình bổ sung thực phẩm thông minh.
            </p>
          </div>
        </div>

        {/* INPUT CARDS AREA */}
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-lg border border-gray-200">
          <h2 className="text-lg font-bold text-[#14213D] mb-4 flex items-center gap-2">
            <FaHeartbeat className="text-[#FCA311]" /> Nhập thông tin chỉ số
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            {/* Height Input Card */}
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
                  placeholder="Nhập chiều cao..."
                  value={height}
                  onChange={handleHeightChange}
                  className="w-full bg-transparent text-xl font-black text-[#14213D] focus:outline-none placeholder:text-gray-300 placeholder:font-normal"
                />
              </div>
            </div>

            {/* Weight Input Card */}
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
                  placeholder="Nhập cân nặng..."
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
              {/* BMI Big Stat */}
              <div className="bg-white/5 p-6 rounded-2xl border border-white/10 text-center">
                <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">Chỉ số BMI</span>
                <div className="text-5xl font-black text-[#FCA311] my-1">{bmi}</div>
                <span className={`text-xs font-bold ${categoryInfo.color}`}>
                  Phân loại: {categoryInfo.name}
                </span>
              </div>

              {/* Status Gauge Meter */}
              <div className="md:col-span-2 space-y-3 bg-white/5 p-6 rounded-2xl border border-white/10">
                <div className="flex justify-between text-xs font-bold text-gray-300">
                  <span>Gầy (&lt;18.5)</span>
                  <span>Chuẩn (18.5-24.9)</span>
                  <span>Thừa cân (25-29.9)</span>
                  <span>Béo phì (&ge;30)</span>
                </div>

                {/* Status Bar */}
                <div className="relative w-full h-4 bg-gray-700 rounded-full overflow-hidden flex">
                  {/* Gầy: 20% */}
                  <div className="w-[20%] bg-blue-500 h-full"></div>
                  {/* Chuẩn: 30% */}
                  <div className="w-[30%] bg-emerald-500 h-full"></div>
                  {/* Thừa cân: 25% */}
                  <div className="w-[25%] bg-amber-500 h-full"></div>
                  {/* Béo phì: 25% */}
                  <div className="w-[25%] bg-red-500 h-full"></div>

                  {/* Pointer */}
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

        {/* PERSONAL ASSESSMENT (TÌNH TRẠNG SỨC KHỎE) */}
        {bmi && (
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-lg border border-gray-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#14213D] text-[#FCA311] rounded-xl">
                <FaNotesMedical className="text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#14213D]">Khu Vực Đánh Giá Cá Nhân</h3>
                <p className="text-xs text-gray-500">
                  Mô tả các vấn đề sức khỏe hoặc triệu chứng bạn đang gặp phải (VD: mất ngủ, đau khớp, mệt mỏi...)
                </p>
              </div>
            </div>

            {/* Quick Tag Selector */}
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
              placeholder="Nhập tình trạng chi tiết...)"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FCA311] focus:bg-white text-sm text-[#14213D] placeholder:text-gray-400 transition"
            />

            <button
              onClick={generateSuggestions}
              className="w-full bg-[#14213D] text-white py-3.5 rounded-2xl font-bold text-sm uppercase tracking-wider hover:bg-[#1f3157] transition cursor-pointer flex items-center justify-center gap-2"
            >
              <FaSearch /> Phân Tích & Đề Xuất Sản Phẩm
            </button>
          </div>
        )}

        {/* SMART PRODUCT SUGGESTIONS */}
        {bmi && suggestions.length > 0 && (
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-lg border border-gray-200 space-y-6">
            <div className="flex justify-between items-end border-b pb-4">
              <div>
                <span className="text-xs font-bold text-[#FCA311] uppercase tracking-wider">GymBro AI Recommends</span>
                <h3 className="text-xl font-black text-[#14213D]">HỆ THỐNG SẢN PHẨM ĐỀ XUẤT</h3>
              </div>
              <span className="text-xs text-gray-500 font-medium">{suggestions.length} sản phẩm phù hợp</span>
            </div>

            {/* Product Cards Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {suggestions.map((item) => {
                const info = PRODUCT_DETAILS[item] || DEFAULT_PRODUCT;
                return (
                  <div
                    key={item}
                    className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Card Image Header */}
                      <div className="relative h-44 overflow-hidden bg-gray-100">
                        <img
                          src={info.image}
                          alt={item}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                        <span
                          className={`absolute top-3 left-3 text-[10px] font-black uppercase text-white px-2.5 py-1 rounded-md shadow ${info.tagColor}`}
                        >
                          {info.badge}
                        </span>
                      </div>

                      {/* Card Content */}
                      <div className="p-4 space-y-2">
                        <div className="flex items-center gap-1 text-amber-400 text-xs">
                          <FaStar /><FaStar /><FaStar /><FaStar /><FaStar />
                          <span className="text-gray-400 text-[10px] ml-1">(4.9)</span>
                        </div>
                        <h4 className="font-black text-base text-[#14213D] group-hover:text-[#FCA311] transition">
                          {item}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                          {info.desc}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="p-4 pt-0 space-y-3">
                      <div className="text-sm font-black text-[#14213D]">
                        {info.price}
                      </div>
                      <button className="w-full bg-[#14213D] group-hover:bg-[#FCA311] text-white group-hover:text-[#14213D] py-2.5 rounded-xl text-xs font-bold transition duration-200 flex items-center justify-center gap-2 cursor-pointer">
                        <FaShoppingCart /> Thêm Vào Giỏ Hàng
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center gap-3">
              <FaCheckCircle className="text-emerald-500 text-lg flex-shrink-0" />
              <p className="text-xs text-gray-500 leading-relaxed">
                Đề xuất dựa trên dữ liệu BMI và từ khóa tình trạng sức khỏe cá nhân. Vui lòng tham khảo ý kiến chuyên gia dinh dưỡng hoặc bác sĩ nếu bạn đang điều trị bệnh lý.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// Icon Máy tính đơn giản bằng SVG
function FaCalculatorIcon() {
  return (
    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
      <path d="M19 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 16H7v-2h10v2zm0-4H7v-2h10v2zm0-4H7V6h10v4z" />
    </svg>
  );
}