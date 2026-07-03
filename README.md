# SafeCode - Secure Source Code Escrow Platform

SafeCode là nền tảng giao dịch mã nguồn (Source Code) an toàn dựa trên cơ chế Escrow (Giao dịch trung gian) và thanh toán VietQR tự động.

## 👥 Đội ngũ thực hiện (Team Members)
- **Lâm Phi Long** (Nhóm trưởng / Developer)
- *[Vui lòng điền tên các thành viên khác vào đây...]*

## 🛠 Tech Stack (Công nghệ sử dụng)
- **Frontend**: React.js (Vite), CSS3, Context API.
- **Backend**: Node.js, Express.js, Socket.io (Real-time notifications).
- **Database**: MongoDB (Mongoose).
- **Thanh toán & Tích hợp**: PayOS (Tạo VietQR & Xử lý Webhook tự động).

## 🚀 Hướng dẫn cài đặt và chạy dự án (How to run)

### Yêu cầu hệ thống:
- Node.js (v16+)
- MongoDB URI
- Tài khoản PayOS (Client ID, API Key, Checksum Key)

### 1. Cài đặt Backend
```bash
cd BE
npm install
# Tạo file .env và điền các biến môi trường (PORT, MONGODB_URI, PAYOS_*, JWT_SECRET...)
npm start
```

### 2. Cài đặt Frontend
```bash
cd FE
npm install
# Tạo file .env và điền VITE_API_URL trỏ về Backend
npm run dev
```

## 🗄 Database Schema (ERD & Table Descriptions)

Dự án sử dụng MongoDB với các Collection chính sau:

### 1. `users` (Người dùng)
| Trường | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `_id` | ObjectId | ID người dùng |
| `email` | String | Email đăng nhập |
| `passwordHash`| String | Mật khẩu (đã hash) |
| `name` / `phone`| String | Họ tên và Số điện thoại |
| `role` | String | Vai trò (`freelancer`, `client`, `admin`) |
| `credits` | Number | Số dư hiện tại (1 CR = 1000 VNĐ) |
| `payoutSettings`| Object | Thông tin nhận tiền (Ngân hàng, STK, QR Code) |
| `kyc` | Object | Trạng thái định danh KYC (CCCD, tên thật) |

### 2. `files` (Mã nguồn & Giao dịch Escrow)
| Trường | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `_id` | ObjectId | ID File |
| `freelancerId` | ObjectId | Ref to `users` |
| `intendedClientEmail`| String | Email khách hàng dự kiến |
| `title` | String | Tên File / Dự án |
| `projectType` | String | Loại dự án (`web`, `code`) |
| `price.amount` | Number | Giá bán |
| `status` | String | Trạng thái (`Draft`, `Uploaded`, `Locked`, `Paid`, `Delivered`,...) |
| `deliveryMethod` | String | Phương thức bàn giao (`zip_upload`, `github_repo`) |
| `github.repoUrl` | String | Link kho lưu trữ GitHub |
| `demo.url` | String | Link Demo trực tiếp (VD: Vercel) |
| `payos.orderCode`| Number | Mã đơn hàng trên PayOS |

### 3. `creditrequests` (Yêu cầu Nạp/Rút Credit)
| Trường | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `_id` | ObjectId | ID Yêu cầu |
| `userId` | ObjectId | Ref to `users` |
| `type` | String | Loại (`credit_purchase`, `file_payment`) |
| `amount` | Number | Số lượng Credit |
| `amountVND` | Number | Số tiền VNĐ tương ứng |
| `status` | String | Trạng thái (`pending`, `approved`, `rejected`) |
| `billImageUrl`| String | Link ảnh bill chuyển khoản |
| `payosOrderCode`| Number| Mã đơn hàng PayOS |
| `aiVerification`| Object | AI nhận diện bill tự động (Confidence, Detected) |

### 4. `credithistories` (Lịch sử biến động số dư)
| Trường | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `userId` | ObjectId | Ref to `users` |
| `type` | String | Loại (`upload`, `sale`, `deposit`, `refund`, `withdrawal`, `adjustment`) |
| `amount` | Number | Số dư thay đổi (+ / -) |
| `balanceAfter` | Number | Số dư còn lại sau giao dịch |
| `description` | String | Mô tả giao dịch |

### 5. `notifications` (Thông báo Real-time)
| Trường | Kiểu dữ liệu | Mô tả |
|---|---|---|
| `user` | ObjectId | Ref to `users` |
| `type` | String | Loại TB (`file_update`, `payment`, `dispute`, `system`, `message`) |
| `title` | String | Tiêu đề thông báo |
| `message` | String | Nội dung thông báo |
| `isRead` | Boolean | Trạng thái đọc |
| `relatedFileId` | ObjectId| Ref to `files` (Nếu liên quan đến file) |

## 📊 Tính năng cốt lõi (Core Features)
1. **Quản lý danh tính**: Đăng nhập, Đăng ký, Phân quyền (Freelancer/Client).
2. **Giao dịch Escrow**: Đóng băng mã nguồn, Thanh toán an toàn, Tự động mở khóa khi tiền về.
3. **Thanh toán tự động**: Tích hợp PayOS tạo mã VietQR động, Webhook xác nhận tự động 24/7.
4. **Admin Dashboard**: Thống kê số lượng user, doanh thu hệ thống, biến động dòng tiền.
5. **Real-time Notifications**: Thông báo ngay lập tức qua Socket.io khi thanh toán thành công.

