// src/utils/activityLogger.js
import { logActivityToDB } from "../services/activityService";

export const logActivity = (actionType, targetName, details = "") => {
  // Gọi hàm bất đồng bộ lưu trực tiếp vào cơ sở dữ liệu MySQL
  logActivityToDB(actionType, targetName, details);
};