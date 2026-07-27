// src/data/ordersData.js

export const ordersData = [
  {
    id: 1001,
    customerName: "Nguyễn Văn A",
    phone: "0901234567",
    address: "123 Đường Cầu Giấy, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội",
    note: "Giao giờ hành chính giúp em",
    paymentMethod: "COD",
    paymentStatus: "Chưa thanh toán",
    status: "Chờ xác nhận",
    totalAmount: 350000,
    createdAt: "20/07/2026",
    updatedAt: "20/07/2026 14:30",
    items: [
      {
        id: 1,
        name: "Túi Tote Meymer",
        color: "Đen",
        charm: "Gấu Teddy",
        embroideryName: "Quân",
        price: 300000,
        optionFee: 50000,
        quantity: 1,
        total: 350000
      }
    ]
  },
  {
    id: 1002,
    customerName: "Trần Thị B",
    phone: "0987654321",
    address: "456 Đường Nguyễn Trãi, Thanh Xuân, Hà Nội",
    note: "Gói quà giúp mình nhé",
    paymentMethod: "BANK",
    paymentStatus: "Đã thanh toán",
    status: "Đang giao",
    totalAmount: 520000,
    createdAt: "21/07/2026",
    updatedAt: "21/07/2026 09:15",
    items: [
      {
        id: 2,
        name: "Ví da Meymer Mini",
        color: "Nâu",
        charm: "-",
        embroideryName: "Meymer",
        price: 450000,
        optionFee: 70000,
        quantity: 1,
        total: 520000
      }
    ]
  }
];