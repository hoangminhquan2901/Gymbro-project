import { logActivity } from "../utils/activityLogger";

const API_URL = "http://localhost:5000/api/goals"; // Đổi port theo cấu hình server của bạn

function dispatchChange() {
  window.dispatchEvent(new Event("goalsChanged"));
}

// 1. Lấy toàn bộ danh sách mục tiêu
export async function getAllGoals() {
  try {
    const response = await fetch(API_URL);
    const result = await response.json();

    if (!result.success) throw new Error(result.message);

    // Map dữ liệu từ MySQL (PascalCase) sang định dạng Frontend (camelCase)
    return result.data.map((item) => ({
      id: item.GoalID,
      name: item.Name,
      slug: item.Slug,
      description: item.Description,
      image: item.Image,
      createdAt: item.CreatedAt,     // ✅ Đã bổ sung
      updatedAt: item.UpdatedAt,     // ✅ Đã bổ sung
    }));
  } catch (error) {
    console.error("Lỗi khi tải danh sách mục tiêu từ API:", error);
    return [];
  }
}

// 2. Thêm mới mục tiêu
export async function addGoal(goal) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Name: goal.name,
        Slug: goal.slug,
        Description: goal.description,
        Image: goal.image,
      }),
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.message);

    logActivity("Tạo nhu cầu mới", `Thêm nhu cầu "${goal.name}"`, "success");
    dispatchChange();
    return result;
  } catch (error) {
    console.error("Lỗi khi thêm mục tiêu:", error);
    alert(error.message || "Không thể thêm mục tiêu!");
    throw error;
  }
}

// 3. Cập nhật mục tiêu theo ID
export async function updateGoal(id, newData) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Name: newData.name,
        Slug: newData.slug,
        Description: newData.description,
        Image: newData.image,
      }),
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.message);

    logActivity("Cập nhật nhu cầu", `Cập nhật thông tin nhu cầu ID: ${id}`, "info");
    dispatchChange();
    return result;
  } catch (error) {
    console.error("Lỗi khi cập nhật mục tiêu:", error);
    alert(error.message || "Không thể cập nhật mục tiêu!");
    throw error;
  }
}

// 4. Xóa mục tiêu theo ID
export async function deleteGoal(id, goalName = "") {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    const result = await response.json();
    if (!result.success) throw new Error(result.message);

    logActivity("Xóa nhu cầu", `Xóa nhu cầu "${goalName || id}"`, "danger");
    dispatchChange();
    return result;
  } catch (error) {
    console.error("Lỗi khi xóa mục tiêu:", error);
    alert(error.message || "Không thể xóa mục tiêu!");
    throw error;
  }
}

// 5. Tìm mục tiêu bằng slug
export async function getGoalBySlug(slug) {
  const goals = await getAllGoals();
  return goals.find((item) => item.slug === slug);
}