import axios from "axios";

const API_URL = "http://localhost:5000/api/activities";

export const fetchActivities = async () => {
  try {
    const response = await axios.get(API_URL);
    if (response.data && response.data.success) {
      return response.data.activities;
    }
    return [];
  } catch (error) {
    console.error("Lỗi khi tải lịch sử hoạt động:", error);
    return [];
  }
};

// Hàm phụ trợ bóc tách tên đối tượng thông minh hơn, tránh hiển thị thô ID
const extractName = (str) => {
  if (!str) return "";
  let clean = String(str).trim();

  // Nếu chuỗi chứa dấu ngoặc kép, ưu tiên lấy phần bên trong ngoặc kép
  const match = clean.match(/"([^"]+)"/);
  if (match && match[1]) {
    return match[1];
  }

  // Nếu truyền vào chỉ là một chuỗi số hoặc dạng ID (VD: "16" hoặc "ID: 16")
  if (/^(id\s*[:#]?)?\s*\d+$/i.test(clean)) {
    return `ID: ${clean.replace(/\D/g, "")}`;
  }

  // Loại bỏ các từ khóa thừa ở đầu nếu có
  clean = clean
    .replace(/^(Xóa|Thêm|Cập nhật thông tin|Cập nhật)\s+(sản phẩm|thương hiệu|danh mục|nhu cầu|mới)?\s*/i, "")
    .trim();
    
  return clean || str;
};

export const logActivityToDB = async (actionType, targetName, details = "") => {
  try {
    let title = "";
    let description = "";
    let iconType = "package";

    const invalidValues = ["danger", "info", "success", "warning", "primary", "secondary"];
    let rawTarget = invalidValues.includes(targetName) ? "" : targetName;
    let rawDetails = invalidValues.includes(details) ? "" : details;

    const nameVal = extractName(rawDetails || rawTarget);

    switch (actionType) {
      case "ADD_PRODUCT":
      case "Thêm sản phẩm":
        title = "Thêm sản phẩm";
        description = `Thêm sản phẩm "${nameVal}"`;
        iconType = "package";
        break;
      case "UPDATE_PRODUCT":
      case "Cập nhật sản phẩm":
        title = "Cập nhật sản phẩm";
        description = `Cập nhật thông tin sản phẩm "${nameVal}"`;
        iconType = "pencil";
        break;
      case "DELETE_PRODUCT":
      case "Xóa sản phẩm":
        title = "Xóa sản phẩm";
        description = `Xóa sản phẩm "${nameVal}"`;
        iconType = "trash";
        break;

      case "ADD_BRAND":
      case "Tạo thương hiệu mới":
        title = "Tạo thương hiệu mới";
        description = `Thêm thương hiệu "${nameVal}"`;
        iconType = "tag";
        break;
      case "UPDATE_BRAND":
      case "Cập nhật thương hiệu":
        title = "Cập nhật thương hiệu";
        description = `Cập nhật thương hiệu "${nameVal}"`;
        iconType = "pencil";
        break;
      case "DELETE_BRAND":
      case "Xóa thương hiệu":
        title = "Xóa thương hiệu";
        description = `Xóa thương hiệu "${nameVal}"`;
        iconType = "trash";
        break;

      case "ADD_CATEGORY":
      case "Tạo danh mục mới":
        title = "Tạo danh mục mới";
        description = `Thêm danh mục "${nameVal}"`;
        iconType = "layers";
        break;
      case "UPDATE_CATEGORY":
      case "Cập nhật danh mục":
        title = "Cập nhật danh mục";
        description = `Cập nhật thông tin danh mục "${nameVal}"`;
        iconType = "pencil";
        break;
      case "DELETE_CATEGORY":
      case "Xóa danh mục":
        title = "Xóa danh mục";
        description = `Xóa danh mục "${nameVal}"`;
        iconType = "trash";
        break;

      case "ADD_GOAL":
      case "Tạo nhu cầu mới":
        title = "Tạo nhu cầu mới";
        description = `Thêm nhu cầu "${nameVal}"`;
        iconType = "layers";
        break;
      case "UPDATE_GOAL":
      case "Cập nhật nhu cầu":
        title = "Cập nhật nhu cầu";
        description = `Cập nhật thông tin nhu cầu "${nameVal}"`;
        iconType = "pencil";
        break;
      case "DELETE_GOAL":
      case "Xóa nhu cầu":
        title = "Xóa nhu cầu";
        description = `Xóa nhu cầu "${nameVal}"`;
        iconType = "trash";
        break;

      case "UPDATE_CUSTOMER":
      case "Cập nhật khách hàng":
        title = "Cập nhật khách hàng";
        description = rawDetails || rawTarget;
        iconType = "pencil";
        break;

      case "TOGGLE_CUSTOMER_STATUS":
      case "Khóa/Mở khóa khách hàng":
        title = "Thay đổi trạng thái khách hàng";
        description = `Cập nhật trạng thái tài khoản: ${nameVal}`;
        iconType = "pencil";
        break;

      case "UPDATE_ORDER":
      case "Cập nhật đơn hàng":    
        title = "Cập nhật đơn hàng";
        description = rawDetails || rawTarget;
        iconType = "pencil";
        break;
      case "DELETE_ORDER":
      case "Xóa đơn hàng":
        title = "Xóa đơn hàng";
        description = rawDetails || rawTarget;
        iconType = "trash";
        break;

      case "LOGIN":
      case "Đăng nhập hệ thống":
        title = "Đăng nhập hệ thống";
        description = rawTarget || "Admin đăng nhập thành công";
        iconType = "login";
        break;
      case "LOGOUT":
      case "Đăng xuất hệ thống":
        title = "Đăng xuất hệ thống";
        description = rawTarget || "Admin đã đăng xuất khỏi hệ thống";
        iconType = "login";
        break;

      default:
        title = actionType;
        description = rawDetails || rawTarget || "Thực hiện thao tác hệ thống";
    }

    const storedUser = JSON.parse(localStorage.getItem("admin_user")) || {};
    const adminId = storedUser.adminId || 1;

    await axios.post(API_URL, {
      adminId,
      title,
      description,
      iconType,
    });
  } catch (error) {
    console.error("Lỗi ghi log hoạt động vào DB:", error);
  }
};