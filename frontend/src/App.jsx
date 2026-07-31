import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import { CartProvider } from "./context/CartContext";
import { AuthProvider } from "./context/AuthContext";

import Header from "./components/Header";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Category from "./pages/Category";
import ProductList from "./pages/ProductList";
import ProductDetail from "./pages/ProductDetail";
import BMI from "./pages/BMI";
import TDEE from "./pages/TDEE";
import Cart from "./pages/Cart";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SupplementCategory from "./pages/SupplementCategory";
import GoalSupplementCategory from "./pages/GoalSupplementCategory";
import GoalCategory from "./pages/GoalCategory";
import Brands from "./pages/Brands";
import BrandDetail from "./pages/BrandDetail";
import Checkout from "./pages/Checkout";

import ProfileInfo from "./pages/profile/ProfileInfo";
import Orders from "./pages/profile/Orders";
import Password from "./pages/profile/Password";

import ProtectedRoute from "./components/ProtectedRoute";

/* ===========================
        ADMIN IMPORT
=========================== */

import AdminLayout from "./pages/Admin/AdminLayout";

import Dashboard from "./pages/Admin/Dashboard";
import Statistics from "./pages/Admin/Statistics";
import Categories from "./pages/Admin/Categories";
import Goals from "./pages/Admin/Goals";
import AdminBrands from "./pages/Admin/Brands";
import ManageProducts from "./pages/Admin/ManageProducts";
import OrdersAdmin from "./pages/Admin/Orders";
import Customers from "./pages/Admin/Customers";
import Profile from "./pages/Admin/Profile";

/* =========================== */

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

/*
    Layout để ẩn Header/Navbar/Footer
    khi đang ở Admin
*/
function Layout() {
  const location = useLocation();

  const isAdmin = location.pathname.startsWith("/admin");

  if (isAdmin) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          {/* Dashboard */}
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />

          {/* Statistics */}
          <Route path="statistics" element={<Statistics />} />

          {/* Categories */}
          <Route path="categories" element={<Categories />} />

          {/* Goals */}
          <Route path="goals" element={<Goals />} />

          {/* Brands */}
          <Route path="brands" element={<AdminBrands />} />

          {/* Products */}
          <Route path="products" element={<ManageProducts />} />

          {/* Orders */}
          <Route path="orders" element={<OrdersAdmin />} />

          {/* Customers */}
          <Route path="customers" element={<Customers />} />

          {/* Profile */}
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[var(--bg-color)] text-[var(--text-color)]">

      <Header />
      <Navbar />

      <main className="flex-1">
        <Routes>

          <Route path="/" element={<Home />} />

          <Route
            path="/category/thuc-pham-bo-sung"
            element={<SupplementCategory />}
          />

          <Route
            path="/category/muc-tieu-nhu-cau"
            element={<GoalSupplementCategory />}
          />

          <Route path="/category/:slug" element={<Category />} />

          <Route path="/goal/:slug" element={<GoalCategory />} />

          <Route path="/products/:subSlug" element={<ProductList />} />

          <Route path="/brands" element={<Brands />} />

          <Route path="/brands/:brandSlug" element={<BrandDetail />} />

          <Route path="/product/:id" element={<ProductDetail />} />

          <Route path="/bmi" element={<BMI />} />

          <Route path="/tdee" element={<TDEE />} />

          <Route path="/cart" element={<Cart />} />

          <Route path="/checkout" element={<Checkout />} />

          <Route path="/login" element={<Login />} />

          <Route path="/register" element={<Register />} />

          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfileInfo />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile/password"
            element={
              <ProtectedRoute>
                <Password />
              </ProtectedRoute>
            }
          />

          <Route
            path="/khuyen-mai"
            element={<div>Đang cập nhật</div>}
          />

          <Route
            path="/kien-thuc"
            element={<div>Đang cập nhật</div>}
          />

          <Route
            path="/he-thong-cua-hang"
            element={<div>Đang cập nhật</div>}
          />
        </Routes>
      </main>

      <Footer />

    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <ScrollToTop />
          <Layout />
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;