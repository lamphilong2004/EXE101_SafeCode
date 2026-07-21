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

function getRandomDate(daysBack = 15) {
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

    // Xóa sạch mọi thứ trừ các tài khoản gốc (admin, client, freelancer test)
    await User.deleteMany({ email: { $nin: ["admin@safecode.com", "client@gmail.com", "freelancer@gmail.com"] } });
    await File.deleteMany({});
    await Transaction.deleteMany({});
    await CreditRequest.deleteMany({});
    await CreditHistory.deleteMany({});
    await WithdrawRequest.deleteMany({});

    console.log("1. Đang tạo các tài khoản Freelancer (Có sẵn 50 CR dùng thử)...");
    const freelancers = [];
    const passwordHash = await bcrypt.hash("123456", 10);
    for (let i = 0; i < 2; i++) {
      const name = getRandomName();
      const email = getRandomEmail(name);
      const user = await User.create({
        role: "freelancer",
        email,
        passwordHash,
        name,
        isVerified: true,
        createdAt: getRandomDate(),
        credits: 50, // Theo yêu cầu của bạn: Freelancer có 50 CR dùng thử
        payoutSettings: {
          bankName: "MBBANK",
          accountNumber: "0" + Math.floor(Math.random() * 1000000000),
          accountName: name.toUpperCase()
        }
      });
      freelancers.push(user);
    }
    console.log(`✅ Đã tạo ${freelancers.length} freelancers.`);

    console.log("2. Đang tạo các tài khoản Client giả (0 CR)...");
    const clients = [];
    for (let i = 0; i < 5; i++) {
      const name = getRandomName();
      const email = getRandomEmail(name);
      const user = await User.create({
        role: "client",
        email,
        passwordHash,
        name,
        isVerified: true,
        createdAt: getRandomDate(),
        credits: 0 // Client ban đầu có 0 CR
      });
      clients.push(user);
    }
    console.log(`✅ Đã tạo ${clients.length} clients.`);

    console.log("3. Đang tạo Giao dịch mua source code & Cộng Credit cho Freelancer...");
    let txCount = 0;
    const fileTitles = [
      "Website bán hàng nội thất", "App quản lý kho bằng React Native", 
      "Tool tự động lấy data web", "Kịch bản chatbot AI tư vấn"
    ];
    
    for (const freelancer of freelancers) {
      const numFiles = Math.floor(Math.random() * 2) + 2; // 2-3 dự án
      for (let i = 0; i < numFiles; i++) {
        const client = clients[Math.floor(Math.random() * clients.length)];
        const amount = Math.floor(Math.random() * 500) * 1000 + 100000; // Tiền VNĐ khách mua
        const creditEarned = amount / 1000; // Quy đổi 1 CR = 1000 VNĐ
        
        const fileDate = getRandomDate(10);
        const file = await File.create({
          freelancerId: freelancer._id,
          intendedClientEmail: client.email,
          title: fileTitles[Math.floor(Math.random() * fileTitles.length)],
          description: "Mô tả dự án mẫu tự động sinh để phục vụ báo cáo doanh thu...",
          projectType: "web",
          price: { amount, currency: "vnd" },
          status: "Paid",
          demo: { type: "none" },
          paidAt: fileDate,
          createdAt: new Date(fileDate.getTime() - 86400000) 
        });

        // 1. Lưu hóa đơn thanh toán của Client
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

        // 2. Cộng Credit cho Freelancer (Do bán được hàng)
        freelancer.credits += creditEarned;
        await freelancer.save();

        // 3. Ghi log lịch sử Credit của Freelancer
        await CreditHistory.create({
          userId: freelancer._id,
          amount: creditEarned,
          balanceAfter: freelancer.credits,
          type: "sale",
          description: "Bán source code cho khách",
          referenceId: file._id,
          referenceModel: "File",
          createdAt: file.paidAt
        });

        txCount++;
      }
    }
    console.log(`✅ Đã tạo ${txCount} giao dịch và cộng tiền (Credit) vào ví Freelancer.`);

    console.log("4. Đang tạo lịch sử Nạp Credit (Chỉ Freelancer nạp để lấy phí đăng bài)...");
    let crCount = 0;
    for (let i = 0; i < 5; i++) {
      const randomFreelancer = freelancers[Math.floor(Math.random() * freelancers.length)];
      const crAmount = Math.floor(Math.random() * 5) * 10 + 10; // 10 - 50 CR
      const crVND = crAmount * 1000;

      await CreditRequest.create({
        userId: randomFreelancer._id,
        amount: crAmount,
        amountVND: crVND,
        status: 'approved',
        payosOrderCode: Math.floor(Math.random() * 100000000),
        adminNote: "Fake seed",
        createdAt: getRandomDate(14),
        approvedAt: getRandomDate(14)
      });
      
      // Đảm bảo dữ liệu ĐỒNG BỘ: Cộng đúng số Credit đã nạp vào tài khoản của Freelancer đó
      randomFreelancer.credits += crAmount;
      await randomFreelancer.save();
      
      // Cũng cần ghi log lịch sử nhận Credit từ việc Nạp để 100% minh bạch
      await CreditHistory.create({
        userId: randomFreelancer._id,
        amount: crAmount,
        balanceAfter: randomFreelancer.credits,
        type: "deposit",
        description: "Nạp qua PayOS",
        createdAt: new Date()
      });
      crCount++;
    }
    console.log(`✅ Đã tạo ${crCount} giao dịch nạp Credit từ Freelancer.`);

    console.log("5. Đang tạo lịch sử Rút Tiền (Freelancer rút tiền thật từ Credit)...");
    let wdCount = 0;
    for (const freelancer of freelancers) {
      if (freelancer.credits > 150) {
        // RÚT GẦN HẾT ĐỂ NHÌN CHO RÕ: Giữ lại đúng 50 CR, rút toàn bộ phần dư
        const wdAmount = Math.floor(freelancer.credits - 50); 
        const wdVND = wdAmount * 1000;

        await WithdrawRequest.create({
          userId: freelancer._id,
          amount: wdAmount,
          amountVND: wdVND,
          status: 'approved',
          bankDetails: freelancer.payoutSettings,
          adminNote: "Đã chuyển khoản VietQR",
          createdAt: getRandomDate(7),
          approvedAt: getRandomDate(5)
        });

        // Trừ Credit
        freelancer.credits -= wdAmount;
        await freelancer.save();

        // Ghi Log Lịch sử Credit
        await CreditHistory.create({
          userId: freelancer._id,
          amount: -wdAmount, // Số âm vì bị trừ
          balanceAfter: freelancer.credits,
          type: "withdrawal",
          description: "Rút tiền về ngân hàng",
          createdAt: new Date()
        });
        wdCount++;
      }
    }
    console.log(`✅ Đã tạo ${wdCount} giao dịch rút tiền thành công.`);

    console.log("🎉 Hoàn tất Fake Data!");
  } catch (err) {
    console.error("❌ Lỗi khi seed data:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runSeed();
