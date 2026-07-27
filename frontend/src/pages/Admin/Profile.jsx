import React, { useState, useEffect } from "react";
import {
  UserCircle,
  Mail,
  Phone,
  ShieldCheck,
  Clock,
  LogIn,
  Package,
  Pencil,
  Tag,
  Trash2,
  MapPin,
  FileText,
  Layers,
  Check,
  X
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function Profile() {
  const { user, updateUser } = useAuth(); // Giả định AuthContext có hàm updateUser để lưu thông tin mới

  const [activeTab, setActiveTab] = useState("info");
  const [isEditing, setIsEditing] = useState(false);

  // Form state cho chỉnh sửa thông tin
  const [phone, setPhone] = useState(user?.phone || "");
  const [address, setAddress] = useState(user?.address || "Hà Nội, Việt Nam");
  const [bio, setBio] = useState(user?.bio || "Quản trị viên hệ thống GymBro.");

  const [activities, setActivities] = useState([]);
  const lastLogin = "09/07/2026 14:32";

  // Lấy lịch sử hoạt động từ localStorage khi load trang
  useEffect(() => {
    const savedLogs = JSON.parse(localStorage.getItem("admin_activities"));
    if (savedLogs && savedLogs.length > 0) {
      setActivities(savedLogs);
    } else {
      // Dữ liệu mẫu ban đầu nếu chưa có log nào
      const defaultLogs = [
        {
          id: 1,
          title: "Đăng nhập hệ thống",
          description: "Đăng nhập bằng tài khoản Admin",
          time: "09/07/2026 14:32",
          iconType: "login",
        },
        {
          id: 2,
          title: "Thêm sản phẩm",
          description: "ISO100 Gourmet Chocolate",
          time: "09/07/2026 14:15",
          iconType: "package",
        },
        {
          id: 3,
          title: "Cập nhật sản phẩm",
          description: "Cập nhật thông tin sản phẩm Rule 1 Whey Vanilla",
          time: "09/07/2026 13:40",
          iconType: "pencil",
        },
        {
          id: 4,
          title: "Tạo thương hiệu mới",
          description: "Thêm thương hiệu Nutrex Research",
          time: "09/07/2026 11:20",
          iconType: "tag",
        },
        {
          id: 5,
          title: "Xóa danh mục",
          description: "Xóa danh mục Mass Gainer",
          time: "09/07/2026 10:05",
          iconType: "trash",
        },
      ];
      setActivities(defaultLogs);
      localStorage.setItem("admin_activities", JSON.stringify(defaultLogs));
    }
  }, []);

  // Helper render icon tương ứng với log
  const renderActivityIcon = (iconType) => {
    switch (iconType) {
      case "login":
        return <LogIn size={20} className="text-blue-500" />;
      case "package":
        return <Package size={20} className="text-green-500" />;
      case "pencil":
        return <Pencil size={20} className="text-yellow-500" />;
      case "tag":
        return <Tag size={20} className="text-purple-500" />;
      case "trash":
        return <Trash2 size={20} className="text-red-500" />;
      case "layers":
        return <Layers size={20} className="text-indigo-500" />;
      default:
        return <Package size={20} className="text-gray-500" />;
    }
  };

  const handleSaveProfile = () => {
    // Cập nhật thông tin qua Context hoặc lưu tạm local
    if (updateUser) {
      updateUser({ ...user, phone, address, bio });
    } else {
      // Fallback lưu trực tiếp vào localStorage nếu chưa có hàm updateUser trong Context
      const updatedUser = { ...(user || {}), phone, address, bio };
      localStorage.setItem("admin_user", JSON.stringify(updatedUser));
    }
    setIsEditing(false);
    alert("Cập nhật thông tin cá nhân thành công!");
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-[#14213D]">Thông tin cá nhân</h1>
        <p className="text-gray-500 mt-2">
          Quản lý thông tin tài khoản và bảo mật hệ thống.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("info")}
            className={`px-6 py-4 font-semibold cursor-pointer transition ${
              activeTab === "info"
                ? "text-[#FCA311] border-b-2 border-[#FCA311]"
                : "text-gray-500 hover:text-[#FCA311]"
            }`}
          >
            Thông tin cá nhân
          </button>

          <button
            onClick={() => setActiveTab("activity")}
            className={`px-6 py-4 font-semibold cursor-pointer transition ${
              activeTab === "activity"
                ? "text-[#FCA311] border-b-2 border-[#FCA311]"
                : "text-gray-500 hover:text-[#FCA311]"
            }`}
          >
            Lịch sử hoạt động
          </button>
        </div>

        {/* Tab: Thông tin */}
        {activeTab === "info" && (
          <div className="p-8">
            <div className="flex items-center gap-6 mb-8 pb-6 border-b">
              <UserCircle size={80} className="text-[#14213D]" />
              <div>
                <h2 className="text-2xl font-bold">{user?.name || "Admin GymBro"}</h2>
                <p className="text-gray-500">Quản trị viên hệ thống</p>
                <p className="text-sm text-gray-400 mt-1 italic">
                  "{bio || "Chưa có giới thiệu bản thân."}"
                </p>
              </div>
            </div>

            {!isEditing ? (
              // Chế độ xem thông tin
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Mail className="text-[#FCA311]" size={20} />
                  <span className="font-semibold w-40 text-gray-700">Email</span>
                  <span className="text-gray-900">{user?.email || "admin@gymbro.com"}</span>
                </div>

                <div className="flex items-center gap-4">
                  <Phone className="text-[#FCA311]" size={20} />
                  <span className="font-semibold w-40 text-gray-700">Số điện thoại</span>
                  <span className="text-gray-900">{phone || "Chưa cập nhật"}</span>
                </div>

                <div className="flex items-center gap-4">
                  <MapPin className="text-[#FCA311]" size={20} />
                  <span className="font-semibold w-40 text-gray-700">Địa chỉ</span>
                  <span className="text-gray-900">{address || "Chưa cập nhật"}</span>
                </div>

                <div className="flex items-center gap-4">
                  <FileText className="text-[#FCA311]" size={20} />
                  <span className="font-semibold w-40 text-gray-700">Giới thiệu</span>
                  <span className="text-gray-900">{bio || "Chưa cập nhật"}</span>
                </div>

                <div className="flex items-center gap-4">
                  <Clock className="text-[#FCA311]" size={20} />
                  <span className="font-semibold w-40 text-gray-700">Đăng nhập lần cuối</span>
                  <span className="text-gray-900">{lastLogin}</span>
                </div>

                <div className="flex items-center gap-4">
                  <ShieldCheck className="text-[#FCA311]" size={20} />
                  <span className="font-semibold w-40 text-gray-700">Vai trò</span>
                  <span className="px-3 py-1 bg-amber-50 text-[#FCA311] font-semibold text-xs rounded-full inline-block">
                    {user?.role || "Administrator"}
                  </span>
                </div>

                <div className="border-t mt-8 pt-6 flex justify-center">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-[#FCA311] hover:bg-[#e8940f] text-white px-8 py-3 rounded-xl font-semibold transition cursor-pointer shadow-sm"
                  >
                    Chỉnh sửa thông tin
                  </button>
                </div>
              </div>
            ) : (
              // Chế độ form chỉnh sửa
              <div className="space-y-5 max-w-xl mx-auto">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Nhập số điện thoại..."
                    className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FCA311]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Địa chỉ</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Nhập địa chỉ..."
                    className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FCA311]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Giới thiệu ngắn</label>
                  <textarea
                    rows="3"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Giới thiệu đôi nét về bạn..."
                    className="w-full px-4 py-2.5 border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FCA311]"
                  />
                </div>

                <div className="flex justify-center gap-4 pt-4 border-t">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition cursor-pointer flex items-center gap-2"
                  >
                    <X size={18} /> Hủy
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="px-6 py-2.5 rounded-xl bg-[#FCA311] hover:bg-[#e8940f] text-white font-semibold transition cursor-pointer shadow-sm flex items-center gap-2"
                  >
                    <Check size={18} /> Lưu thay đổi
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Lịch sử hoạt động */}
        {activeTab === "activity" && (
          <div className="p-8">
            <h2 className="text-xl font-bold mb-6">Hoạt động gần đây của Admin</h2>

            {activities.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Chưa có lịch sử hoạt động nào được ghi nhận.</p>
            ) : (
              <div className="space-y-4">
                {activities.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center border border-gray-100 bg-gray-50/50 rounded-xl p-4 hover:bg-gray-50 transition shadow-xs"
                  >
                    <div className="flex gap-4 items-center">
                      <div className="p-2 bg-white rounded-lg shadow-2xs border border-gray-100">
                        {renderActivityIcon(item.iconType)}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{item.title}</div>
                        <div className="text-gray-600 text-sm">{item.description}</div>
                      </div>
                    </div>

                    <div className="text-xs font-medium text-gray-400 bg-white px-3 py-1.5 rounded-lg border border-gray-100">
                      {item.time}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;