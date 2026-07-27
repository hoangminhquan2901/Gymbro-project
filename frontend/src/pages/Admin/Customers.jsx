import React, { useState, useEffect } from "react";
import { Search, Users, ShieldAlert, CheckCircle2 } from "lucide-react";
import { getCustomers, updateCustomerStatus } from "../../services/adminCustomerService";
import CustomerTable from "../../components/Admin/CustomerTable";
import CustomerDetailModal from "../../components/Admin/CustomerDetailModal";

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTier, setSelectedTier] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Tải danh sách khách hàng từ API
  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        setLoading(true);
        const data = await getCustomers();
        setCustomers(data || []);
      } catch (error) {
        console.error("Lỗi tải danh sách khách hàng:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomerData();
  }, []);

  // 2. Cập nhật trạng thái
  const handleToggleStatus = async (id, newStatus) => {
  try {
    // newStatus truyền vào: 1 (hoạt động) hoặc 0 (khóa)
    const res = await updateCustomerStatus(id, newStatus);
    
    if (res && res.success) {
      // Cập nhật lại mảng customers trong state mà không làm mất danh sách
      setCustomers((prevCustomers) =>
        prevCustomers.map((cus) =>
          cus.id === id ? { ...cus, status: newStatus } : cus
        )
      );

      // Nếu đang mở popup Modal của khách hàng này thì cập nhật luôn
      if (selectedCustomer && selectedCustomer.id === id) {
        setSelectedCustomer((prev) => ({ ...prev, status: newStatus }));
      }
    }
  } catch (error) {
    console.error("Không thể thay đổi trạng thái:", error);
  }
};

  // 3. Bộ lọc linh hoạt tương thích cả PascalCase (MySQL) và camelCase (JS)
  const filteredCustomers = customers.filter((cus) => {
  const matchSearch =
    !searchTerm ||
    (cus.name && cus.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (cus.email && cus.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (cus.phone && cus.phone.includes(searchTerm));

  const matchTier = selectedTier === "All" || cus.tier === selectedTier;

  // MySQL trả về 1 là active, 0 là locked
  const isActived = cus.status === 1 || cus.status === true || cus.status === "1";

  const matchStatus =
    selectedStatus === "All" ||
    (selectedStatus === "Active" && isActived) ||
    (selectedStatus === "Locked" && !isActived);

  return matchSearch && matchTier && matchStatus;
});

  return (
    <div className="p-8 max-w-[1400px] mx-auto min-h-screen bg-gray-50/50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0B132B] tracking-tight">Quản lý Khách hàng</h1>
          <p className="text-sm text-gray-500 mt-1">
            Quản lý thông tin khách hàng từ Database
          </p>
        </div>
      </div>

      {/* Table Component */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            Đang tải dữ liệu khách hàng từ Database...
          </div>
        ) : (
          <CustomerTable
            customers={filteredCustomers}
            onViewDetail={(cus) => setSelectedCustomer(cus)}
            onToggleStatus={handleToggleStatus}
          />
        )}
      </div>

      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          onToggleStatus={handleToggleStatus}
        />
      )}
    </div>
  );
}