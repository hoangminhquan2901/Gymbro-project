const { GoogleGenerativeAI } = require("@google/generative-ai");
const db = require("../config/db");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

exports.recommendProductsWithAI = async (req, res) => {
  try {
    const { bmi, condition } = req.body;

    // Phân loại nhóm BMI đơn giản để đưa vào prompt
    let bmiStatus = "Bình thường";
    if (bmi) {
      const numBmi = Number(bmi);
      if (numBmi < 18.5) bmiStatus = "Thiếu cân";
      else if (numBmi >= 25 && numBmi < 30) bmiStatus = "Thừa cân";
      else if (numBmi >= 30) bmiStatus = "Béo phì";
    }

    let selectedGoalIds = [];
    let advice = "Dựa trên thể trạng và triệu chứng của bạn, hệ thống đề xuất các danh mục sản phẩm phù hợp để bạn tự tìm mua.";

    // Bước 1: Gọi AI trực tiếp để Mapping ra mảng GoalID từ 10 Goals cố định
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        generationConfig: { responseMimeType: "application/json" },
      });

      const prompt = `
Bạn là chuyên gia dinh dưỡng. Hệ thống của tôi có các mục tiêu sức khỏe (Goals) sau: 
[1: Tăng Cơ, 2: Giảm mỡ, 3: Hỗ trợ xương khớp, 4: Tăng cân, 5: Da, Tóc & Móng, 6: Bảo vệ gan, 7: Hỗ trợ giấc ngủ, 8: Hỗ trợ tim mạch, 9: Kiểm soát đường huyết, 10: Chống lão hóa].

Người dùng có chỉ số BMI thuộc nhóm: "${bmiStatus}".
Người dùng gặp các triệu chứng: "${condition || "Không có triệu chứng cụ thể"}".

Hãy phân tích và chọn ra các GoalID phù hợp nhất (Tối đa 3 ID). Trả về kết quả theo định dạng JSON duy nhất như sau:
{"selected_goal_ids": [3, 7]}
`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const aiResult = JSON.parse(responseText.replace(/```json|```/g, "").trim());

      if (aiResult && Array.isArray(aiResult.selected_goal_ids)) {
        selectedGoalIds = aiResult.selected_goal_ids;
      }
    } catch (aiError) {
      console.warn("⚠️ API AI bên ngoài gián đoạn (429/Quota), chuyển sang Fallback GoalID mặc định.");
      // Fallback an toàn khi hết quota/lỗi mạng
      selectedGoalIds = [1, 7];
    }

    if (!selectedGoalIds || selectedGoalIds.length === 0) {
      selectedGoalIds = [1];
    }

    // Bước 2: Thực hiện câu lệnh SQL truy vấn bắc cầu (Bridge Query) lấy danh mục con (SubCategories)
    const bridgeQuery = `
      SELECT DISTINCT c.CategoryID, c.Name AS SubCategoryName, c.Slug
      FROM Categories c
      JOIN Products p ON c.CategoryID = p.SubCategoryID
      JOIN ProductGoals pg ON p.ProductID = pg.ProductID
      WHERE pg.GoalID IN (?)
        AND p.status = 1
    `;
    const [subCategories] = await db.query(bridgeQuery, [selectedGoalIds]);

    // Bước 3: Trả kết quả gọn nhẹ về Frontend hiển thị
    return res.status(200).json({
      success: true,
      advice,
      selected_goal_ids: selectedGoalIds,
      subCategories: subCategories,
    });

  } catch (error) {
    console.error("Lỗi hệ thống:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};