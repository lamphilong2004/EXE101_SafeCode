# KỊCH BẢN THUYẾT TRÌNH DEMO DỰ ÁN SAFECODE (EXE101)

> **Mục tiêu:** Bám sát 100% tiêu chí chấm điểm (Rubric) để lấy điểm tối đa. 
> **Người trình bày:** Trưởng nhóm Kỹ thuật (Người code chính).
> **Thời gian dự kiến:** 5 - 7 phút.

---

## 🌟 PHẦN 1: GIỚI THIỆU TỔNG QUAN & DEPLOYMENT (Ăn điểm Section 5 - 10đ)
*Vừa nói vừa mở trình duyệt web, gõ tên miền dự án.*

**🗣️ Lời thoại:** 
"Xin chào ban giám khảo, em là đại diện nhóm phát triển dự án **SafeCode - Nền tảng trung gian giao dịch Source Code an toàn**. 
Sản phẩm của nhóm em không chỉ nằm trên giấy mà đã được **triển khai thực tế (Deploy) lên server thật** và trỏ tên miền chính thức. Ban giám khảo có thể truy cập trực tiếp ngay bây giờ qua đường link: **`safecode.id.vn`**.
Toàn bộ mã nguồn cũng đã được đẩy lên **GitHub** public, có kèm theo file `README.md` mô tả chi tiết Tech Stack và Cấu trúc Database (ERD) đúng như yêu cầu của học phần."

---

## 🚀 PHẦN 2: DEMO LUỒNG MVP CHÍNH (Ăn điểm Section 2 - End-to-end Flow)
*Sử dụng 2 trình duyệt khác nhau (hoặc 1 cửa sổ thường, 1 cửa sổ ẩn danh) để đóng vai 2 người dùng.*

**🗣️ Lời thoại:** 
"Bây giờ em xin phép Demo luồng giao dịch cốt lõi nhất của SafeCode (End-to-End flow), từ lúc đăng bán đến lúc nhận tiền. Quá trình này hoàn toàn tự động 100%."

**🖥️ Thao tác 1 (Đóng vai Freelancer):**
- Mở cửa sổ thường.
- Đăng nhập vào tài khoản Freelancer.
- Bấm nút **Gửi File Mới**, điền Email khách hàng, Giá bán, Link GitHub Repo, và Link Vercel Demo.
- Bấm **Quét Xác Minh Ngay** để hệ thống quét file `safecode.txt` nhằm chứng minh quyền sở hữu Repo.
- Bấm **Tạo Giao Dịch Giao Code**.
- *Nhấn mạnh:* "Hệ thống sẽ tự động xác minh quyền sở hữu mã nguồn trên GitHub, đảm bảo tính chính chủ và an toàn tuyệt đối trước khi tạo giao dịch."

**🖥️ Thao tác 2 (Đóng vai Khách mua):**
- Mở cửa sổ Ẩn danh.
- Đăng nhập tài khoản Khách hàng (Client).
- Vào danh sách, tìm đúng file Freelancer vừa đăng, bấm **Thanh toán**.
- *Nhấn mạnh:* "SafeCode tích hợp cổng thanh toán **PayOS** tạo mã VietQR động tự động cho từng đơn hàng."
- **[LẤY ĐIỆN THOẠI QUÉT MÃ QR CHUYỂN KHOẢN THẬT 10.000đ HOẶC 100.000đ TÙY BẠN]**
- *Sau khi chuyển khoản xong, chỉ tay vào màn hình:* "Ban giám khảo có thể thấy, không cần bấm F5, Webhook ngân hàng đã tự động xác nhận, Website tự động đóng Form mã QR, hiện thông báo giao dịch thành công và cấp quyền truy cập mã nguồn cho khách."

---

## 💾 PHẦN 3: DATABASE & REALTIME (Ăn điểm Section 3 - Persistent Database)

**🗣️ Lời thoại:** 
"Để minh chứng hệ thống có Database lưu trữ bền vững (Persistent) chứ không phải dữ liệu ảo, em xin phép tải lại trang (F5) và đăng xuất ra vào lại."

**🖥️ Thao tác:**
- Tải lại trang (F5) ở cả 2 cửa sổ.
- Đăng xuất rồi đăng nhập lại.
- Mở mục "Lịch sử giao dịch".
- *Nhấn mạnh:* "Tất cả dữ liệu như: thông tin file đã bán, số dư ví Credit, trạng thái giao dịch đều được lưu trữ an toàn trên MongoDB. Việc Website tự động đóng form lúc nãy chính là nhờ kiến trúc **Socket.io Real-time** lắng nghe thay đổi từ Database để phản hồi ngay lập tức cho người dùng."

---

## 📊 PHẦN 4: ADMIN DASHBOARD (Ăn điểm Section 4 + Điểm Bonus Revenue)
*Đăng nhập vào tài khoản Admin.*

**🗣️ Lời thoại:** 
"Và đây là bảng điều khiển dành riêng cho Quản trị viên (Admin Dashboard). Theo tiêu chí chấm điểm, Dashboard cần mang lại 'Insights' (Cái nhìn sâu sắc) chứ không chỉ là danh sách."

**🖥️ Thao tác:**
- Trỏ chuột vào các con số thống kê.
- *Nhấn mạnh:* "Dashboard của bọn em tự động thống kê tổng số Người dùng, tổng số Source Code đang lưu trữ. Và đặc biệt, để lấy **điểm Bonus** của phần này, hệ thống của em đã tính toán được **Doanh thu hệ thống (System Revenue)**. 
Mỗi giao dịch thành công, tiền sẽ chạy trực tiếp vào tài khoản ngân hàng của nền tảng SafeCode trước (Mô hình Escrow), tạo ra dòng tiền minh bạch được biểu đồ hóa ngay tại đây."

---

## 📁 PHẦN 5: TÀI LIỆU MINH CHỨNG (Ăn điểm Section 6 - Deliverables)

**🗣️ Lời thoại:** 
"Bên cạnh tính năng phần mềm, nhóm em đã chuẩn bị đầy đủ 100% các tài liệu bản cứng và bản mềm theo yêu cầu nộp bài, bao gồm:
1. Video Demo hệ thống (3-5 phút).
2. Video TVC Quảng cáo (60 giây) rất tâm huyết.
3. Báo cáo User Testing từ trải nghiệm thực tế của 5 người dùng.
4. Bảng Test Report & Bug Log (Ghi nhận các lỗi như Webhook và cách nhóm đã sửa chữa).
5. Bản thiết kế UI/UX trên Figma.
6. Và bản tóm tắt ý tưởng cập nhật cuối cùng (Updated Idea Summary)."

"Sản phẩm SafeCode của nhóm em được xây dựng không chỉ để trả bài tập, mà hoàn toàn có tiềm năng thương mại hóa ngay vào ngày mai. Em xin cảm ơn ban giám khảo đã lắng nghe và xin phép nhận câu hỏi phản biện ạ!"

---

## 📝 NHỮNG VIỆC BẠN (CODE CHÍNH) CẦN CHUẨN BỊ ĐÊM NAY:
1. **Tạo Data mẫu:** Tạo sẵn 1 acc Admin, 1 acc Freelancer, 1 acc Client. Chuẩn bị sẵn 1 Public Repo trên GitHub và 1 link Vercel Demo để demo việc xác minh `safecode.txt` trực tiếp.
2. **Nạp tiền vào the ngân hàng:** Chuẩn bị sẵn 1 tài khoản ngân hàng trong điện thoại để mai quét mã QR thanh toán mượt mà không loay hoay nhập pass.
3. **Kiểm tra File:** Kiểm tra lại lần cuối xem thư mục nộp bài (Google Drive hoặc hệ thống của trường) ĐÃ CÓ ĐỦ 6 món giấy tờ/video ở phần 5 chưa. Mất 1 món là đi toi vài điểm!
