import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 

export default function ProtectedRoute({ children }) {
  const { user } = useAuth(); 

  // Nếu có user (đã đăng nhập thật) thì cho qua, ngược lại đá về /login
  return user ? children : <Navigate to="/login" replace />;
}