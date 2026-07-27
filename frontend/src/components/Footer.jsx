import React from "react";
import { Link } from "react-router-dom";
import {
  FaFacebookF,
  FaYoutube,
  FaInstagram,
  FaTiktok,
  FaTruck,
  FaAward,
  FaHeadset,
  FaPiggyBank,
  FaCreditCard,
  FaCcVisa,
  FaCcMastercard,
  FaShieldAlt,
} from "react-icons/fa";

function Footer() {
  return (
    <footer className="mt-20 border-t border-gray-200">

      {/* 1. FEATURES BADGES TRỰC QUAN */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto py-10 px-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
            <FeatureItem icon={<FaTruck />} title="Miễn Phí Vận Chuyển" subtitle="Đơn hàng từ 500k" />
            <FeatureItem icon={<FaAward />} title="Thương Hiệu Chính Hãng" subtitle="Cam kết 100% auth" />
            <FeatureItem icon={<FaHeadset />} title="Tư Vấn Nhiệt Tình" subtitle="Hỗ trợ 24/7" />
            <FeatureItem icon={<FaPiggyBank />} title="Tích Điểm Thành Viên" subtitle="Ưu đãi nhân đôi" />
            <FeatureItem icon={<FaCreditCard />} title="Thanh Toán Tiện Lợi" subtitle="Đa dạng phương thức" />
          </div>
        </div>
      </div>

      {/* 2. MAIN FOOTER - CẤU TRÚC NỘI DUNG 4 CỘT KHOA HỌC */}
      <div className="bg-[#14213D] text-white">
        <div className="max-w-[1400px] mx-auto px-6 py-14">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12">

            {/* CỘT 1: GIỚI THIỆU & SOCIAL */}
            <div>
              <h3 className="text-lg font-black text-[#FCA311] mb-2 uppercase tracking-wide">
                Giới thiệu Gymbro
              </h3>
              <div className="w-16 h-[3px] bg-[#FCA311] mb-6 rounded-full" />
              <p className="text-sm text-gray-300 leading-relaxed mb-5">
                GymBro - Hệ thống bán lẻ thực phẩm bổ sung uy tín hàng đầu cho giới tập gym và thể thao.
              </p>
              <ul className="space-y-2.5 text-sm text-gray-300 list-none pl-0">
                <FooterLink to="/about">Giới thiệu công ty</FooterLink>
                <FooterLink to="/stores">Hệ thống cửa hàng</FooterLink>
                <FooterLink to="/brands">Thương hiệu nổi bật</FooterLink>
                <FooterLink to="/contact">Liên hệ</FooterLink>
                <FooterLink to="/careers">Tuyển dụng</FooterLink>
              </ul>

              {/* SOCIAL ICONS */}
              <div className="flex gap-3 mt-6">
                <SocialIcon icon={<FaFacebookF />} label="Facebook" href="https://facebook.com/gymbro" />
                <SocialIcon icon={<FaYoutube />} label="Youtube" href="https://youtube.com/gymbro" />
                <SocialIcon icon={<FaInstagram />} label="Instagram" href="https://instagram.com/gymbro" />
                <SocialIcon icon={<FaTiktok />} label="Tiktok" href="https://tiktok.com/@gymbro" />
              </div>
            </div>

            {/* CỘT 2: HỖ TRỢ KHÁCH HÀNG */}
            <div>
              <h3 className="text-lg font-black text-[#FCA311] mb-2 uppercase tracking-wide">
                Hỗ trợ khách hàng
              </h3>
              <div className="w-16 h-[3px] bg-[#FCA311] mb-6 rounded-full" />
              <ul className="space-y-2.5 text-sm text-gray-300 list-none pl-0">
                <FooterLink to="/support/payment">Hướng dẫn thanh toán</FooterLink>
                <FooterLink to="/support/guide">Hướng dẫn mua hàng Online</FooterLink>
                <FooterLink to="/support/policy">Chính sách khách hàng</FooterLink>
                <FooterLink to="/support/feedback">Góp ý, Khiếu Nại</FooterLink>
              </ul>
            </div>

            {/* CỘT 3: CHÍNH SÁCH CHUNG */}
            <div>
              <h3 className="text-lg font-black text-[#FCA311] mb-2 uppercase tracking-wide">
                Chính sách chung
              </h3>
              <div className="w-16 h-[3px] bg-[#FCA311] mb-6 rounded-full" />
              <ul className="space-y-2.5 text-sm text-gray-300 list-none pl-0">
                <FooterLink to="/policy/general">Chính sách, quy định chung</FooterLink>
                <FooterLink to="/policy/refund">Chính sách đổi trả và hoàn tiền</FooterLink>
                <FooterLink to="/policy/shipping">Chính sách vận chuyển hàng</FooterLink>
                <FooterLink to="/policy/privacy">Bảo mật thông tin khách hàng</FooterLink>
                <FooterLink to="/policy/authenticity">Chính sách hàng chính hãng</FooterLink>
              </ul>
            </div>

            {/* CỘT 4: SẢN PHẨM NỔI BẬT */}
            <div>
              <h3 className="text-lg font-black text-[#FCA311] mb-2 uppercase tracking-wide">
                Sản phẩm nổi bật
              </h3>
              <div className="w-16 h-[3px] bg-[#FCA311] mb-6 rounded-full" />
              <ul className="space-y-2.5 text-sm text-gray-300 list-none pl-0">
                <FooterLink to="/category/whey-protein">Whey Protein</FooterLink>
                <FooterLink to="/category/sua-tang-can">Sữa Tăng Cân</FooterLink>
                <FooterLink to="/category/bcaa">BCAA</FooterLink>
                <FooterLink to="/category/eaa">EAA</FooterLink>
                <FooterLink to="/category/creatine">Creatine</FooterLink>
                <FooterLink to="/category/vitamin-d3-k2">Vitamin D3 K2</FooterLink>
                <FooterLink to="/category/dau-ca-omega-3">Dầu Cá Omega 3</FooterLink>
              </ul>
            </div>

          </div>
        </div>

        {/* 3. FOOTER BOTTOM TINH TẾ & THANH TOÁN */}
        <div className="border-t border-white/10 bg-[#0d1629] py-6">
          <div className="max-w-[1400px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
            <p className="text-center md:text-left">
              © {new Date().getFullYear()} <span className="text-[#FCA311] font-bold">GymBro</span>. All rights reserved. Designed for Fitness Enthusiasts.
            </p>

            <div className="flex items-center gap-4 text-2xl text-gray-400">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Thanh toán:</span>
              <FaCcVisa className="hover:text-white transition-colors" title="Visa" />
              <FaCcMastercard className="hover:text-white transition-colors" title="Mastercard" />
              <FaShieldAlt className="hover:text-[#FCA311] transition-colors" title="Bảo mật 100%" />
            </div>
          </div>
        </div>
      </div>

    </footer>
  );
}

// SUB-COMPONENTS

function FeatureItem({ icon, title, subtitle }) {
  return (
    <div className="flex flex-col items-center text-center group cursor-default select-none p-2">
      <div className="w-14 h-14 rounded-full border-2 border-[#FCA311] bg-white flex items-center justify-center text-xl text-[#FCA311] mb-3 group-hover:bg-[#FCA311] group-hover:text-[#14213D] group-hover:scale-110 transition-all duration-300 shadow-sm">
        {icon}
      </div>
      <h4 className="font-bold text-xs text-[#14213D] uppercase tracking-wide">
        {title}
      </h4>
      {subtitle && (
        <p className="text-[11px] text-gray-500 mt-0.5 font-medium">{subtitle}</p>
      )}
    </div>
  );
}

function FooterLink({ to, children }) {
  return (
    <li>
      <Link
        to={to}
        className="hover:text-[#FCA311] hover:translate-x-1 transition-all duration-200 inline-block py-0.5"
      >
        {children}
      </Link>
    </li>
  );
}

function SocialIcon({ icon, label, href }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-9 h-9 rounded-full bg-[#1B2B4A] border border-white/10 text-[#FCA311] flex items-center justify-center hover:bg-[#FCA311] hover:text-[#14213D] hover:scale-110 transition-all duration-200"
    >
      {icon}
    </a>
  );
}

export default Footer;