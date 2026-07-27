import React, { useState, useEffect } from "react";
import {
  FaFire,
  FaWeightHanging,
  FaRulerVertical,
  FaUser,
  FaRunning,
  FaChartPie,
  FaBullseye,
} from "react-icons/fa";

const TDEECalculator = () => {
  // ================= STATE & LOGIC =================
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");

  const [gender, setGender] = useState("null");
  const [activity, setActivity] = useState(null);
  const [goal, setGoal] = useState("null");

  const [results, setResults] = useState({
    bmr: 0,
    tdee: 0,
    neat: 0,
    tef: 0,
    eat: 0,
  });

  const [macro, setMacro] = useState({
    calories: 0,
    protein: 0,
    fat: 0,
    carb: 0,
  });

  // Hệ số vận động (R)
  const activityLevels = [
    { label: "Ít vận động", desc: "Công việc văn phòng, ít đi lại.", multiplier: 1.2 },
    { label: "Vận động nhẹ", desc: "Tập thể dục nhẹ 1-3 ngày/tuần.", multiplier: 1.375 },
    { label: "Vận động vừa phải", desc: "Tập thể dục vừa phải 3-5 ngày/tuần.", multiplier: 1.55 },
    { label: "Tích cực vận động", desc: "Tập luyện 6-7 ngày/tuần.", multiplier: 1.725 },
    { label: "Cực kỳ năng động", desc: "Vận động viên chuyên nghiệp.", multiplier: 1.9 },
  ];

  useEffect(() => {
    if (!weight || !height || !age || !activity) return;

    const w = Number(weight);
    const h = Number(height);
    const a = Number(age);

    // Công thức Mifflin-St Jeor cho BMR
    let bmrVal =
      gender === "male"
        ? 10 * w + 6.25 * h - 5 * a + 5
        : 10 * w + 6.25 * h - 5 * a - 161;

    // TDEE = BMR * R
    const tdeeVal = bmrVal * activity;

    setResults({
      bmr: Math.round(tdeeVal * 0.65), // BMR chiếm 65% TDEE
      tdee: Math.round(tdeeVal),
      neat: Math.round(tdeeVal * 0.20), // NEAT chiếm 20% TDEE
      tef: Math.round(tdeeVal * 0.10),  // TEF chiếm 10% TDEE
      eat: Math.round(tdeeVal * 0.05),  // EAT chiếm 5% TDEE
    });
  }, [weight, height, age, gender, activity]);

  useEffect(() => {
    if (!results.tdee || !weight) return;

    const w = Number(weight);
    let calories = 0;
    let proteinGrams = 0;
    let fatGrams = 0;
    let carbGrams = 0;

    if (goal === "cutting") {
      calories = results.tdee - 500;
      proteinGrams = w * 1.8;
      const proteinCalories = proteinGrams * 4;
      const fatCalories = calories * 0.3;
      fatGrams = fatCalories / 9;
      const remainingCalories = Math.max(0, calories - (proteinCalories + fatCalories));
      carbGrams = remainingCalories / 4;
    }

    if (goal === "maintain") {
      calories = results.tdee;
      // Protein = Cân nặng x 2 (g)
      proteinGrams = w * 2;
      
      // Calo còn lại chia đều cho Fat (9 kcal/g) và Carb (4 kcal/g)
      const proteinCalories = proteinGrams * 4;
      const remainingCalories = Math.max(0, calories - proteinCalories);
      
      fatGrams = (remainingCalories / 2) / 9;
      carbGrams = (remainingCalories / 2) / 4;
    }

    if (goal === "bulking") {
      calories = results.tdee + 300;
      // Protein = Cân nặng x 2.2 (g)
      proteinGrams = w * 2.2;
      
      // Calo còn lại chia đều cho Fat (9 kcal/g) và Carb (4 kcal/g)
      const proteinCalories = proteinGrams * 4;
      const remainingCalories = Math.max(0, calories - proteinCalories);
      
      fatGrams = (remainingCalories / 2) / 9;
      carbGrams = (remainingCalories / 2) / 4;
    }

    setMacro({
      calories: Math.round(calories),
      protein: Math.round(proteinGrams),
      fat: Math.round(fatGrams),
      carb: Math.round(carbGrams),
    });
  }, [goal, results.tdee, weight]);

  const isReady = weight && height && age;

  const totalMacro = macro.calories || 1;
  const proteinPct = Math.round(((macro.protein * 4) / totalMacro) * 100) || 0;
  const fatPct = Math.round(((macro.fat * 9) / totalMacro) * 100) || 0;
  const carbPct = Math.round(((macro.carb * 4) / totalMacro) * 100) || 0;

  // ================= GIAO DIỆN PRECISION COMMERCE =================
  return (
    <div className="min-h-screen bg-[#E5E5E5] font-sans text-[#14213D] p-4 md:p-8 flex items-center justify-center">
      <div className="max-w-5xl w-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-0">
        
        {/* BÊN TRÁI: NHẬP LIỆU (SPLIT-SCREEN LEFT) */}
        <div className="p-6 md:p-8 space-y-5">
          <div className="flex items-center gap-3">
            <FaFire className="text-[#FCA311] text-3xl" />
            <div>
              <h1 className="text-2xl font-black tracking-tight text-[#14213D]">
                CÔNG CỤ TÍNH TDEE + MACRO
              </h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Thiết lập chỉ số năng lượng tiêu hao chuẩn xác
              </p>
            </div>
          </div>

          <p className="text-xs text-gray-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200">
            <strong>TDEE (Total Daily Energy Expenditure)</strong> là tổng năng lượng cơ thể tiêu hao mỗi ngày, bao gồm BMR (65%), NEAT (20%), TEF (10%) và EAT (5%).
          </p>

          {/* Ô Nhập Cân Nặng, Chiều Cao, Tuổi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-700 mb-1 block">Cân nặng (kg)</label>
              <div className="relative flex items-center">
                <FaWeightHanging className="absolute left-3 text-gray-400 text-xs" />
                <input
                  type="number"
                  placeholder="kg"
                  className="w-full pl-8 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-semibold focus:border-[#14213D] focus:ring-1 focus:ring-[#14213D] outline-none transition"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 mb-1 block">Chiều cao (cm)</label>
              <div className="relative flex items-center">
                <FaRulerVertical className="absolute left-3 text-gray-400 text-xs" />
                <input
                  type="number"
                  placeholder="cm"
                  className="w-full pl-8 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-semibold focus:border-[#14213D] focus:ring-1 focus:ring-[#14213D] outline-none transition"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 mb-1 block">Tuổi</label>
              <div className="relative flex items-center">
                <FaUser className="absolute left-3 text-gray-400 text-xs" />
                <input
                  type="number"
                  placeholder="tuổi"
                  className="w-full pl-8 pr-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-semibold focus:border-[#14213D] focus:ring-1 focus:ring-[#14213D] outline-none transition"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Chọn Giới Tính */}
          <div>
            <label className="text-xs font-bold text-gray-700 mb-1.5 block">Giới tính</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setGender("male")}
                className={`flex-1 py-2.5 px-3 rounded-lg font-bold text-xs transition-all duration-200 border cursor-pointer ${
                  gender === "male"
                    ? "bg-[#14213D] text-[#FCA311] border-[#14213D] shadow-sm"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                Nam
              </button>

              <button
                type="button"
                onClick={() => setGender("female")}
                className={`flex-1 py-2.5 px-3 rounded-lg font-bold text-xs transition-all duration-200 border cursor-pointer ${
                  gender === "female"
                    ? "bg-[#14213D] text-[#FCA311] border-[#14213D] shadow-sm"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                Nữ
              </button>
            </div>
          </div>

          {/* Chọn Mức Độ Vận Động (Cards) */}
          <div className="space-y-2">
            <h3 className="font-bold text-xs text-gray-700 flex items-center gap-1.5 uppercase tracking-wider">
              <FaRunning className="text-[#FCA311]" /> Mức độ vận động (R)
            </h3>

            <div className="space-y-2">
              {activityLevels.map((lvl) => {
                const isActive = activity === lvl.multiplier;
                return (
                  <div
                    key={lvl.multiplier}
                    onClick={() => setActivity(lvl.multiplier)}
                    className={`p-3 border rounded-lg cursor-pointer transition-all duration-200 flex items-center justify-between ${
                      isActive
                        ? "bg-[#14213D] text-white border-[#14213D] shadow-md"
                        : "bg-white text-gray-800 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div>
                      <div className="font-bold text-sm">{lvl.label}</div>
                      <div className={`text-xs ${isActive ? "text-gray-300" : "text-gray-500"}`}>
                        {lvl.desc}
                      </div>
                    </div>
                    <span className={`text-xs font-black px-2 py-1 rounded-md ${
                      isActive ? "bg-[#FCA311] text-[#14213D]" : "bg-gray-100 text-gray-600"
                    }`}>
                      x{lvl.multiplier}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* BÊN PHẢI: KẾT QUẢ (SPLIT-SCREEN RIGHT) */}
        <div className="bg-[#14213D] text-white p-6 md:p-8 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-gray-800">
          <div>
            <h2 className="text-sm font-bold tracking-wider uppercase text-gray-300 border-b border-gray-700 pb-3 mb-4 flex items-center justify-between">
              <span>KẾT QUẢ TDEE</span>
            </h2>

            {!isReady || !activity ? (
              <div className="py-16 text-center text-gray-400 space-y-2">
                <FaBullseye className="mx-auto text-3xl text-gray-600 mb-2" />
                <p className="text-sm font-medium">Vui lòng nhập đầy đủ thông tin</p>
                <p className="text-xs text-gray-500">Cân nặng, Chiều cao, Tuổi và Mức vận động</p>
              </div>
            ) : (
              <div className="space-y-5">
                
                {/* TDEE Nổi Bật Kích Thước Cực Lớn */}
                <div className="text-center bg-white/5 border border-white/10 p-4 rounded-lg">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest block mb-1">
                    Tổng Calo Tiêu Tốn / Ngày
                  </span>
                  <div className="text-5xl font-black text-[#FCA311] tracking-tight">
                    {results.tdee.toLocaleString()} <span className="text-base text-white font-normal">kcal</span>
                  </div>
                </div>

                {/* Bảng Chi Tiết Chỉ Số Component */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white/5 p-2.5 rounded-lg border border-white/5">
                    <span className="text-gray-400 block text-[11px]">BMR (Cơ bản - 65%)</span>
                    <span className="font-bold text-white">{results.bmr} kcal</span>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-lg border border-white/5">
                    <span className="text-gray-400 block text-[11px]">NEAT (Sinh hoạt - 20%)</span>
                    <span className="font-bold text-white">{results.neat} kcal</span>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-lg border border-white/5">
                    <span className="text-gray-400 block text-[11px]">TEF (Tiêu hóa - 10%)</span>
                    <span className="font-bold text-white">{results.tef} kcal</span>
                  </div>
                  <div className="bg-white/5 p-2.5 rounded-lg border border-white/5">
                    <span className="text-gray-400 block text-[11px]">EAT (Tập luyện - 5%)</span>
                    <span className="font-bold text-white">{results.eat} kcal</span>
                  </div>
                </div>

                {/* Tương Tác Mục Tiêu (Goal Selection) */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-[#FCA311] uppercase tracking-wider">
                    Mục tiêu luyện tập
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setGoal("cutting")}
                      className={`flex-1 py-2.5 rounded-lg font-bold text-xs transition-all duration-200 border cursor-pointer ${
                        goal === "cutting"
                          ? "bg-red-500 text-white border-red-400 scale-105 shadow-md shadow-red-500/30"
                          : "bg-white/10 text-gray-300 border-white/10 hover:bg-white/20"
                      }`}
                    >
                      Cutting
                    </button>

                    <button
                      type="button"
                      onClick={() => setGoal("maintain")}
                      className={`flex-1 py-2.5 rounded-lg font-bold text-xs transition-all duration-200 border cursor-pointer ${
                        goal === "maintain"
                          ? "bg-[#FCA311] text-[#14213D] border-[#FCA311] scale-105 shadow-md shadow-[#FCA311]/30"
                          : "bg-white/10 text-gray-300 border-white/10 hover:bg-white/20"
                      }`}
                    >
                      Maintain
                    </button>

                    <button
                      type="button"
                      onClick={() => setGoal("bulking")}
                      className={`flex-1 py-2.5 rounded-lg font-bold text-xs transition-all duration-200 border cursor-pointer ${
                        goal === "bulking"
                          ? "bg-green-500 text-white border-green-400 scale-105 shadow-md shadow-green-500/30"
                          : "bg-white/10 text-gray-300 border-white/10 hover:bg-white/20"
                      }`}
                    >
                      Bulking
                    </button>
                  </div>
                </div>

                {/* Trực Quan Hóa Dữ Liệu Macro */}
                <div className="bg-white text-[#14213D] p-4 rounded-lg shadow-md space-y-3">
                  <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-bold text-xs flex items-center gap-1.5 uppercase tracking-wide">
                      <FaChartPie className="text-[#14213D]" /> Macro dinh dưỡng
                    </h3>
                    <span className="text-sm font-black text-[#14213D]">
                      {macro.calories} <span className="text-xs font-normal text-gray-500">kcal</span>
                    </span>
                  </div>

                  {/* Thanh Biểu Đồ Tỉ Lệ Macro */}
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
                    <div style={{ width: `${proteinPct}%` }} className="bg-blue-500 h-full" />
                    <div style={{ width: `${fatPct}%` }} className="bg-amber-500 h-full" />
                    <div style={{ width: `${carbPct}%` }} className="bg-emerald-500 h-full" />
                  </div>

                  {/* Chi Tiết Con Số & Tỉ Lệ */}
                  <div className="grid grid-cols-3 gap-2 text-center pt-1">
                    <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                      <div className="text-[10px] font-bold text-blue-600 uppercase">Protein</div>
                      <div className="text-sm font-black">{macro.protein}g</div>
                      <div className="text-[10px] text-gray-500">{proteinPct}%</div>
                    </div>

                    <div className="bg-amber-50 p-2 rounded-lg border border-amber-100">
                      <div className="text-[10px] font-bold text-amber-600 uppercase">Fat</div>
                      <div className="text-sm font-black">{macro.fat}g</div>
                      <div className="text-[10px] text-gray-500">{fatPct}%</div>
                    </div>

                    <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                      <div className="text-[10px] font-bold text-emerald-600 uppercase">Carb</div>
                      <div className="text-sm font-black">{macro.carb}g</div>
                      <div className="text-[10px] text-gray-500">{carbPct}%</div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default TDEECalculator;