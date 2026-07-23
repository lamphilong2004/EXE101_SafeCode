# SafeCode - Nền tảng Giao dịch & Bàn giao Mã nguồn An toàn

SafeCode là nền tảng giao dịch trung gian (Escrow) giúp giải quyết vấn đề lòng tin giữa **Freelancer (Người viết code)** và **Client (Khách hàng)**. Hệ thống đảm bảo thanh toán an toàn và bàn giao mã nguồn tự động thông qua GitHub sau khi giao dịch hoàn tất.

---

## 🚀 Tính năng cốt lõi (Core Features)

1. **Bàn giao tự động qua GitHub:** Sau khi thanh toán thành công, người mua sẽ nhận được quyền truy cập hoặc link GitHub Repository chứa mã nguồn của dự án.
2. **Thanh toán Escrow (Giao dịch trung gian):** Hệ thống giữ tiền an toàn cho đến khi cả 2 bên xác nhận giao dịch thành công. Hỗ trợ thanh toán tự động qua PayOS (VietQR) và Stripe.
3. **Quản lý trạng thái giao dịch:** Quy trình rõ ràng từ lúc tạo thỏa thuận, chờ thanh toán, đến khi xác nhận bàn giao thành công.
4. **Real-time Notifications:** Thông báo tức thời khi có biến động giao dịch hoặc cập nhật trạng thái đơn hàng qua Socket.io.

---

## 🛠 Tech Stack (Công nghệ sử dụng)

- **Frontend:** React.js 19 (Vite), React Router v7, Vanilla CSS & CSS Modules.
- **Backend:** Node.js, Express.js, MongoDB (Mongoose), Socket.io.
- **Thanh toán & Tích hợp:** PayOS, Stripe.

---

## 🗂 Cấu trúc dự án

```text
📦 safecode
 ┣ 📂 BE (Backend - Node.js/Express)
 ┃ ┣ 📂 src (Controllers, Models, Routes, Services, Middlewares)
 ┃ ┣ 📜 package.json
 ┃ ┗ 📜 .env.example
 ┗ 📂 FE (Frontend - React/Vite)
 ┃ ┣ 📂 src (Components, Pages, Services, Contexts)
 ┃ ┣ 📜 package.json
 ┃ ┗ 📜 .env.example
```

---

## 💻 Hướng dẫn chạy dự án dưới Local (Local Development)

### 1. Yêu cầu hệ thống
- Node.js (v18+)
- MongoDB đang chạy (Local hoặc Atlas)
- Tài khoản Stripe, PayOS (để test thanh toán)

### 2. Cài đặt Backend
```bash
cd BE
npm install
# Khởi tạo file .env (Copy từ mẫu hoặc tạo mới)
# Điền các thông số: PORT, MONGO_URI, JWT_SECRET, STRIPE_*, PAYOS_*
npm run dev
```

### 3. Cài đặt Frontend
```bash
cd FE
npm install
# Khởi tạo file .env (Điền VITE_API_URL trỏ về backend)
npm run dev
```

---

## ☁️ Hướng dẫn Deploy dự án (Sử dụng Git & Vercel)

### 1. Đẩy mã nguồn lên GitHub
Khởi tạo Git repo và đẩy toàn bộ code lên GitHub:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/safecode.git
git push -u origin main
```

### 2. Deploy Frontend (Vercel)
Vercel là nền tảng tốt nhất để deploy ứng dụng React/Vite.

1. Đăng nhập vào [Vercel](https://vercel.com) bằng tài khoản GitHub.
2. Chọn **"Add New Project"** và chọn repository `safecode` từ GitHub.
3. Trong phần cấu hình **Framework Preset**, chọn `Vite`.
4. Cấu hình **Root Directory**: Chọn thư mục `FE`.
5. Cấu hình **Environment Variables**:
   - Thêm biến `VITE_API_URL` với giá trị là URL của Backend sau khi deploy (VD: `https://api.yourdomain.com`).
6. Nhấn **Deploy**. Vercel sẽ tự động build và chạy Frontend. Mọi thay đổi đẩy lên branch `main` trên GitHub sẽ tự động được Vercel cập nhật (CI/CD).

### 3. Deploy Backend (Gợi ý)
Backend Node.js yêu cầu môi trường chạy Server, bạn có thể deploy lên các dịch vụ như **Render, Railway, hoặc VPS**:
- **Root Directory:** `BE`
- **Build Command:** `npm install`
- **Start Command:** `npm start`
- Đừng quên thiết lập đầy đủ các **Environment Variables** (Stripe, PayOS, JWT...) trên môi trường deploy.
