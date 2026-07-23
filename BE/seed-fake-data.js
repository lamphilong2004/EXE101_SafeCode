import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { User } from "./src/models/User.js";
import { File } from "./src/models/File.js";
import { Transaction } from "./src/models/Transaction.js";
import { CreditRequest } from "./src/models/CreditRequest.js";
import { CreditHistory } from "./src/models/CreditHistory.js";
import { WithdrawRequest } from "./src/models/WithdrawRequest.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const firstNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý"];
const middleNames = ["Thị", "Văn", "Đức", "Ngọc", "Minh", "Thu", "Hải", "Xuân", "Thanh", "Quang", "Bảo", "Hoài", "Gia", "Khánh", "Phương", "Hoàng", "Hồng"];
const lastNames = ["Anh", "Bình", "Châu", "Dương", "Giang", "Hải", "Khánh", "Lâm", "Minh", "Nam", "Phong", "Quân", "Sơn", "Thanh", "Tuấn", "Vy", "Yến", "Linh", "Nhung", "Trang", "Phương", "Hương", "Hà", "Thu", "Ngọc", "Tâm"];

function getRandomName() {
  const f = firstNames[Math.floor(Math.random() * firstNames.length)];
  const m = middleNames[Math.floor(Math.random() * middleNames.length)];
  const l = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${f} ${m} ${l}`;
}

function getRandomEmail(name) {
  const cleanName = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "").toLowerCase();
  const domains = ["gmail.com"];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${cleanName}${Math.floor(Math.random() * 1000)}@${domain}`;
}

function getRandomDate(daysBack = 23) {
  return new Date(Date.now() - Math.floor(Math.random() * daysBack * 24 * 60 * 60 * 1000));
}

async function runSeed() {
  if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI is not set in .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(MONGODB_URI);
    console.log("[DB] Connected to", MONGODB_URI.substring(0, 40) + "...");

    await User.deleteMany({ email: { $nin: ["admin@safecode.com", "client@gmail.com", "freelancer@gmail.com"] } });
    await File.deleteMany({});
    await Transaction.deleteMany({});
    await CreditRequest.deleteMany({});
    await CreditHistory.deleteMany({});
    await WithdrawRequest.deleteMany({});

    console.log("1. Đang tạo Admin và Người dùng...");
    const hashedPassword = await bcrypt.hash("123456", 10);
    
    // 1. Tạo Admin
    await User.create({ name: 'SafeCode Admin', email: 'admin@safecode.vn', passwordHash: hashedPassword, role: 'admin', credits: 0 });

    const freelancers = [];
    const clients = [];

    // 2. Tạo đúng 25 Freelancers
    for (let i = 0; i < 25; i++) {
      let name, email;
      if (i === 0) {
        name = 'Lâm Phi Long';
        email = 'freelancer_long@gmail.com';
      } else {
        name = getRandomName();
        email = getRandomEmail(name);
      }

      const user = await User.create({
        role: 'freelancer',
        email: email,
        passwordHash: hashedPassword,
        name: name,
        isVerified: true,
        createdAt: getRandomDate(),
        credits: 50, // Khởi tạo đúng 50 credit
        payoutSettings: {
          bankName: "MBBANK",
          accountNumber: "0" + Math.floor(Math.random() * 1000000000),
          accountName: name.toUpperCase()
        },
        kyc: {
          status: i % 3 === 0 ? 'pending' : 'approved',
          fullName: name.toUpperCase(),
          cccdNumber: "079099" + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
          cccdFront: "https://cdn.tuoitre.vn/471584752817336320/2023/1/14/z4030616148386c913501a355606d0fa75908b8b0e895c-16736691459731057416954.jpg",
          cccdBack: "https://cdn.tuoitre.vn/471584752817336320/2023/1/14/z4030616148386c913501a355606d0fa75908b8b0e895c-16736691459731057416954.jpg",
          submittedAt: getRandomDate(2)
        }
      });
      
      await CreditHistory.create({
        userId: user._id,
        amount: 50,
        balanceAfter: 50,
        type: "adjustment",
        description: "Tặng 50 credits chào mừng thành viên mới"
      });
      
      freelancers.push(user);
    }
    console.log(`✅ Đã tạo 1 Admin và ${freelancers.length} Freelancers (Tất cả bắt đầu với 50 credits).`);

    // 3. Tạo 10 Clients
    console.log("2. Đang tạo các tài khoản Client giả...");
    for (let i = 0; i < 10; i++) {
      let name, email;
      if (i === 0) {
        name = 'Khách Hàng VIP';
        email = 'client_vip@gmail.com';
      } else {
        name = getRandomName();
        email = getRandomEmail(name);
      }

      const user = await User.create({
        role: 'client',
        email: email,
        passwordHash: hashedPassword,
        name: name,
        isVerified: true,
        createdAt: getRandomDate(),
        credits: 0
      });
      clients.push(user);
    }
    console.log(`✅ Đã tạo ${clients.length} clients.`);

    console.log("3. Đang tạo Giao dịch bất đối xứng & Tranh chấp...");
    let txCount = 0;
    
    function toSlug(str) {
      return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-").toLowerCase();
    }
    
    const projects = [
      { title: "Website bán hàng nội thất (MERN Stack)", desc: "Source code website bán hàng nội thất đầy đủ chức năng giỏ hàng, thanh toán, quản lý admin, tối ưu SEO." },
      { title: "App quản lý kho bằng React Native", desc: "Ứng dụng di động quản lý kho bãi, quét mã vạch QR/Barcode, tích hợp API realtime với Nodejs." },
      { title: "Tool cào dữ liệu Shopee bằng Python", desc: "Script tự động lấy thông tin sản phẩm, giá cả, đánh giá từ Shopee sử dụng Selenium và BeautifulSoup." },
      { title: "Landing Page Bất Động Sản", desc: "Mẫu landing page chuẩn UI/UX cho dự án bất động sản, tốc độ tải trang nhanh, tương thích di động." },
      { title: "Hệ thống điểm danh sinh viên QR Code", desc: "Hệ thống điểm danh lớp học bằng mã QR, thống kê chuyên cần tự động, gửi email báo cáo hàng tuần." },
      { title: "Website đặt lịch khám bệnh trực tuyến", desc: "Nền tảng đặt lịch khám tích hợp thanh toán, nhắc lịch tự động qua SMS, phân quyền chức năng bác sĩ và bệnh nhân." }
    ];
    
    // Cập nhật: 15 freelancer có nạp tiền để đủ WithdrawRequests
    for (let i = 0; i < 15; i++) {
      const freelancer = freelancers[i];
      const depositDate = getRandomDate(14);
      await CreditRequest.create({
        userId: freelancer._id,
        amount: 100,
        amountVND: 100000,
        status: 'approved',
        payosOrderCode: Math.floor(Math.random() * 1000000000),
        type: 'credit_purchase',
        createdAt: depositDate,
        approvedAt: depositDate
      });
      freelancer.credits += 100;
      await freelancer.save();
      await CreditHistory.create({
        userId: freelancer._id,
        amount: 100,
        balanceAfter: freelancer.credits,
        type: "deposit",
        description: `Nạp 100 Credits qua VietQR (PayOS)`,
        createdAt: depositDate
      });
    }

    let clientIndex = 0;
    const salesAmounts = [379000, 150000, 200000, 200000, 200000, 150000, 200000, 200000, 200000];
    
    for (let i = 0; i < salesAmounts.length; i++) {
      const freelancer = freelancers[i];
      const client = clients[clientIndex % clients.length];
      clientIndex++;
      
      const amount = salesAmounts[i];
      const creditEarned = amount / 1000;
      const fileDate = getRandomDate(10);
      
      const isDisputed = (i === 4);
      const fileStatus = isDisputed ? "Disputed" : "Paid";

      const proj = projects[Math.floor(Math.random() * projects.length)];
      const slug = toSlug(proj.title);
      const freelancerSlug = toSlug(freelancer.name).replace(/-/g, "");

      const file = await File.create({
        freelancerId: freelancer._id,
        intendedClientEmail: client.email,
        title: proj.title,
        description: proj.desc,
        projectType: "web",
        price: { amount, currency: "vnd" },
        status: fileStatus,
        demo: { type: "url", url: `https://${slug}-${Math.floor(Math.random()*1000)}.vercel.app` },
        deliveryMethod: "github_repo",
        githubRepoUrl: `https://github.com/${freelancerSlug}/${slug}`,
        paidAt: fileDate,
        createdAt: new Date(fileDate.getTime() - 86400000) 
      });

      freelancer.credits -= 10;
      await freelancer.save();
      await CreditHistory.create({
        userId: freelancer._id,
        amount: -10,
        balanceAfter: freelancer.credits,
        type: "upload",
        description: `Phí tạo giao dịch Escrow: ${proj.title}`,
        referenceId: file._id,
        referenceModel: "File",
        createdAt: file.createdAt
      });

      await Transaction.create({
        fileId: file._id,
        freelancerId: freelancer._id,
        clientEmail: client.email,
        type: "checkout",
        status: "Succeeded",
        amount: amount,
        currency: "vnd",
        payos: { orderCode: Math.floor(Math.random() * 1000000000) },
        createdAt: file.paidAt 
      });

      if (!isDisputed) {
        freelancer.credits += creditEarned;
        await freelancer.save();

        await CreditHistory.create({
          userId: freelancer._id,
          amount: creditEarned,
          balanceAfter: freelancer.credits,
          type: "sale",
          description: `Thanh toán thành công đơn hàng: ${file.title}`,
          referenceId: file._id,
          referenceModel: "File",
          createdAt: file.paidAt
        });
      }
      txCount++;
    }
    
    // Thêm 1 giao dịch bị FAILED (Khách quét mã xong rớt mạng, ko trả tiền)
    const failedClient = clients[clientIndex % clients.length];
    clientIndex++;
    const failedFreelancer = freelancers[6];
    const failedFile = await File.create({
      freelancerId: failedFreelancer._id,
      intendedClientEmail: failedClient.email,
      title: "Ứng dụng Chat Realtime Socket.IO",
      description: "Source code ứng dụng chat nhóm, tin nhắn trực tiếp với Socket.IO và React, có lưu trữ lịch sử chat.",
      projectType: "web",
      price: { amount: 150000, currency: "vnd" },
      status: "Draft",
      demo: { type: "url", url: "https://chat-socket-demo.vercel.app" },
      deliveryMethod: "github_repo",
      githubRepoUrl: "https://github.com/nguyenvanan/chat-socket-realtime",
      createdAt: getRandomDate(2)
    });

    failedFreelancer.credits -= 10;
    await failedFreelancer.save();
    await CreditHistory.create({
      userId: failedFreelancer._id,
      amount: -10,
      balanceAfter: failedFreelancer.credits,
      type: "upload",
      description: `Phí tạo giao dịch Escrow: Ứng dụng Chat Realtime`,
      referenceId: failedFile._id,
      referenceModel: "File",
      createdAt: failedFile.createdAt
    });

    await Transaction.create({
      fileId: failedFile._id, // Fixed: Schema requires fileId
      freelancerId: failedFreelancer._id,
      clientEmail: failedClient.email,
      type: "checkout",
      status: "Failed", // Thất bại
      amount: 150000,
      currency: "vnd",
      payos: { orderCode: Math.floor(Math.random() * 1000000000) },
      createdAt: failedFile.createdAt 
    });

    console.log(`✅ Đã tạo ${txCount} giao dịch thành công (có 1 Dispute) và 1 giao dịch Failed.`);

    console.log("4. Đang tạo lịch sử Rút Tiền...");
    let wdCount = 0;
    
    // Freelancer từ index 0 đến 2 (3 người) CÓ TIỀN NHƯNG KHÔNG RÚT
    // Freelancer từ index 3 đến 14 (12 người) CÓ RÚT TIỀN
    for (let i = 3; i < 15; i++) {
      const f = freelancers[i];
      if (f.credits > 100) {
        const wdAmount = Math.floor(f.credits - 50); // Giữ lại 50 credit
        const isApproved = i % 4 !== 0; // Một vài lệnh pending/rejected
        const wdStatus = isApproved ? 'approved' : (i === 4 ? 'rejected' : 'pending');
        
        await WithdrawRequest.create({
          userId: f._id,
          amount: wdAmount,
          amountVND: wdAmount * 1000,
          status: wdStatus,
          bankDetails: f.payoutSettings,
          adminNote: wdStatus === 'rejected' ? "Phát hiện giao dịch bất thường" : (wdStatus === 'approved' ? "Đã chuyển khoản VietQR" : ""),
          createdAt: getRandomDate(7),
          approvedAt: wdStatus === 'approved' ? getRandomDate(5) : null
        });
        
        if (wdStatus === 'approved') {
          f.credits -= wdAmount;
          await f.save();
          await CreditHistory.create({
            userId: f._id,
            amount: -wdAmount,
            balanceAfter: f.credits,
            type: "withdrawal",
            description: `Rút tiền về tài khoản ngân hàng`
          });
        } else if (wdStatus === 'pending' || wdStatus === 'rejected') {
          f.credits -= wdAmount; 
          await f.save();
          if (wdStatus === 'rejected') {
            f.credits += wdAmount;
            await f.save();
          }
        }
        wdCount++;
      }
    }

    console.log(`✅ Đã tạo lệnh rút tiền cho ${wdCount} người.`);

    console.log("🎉 Hoàn tất Fake Data chân thực!");
  } catch (err) {
    console.error("❌ Lỗi khi seed data:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runSeed();
