// src/utils/activityLogger.js
import { LogIn, Package, Pencil, Tag, Trash2, ShoppingBag, Users, Layers } from "lucide-react";
import React from "react";

export const logActivity = (actionType, targetName, details = "") => {
  try {
    const existingLogs = JSON.parse(localStorage.getItem("admin_activities")) || [];
    
    let title = "";
    let description = details || targetName;
    let iconType = "package";

    switch (actionType) {
      case "ADD_PRODUCT":
        title = "Thêm sản phẩm";
        iconType = "package"; // Xanh lá
        break;
      case "UPDATE_PRODUCT":
        title = "Cập nhật sản phẩm";
        description = `Cập nhật thông tin sản phẩm ${targetName}`;
        iconType = "pencil"; // Xanh da trời
        break;
      case "DELETE_PRODUCT":
        title = "Xóa sản phẩm";
        description = `Xóa sản phẩm ${targetName}`;
        iconType = "trash"; // Đỏ
        break;
      case "ADD_BRAND":
        title = "Tạo thương hiệu mới";
        description = `Thêm thương hiệu ${targetName}`;
        iconType = "tag"; // Xanh lá
        break;
      case "UPDATE_BRAND":
        title = "Cập nhật thương hiệu";
        description = `Cập nhật thương hiệu ${targetName}`;
        iconType = "pencil"; // Xanh da trời
        break;
      case "DELETE_BRAND":
        title = "Xóa thương hiệu";
        description = `Xóa thương hiệu ${targetName}`;
        iconType = "trash"; // Đỏ
        break;
      case "ADD_CATEGORY":
      case "Tạo danh mục mới":
        title = "Tạo danh mục mới";
        description = `Thêm danh mục ${targetName}`;
        iconType = "layers"; // Xanh lá
        break;
      case "UPDATE_CATEGORY":
      case "Cập nhật danh mục":
        title = "Cập nhật danh mục";
        description = `Cập nhật thông tin danh mục ${targetName}`;
        iconType = "pencil"; // Xanh da trời
        break;
      case "DELETE_CATEGORY":
      case "Xóa danh mục":
        title = "Xóa danh mục";
        description = `Xóa danh mục ${targetName}`;
        iconType = "trash"; // Đỏ
        break;
        case "ADD_GOAL":
      case "Tạo nhu cầu mới":
        title = "Tạo nhu cầu mới";
        description = targetName;
        iconType = "layers"; // Xanh lá
        break;
      case "UPDATE_GOAL":
      case "Cập nhật nhu cầu":
        title = "Cập nhật nhu cầu";
        description = targetName;
        iconType = "pencil"; // Xanh da trời
        break;
      case "DELETE_GOAL":
      case "Xóa nhu cầu":
        title = "Xóa nhu cầu";
        description = targetName;
        iconType = "trash"; // Đỏ
        break;
        case "UPDATE_CUSTOMER":
        title = "Cập nhật khách hàng";
        description = targetName; // Nhận trực tiếp chuỗi chi tiết đã định dạng sẵn
        iconType = "pencil"; // Icon bút chì (xanh da trời)
        break;
        case "UPDATE_ORDER":
        case "Cập nhật đơn hàng":    
        title = "Cập nhật đơn hàng";
        description = targetName;
        iconType = "pencil"; // Xanh da trời
        break;
      case "DELETE_ORDER":
        case "Xóa đơn hàng":
        title = "Xóa đơn hàng";
        description = targetName;
        iconType = "trash"; // Đỏ
        break;
      case "LOGIN":
        title = "Đăng nhập hệ thống";
        description = targetName || "Đăng nhập bằng tài khoản Admin";
        iconType = "login";
        break;
      default:
        title = actionType;
        description = targetName;
    }

    const now = new Date();
    const formattedTime = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newLog = {
      id: Date.now(),
      title,
      description,
      time: formattedTime,
      iconType,
    };

    const updatedLogs = [newLog, ...existingLogs];
    localStorage.setItem("admin_activities", JSON.stringify(updatedLogs));
  } catch (error) {
    console.error("Lỗi ghi log hoạt động:", error);
  }
};