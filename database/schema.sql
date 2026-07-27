-- 1. Tạo Database và thiết lập Bảng mã tiếng Việt (utf8mb4)
CREATE DATABASE IF NOT EXISTS gymbro_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE gymbro_db;

-- Tắt tạm thời kiểm tra khóa ngoại để xóa/tạo lại bảng không bị ngắt quãng
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS AdminActivities;
DROP TABLE IF EXISTS OrderDetails;
DROP TABLE IF EXISTS Orders;
DROP TABLE IF EXISTS CartItems;
DROP TABLE IF EXISTS Cart;
DROP TABLE IF EXISTS ProductGoals;
DROP TABLE IF EXISTS ProductFlavors;
DROP TABLE IF EXISTS Products;
DROP TABLE IF EXISTS Goals;
DROP TABLE IF EXISTS Categories;
DROP TABLE IF EXISTS Brands;
DROP TABLE IF EXISTS AdminUsers;
DROP TABLE IF EXISTS Customers;
DROP TABLE IF EXISTS Users;

SET FOREIGN_KEY_CHECKS = 1;

-- ========================================================
-- 1. NHÓM TÀI KHOẢN & NGƯỜI DÙNG
-- ========================================================

-- 1. Bảng Users (Tài khoản & Đăng nhập chung)
CREATE TABLE Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Email VARCHAR(100) NOT NULL UNIQUE,
    Password VARCHAR(255) NOT NULL,
    FirstName VARCHAR(50),
    LastName VARCHAR(50),
    Phone VARCHAR(15),
    Role ENUM('Customer', 'Admin') DEFAULT 'Customer',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    LastLogin DATETIME NULL,
    IsActive TINYINT(1) DEFAULT 1
) ENGINE=InnoDB;

-- 2. Bảng Customers (Hồ sơ Khách hàng)
CREATE TABLE Customers (
    CustomerID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL UNIQUE,
    Address VARCHAR(255),
    JoinDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    LastOrderDate DATETIME NULL,
    TotalOrders INT DEFAULT 0,
    TotalSpent DECIMAL(18,2) DEFAULT 0.00,
    Tier ENUM('Bronze', 'Silver', 'Gold', 'Diamond') DEFAULT 'Bronze',
    Status TINYINT(1) DEFAULT 1, -- 1: Hoạt động, 0: Khóa
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Bảng AdminUsers (Hồ sơ Admin)
CREATE TABLE AdminUsers (
    AdminID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL UNIQUE,
    Address VARCHAR(255),
    Bio TEXT,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ========================================================
-- 2. NHÓM DANH MỤC, THƯƠNG HIỆU & MỤC TIÊU
-- ========================================================

-- 4. Bảng Brands
CREATE TABLE Brands (
    BrandID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL UNIQUE,
    Slug VARCHAR(100) NOT NULL UNIQUE,
    Country VARCHAR(100),
    Description TEXT,
    Image TEXT,
    ProductCount INT DEFAULT 0,
    Status VARCHAR(20) DEFAULT 'active',
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. Bảng Categories
CREATE TABLE Categories (
    CategoryID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Slug VARCHAR(100) NOT NULL UNIQUE,
    ParentCategoryID INT NULL,
    Description TEXT,
    Image TEXT,
    ProductCount INT DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ParentCategoryID) REFERENCES Categories(CategoryID) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 6. Bảng Goals (Giữ nguyên productCount)
CREATE TABLE Goals (
    GoalID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Slug VARCHAR(100) NOT NULL UNIQUE,
    Description TEXT,
    Image TEXT,
    productCount INT DEFAULT 0,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ========================================================
-- 3. NHÓM SẢN PHẨM & BIẾN THỂ
-- ========================================================

-- 7. Bảng Products (Giữ nguyên status)
CREATE TABLE Products (
    ProductID VARCHAR(50) PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    BrandID INT NOT NULL,
    CategoryID INT NOT NULL,
    SubCategoryID INT NOT NULL,
    Price DECIMAL(18,2) NOT NULL,
    Image LONGTEXT,
    status TINYINT(1) DEFAULT 1,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (BrandID) REFERENCES Brands(BrandID),
    FOREIGN KEY (CategoryID) REFERENCES Categories(CategoryID),
    FOREIGN KEY (SubCategoryID) REFERENCES Categories(CategoryID)
) ENGINE=InnoDB;

-- 8. Bảng ProductFlavors
CREATE TABLE ProductFlavors (
    FlavorID INT AUTO_INCREMENT PRIMARY KEY,
    ProductID VARCHAR(50) NOT NULL,
    FlavorName VARCHAR(100) NOT NULL,
    Stock INT DEFAULT 0,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. Bảng ProductGoals (Bảng trung gian N-N)
CREATE TABLE ProductGoals (
    ProductID VARCHAR(50) NOT NULL,
    GoalID INT NOT NULL,
    PRIMARY KEY (ProductID, GoalID),
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    FOREIGN KEY (GoalID) REFERENCES Goals(GoalID) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ========================================================
-- 4. NHÓM GIỎ HÀNG & ĐƠN HÀNG
-- ========================================================

-- 10. Bảng Cart
CREATE TABLE Cart (
    CartID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL UNIQUE,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES Users(UserID) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. Bảng CartItems
CREATE TABLE CartItems (
    CartItemID INT AUTO_INCREMENT PRIMARY KEY,
    CartID INT NOT NULL,
    ProductID VARCHAR(50) NOT NULL,
    FlavorID INT NOT NULL,
    Quantity INT NOT NULL CHECK (Quantity > 0),
    Price DECIMAL(18,2) NOT NULL,
    FOREIGN KEY (CartID) REFERENCES Cart(CartID) ON DELETE CASCADE,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE CASCADE,
    FOREIGN KEY (FlavorID) REFERENCES ProductFlavors(FlavorID) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 12. Bảng Orders
CREATE TABLE Orders (
    OrderID VARCHAR(30) PRIMARY KEY,
    CustomerID INT NULL,
    CustomerName VARCHAR(100) NOT NULL,
    Phone VARCHAR(15) NOT NULL,
    Email VARCHAR(100),
    Address VARCHAR(255) NOT NULL,
    Note TEXT,
    PaymentMethod VARCHAR(50),
    PaymentStatus VARCHAR(50),
    ShippingStatus VARCHAR(50),
    Status VARCHAR(50),
    TotalAmount DECIMAL(18,2) NOT NULL,
    CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CustomerID) REFERENCES Customers(CustomerID) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 13. Bảng OrderDetails (Snapshot dữ liệu)
CREATE TABLE OrderDetails (
    OrderDetailID INT AUTO_INCREMENT PRIMARY KEY,
    OrderID VARCHAR(30) NOT NULL,
    ProductID VARCHAR(50) NULL,
    FlavorID INT NULL,
    ProductName VARCHAR(255) NOT NULL,
    FlavorName VARCHAR(100) NOT NULL,
    Quantity INT NOT NULL CHECK (Quantity > 0),
    Price DECIMAL(18,2) NOT NULL,
    FOREIGN KEY (OrderID) REFERENCES Orders(OrderID) ON DELETE CASCADE,
    FOREIGN KEY (ProductID) REFERENCES Products(ProductID) ON DELETE SET NULL,
    FOREIGN KEY (FlavorID) REFERENCES ProductFlavors(FlavorID) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ========================================================
-- 5. NHÓM NHẬT KÝ HOẠT ĐỘNG ADMIN
-- ========================================================

-- 14. Bảng AdminActivities
CREATE TABLE AdminActivities (
    ActivityID BIGINT AUTO_INCREMENT PRIMARY KEY,
    AdminID INT NOT NULL,
    Title VARCHAR(255) NOT NULL,
    Description TEXT,
    IconType VARCHAR(50),
    ActivityTime DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (AdminID) REFERENCES AdminUsers(AdminID) ON DELETE CASCADE
) ENGINE=InnoDB;