import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth(); 

  // Nếu AuthContext đang trong quá trình load thông tin (F5 trang)
  if (loading) {
    return <div className="text-center py-20 text-gray-500 font-medium">Đang tải xác thực...</div>;
  }

  // 1. Nếu chưa đăng nhập -> đá về trang /login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Nếu route yêu cầu quyền Admin (adminOnly = true) mà user không phải Admin -> đá về trang chủ /
  if (adminOnly && user.role !== 'Admin') {
    return <Navigate to="/" replace />;
  }

  // 3. Đạt tất cả điều kiện -> cho phép vào trang
  return children;
}