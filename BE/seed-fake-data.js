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

    await User.deleteMany({ email: { $nin: ["admin@safecode.com", "client@gmail.com", "freelancer@gmail.com"] } });
    await File.deleteMany({});
    await Transaction.deleteMany({});
    await CreditRequest.deleteMany({});
    await CreditHistory.deleteMany({});
    await WithdrawRequest.deleteMany({});

    console.log("1. Đang tạo các tài khoản Freelancer...");
    const freelancers = [];
    const passwordHash = await bcrypt.hash("123456", 10);
    for (let i = 0; i < 24; i++) {
      const name = getRandomName();
      const email = getRandomEmail(name);
      // Tạo 1 KYC bị từ chối cho freelancer thứ 5
      const kycStatus = i === 4 ? 'rejected' : 'pending';
      const user = await User.create({
        role: "freelancer",
        email,
        passwordHash,
        name,
        isVerified: true,
        createdAt: getRandomDate(),
        credits: 50,
        payoutSettings: {
          bankName: "MBBANK",
          accountNumber: "0" + Math.floor(Math.random() * 1000000000),
          accountName: name.toUpperCase()
        },
        kyc: {
          status: kycStatus,
          fullName: name.toUpperCase(),
          cccdNumber: "079099" + Math.floor(Math.random() * 1000000).toString().padStart(6, '0'),
          cccdFront: "https://cdn.tuoitre.vn/471584752817336320/2023/1/14/z4030616148386c913501a355606d0fa75908b8b0e895c-16736691459731057416954.jpg",
          cccdBack: "https://cdn.tuoitre.vn/471584752817336320/2023/1/14/z4030616148386c913501a355606d0fa75908b8b0e895c-16736691459731057416954.jpg",
          submittedAt: getRandomDate(2)
        }
      });
      freelancers.push(user);
    }
    console.log(`✅ Đã tạo ${freelancers.length} freelancers (Có 1 người bị reject KYC).`);

    console.log("2. Đang tạo các tài khoản Client giả...");
    const clients = [];
    for (let i = 0; i < 10; i++) { // Đã sửa thành 10 (Đúng bằng số người tham gia mua thật + 1 người Failed)
      const name = getRandomName();
      const email = getRandomEmail(name);
      const user = await User.create({
        role: "client",
        email,
        passwordHash,
        name,
        isVerified: true,
        createdAt: getRandomDate(),
        credits: 0
      });
      clients.push(user);
    }
    console.log(`✅ Đã tạo ${clients.length} clients (Mỗi client đều có ít nhất 1 giao dịch).`);

    console.log("3. Đang tạo Giao dịch bất đối xứng & Tranh chấp...");
    let txCount = 0;
    const fileTitles = [
      "Website bán hàng nội thất", "App quản lý kho bằng React Native", 
      "Tool tự động lấy data web", "Kịch bản chatbot AI tư vấn",
      "Clone giao diện Netflix", "Hệ thống điểm danh sinh viên QR"
    ];
    
    // Cập nhật theo yêu cầu: Sinh viên mới ra mắt thì max 2 đơn/người là thực tế nhất
    const salesConfig = [
      { fIndex: 0, numSales: 2 },
      { fIndex: 1, numSales: 2 },
      { fIndex: 2, numSales: 2 },
      { fIndex: 3, numSales: 1 },
      { fIndex: 4, numSales: 1 },
      { fIndex: 5, numSales: 1 }
    ];

    let clientIndex = 0; // Trỏ tới client để mua hàng (Mỗi client mua 1 đơn)

    for (const conf of salesConfig) {
      const freelancer = freelancers[conf.fIndex];
      for (let i = 0; i < conf.numSales; i++) {
        const client = clients[clientIndex++];
        
        const amount = Math.floor(Math.random() * 500) * 1000 + 100000;
        const creditEarned = amount / 1000;
        const fileDate = getRandomDate(10);
        
        // Giao dịch cuối cùng sẽ bị biến thành Tranh Chấp (Disputed)
        const isDisputed = (conf.fIndex === 5 && i === 0);
        const fileStatus = isDisputed ? "Disputed" : "Paid";

        const file = await File.create({
          freelancerId: freelancer._id,
          intendedClientEmail: client.email,
          title: fileTitles[Math.floor(Math.random() * fileTitles.length)],
          description: "Mô tả dự án mẫu tự động sinh để phục vụ báo cáo doanh thu...",
          projectType: "web",
          price: { amount, currency: "vnd" },
          status: fileStatus,
          demo: { type: "url", url: "https://example.vercel.app" },
          deliveryMethod: "github_repo",
          githubRepoUrl: "https://github.com/example/repo",
          paidAt: fileDate,
          createdAt: new Date(fileDate.getTime() - 86400000) 
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

        // Chỉ cộng tiền nếu không bị tranh chấp
        if (!isDisputed) {
          freelancer.credits += creditEarned;
          await freelancer.save();

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
        }
        txCount++;
      }
    }
    
    // Thêm 1 giao dịch bị FAILED (Khách quét mã xong rớt mạng, ko trả tiền)
    const failedClient = clients[clientIndex++];
    const failedFreelancer = freelancers[6];
    const failedFile = await File.create({
      freelancerId: failedFreelancer._id,
      intendedClientEmail: failedClient.email,
      title: "Ứng dụng Chat Socket.IO",
      description: "Giao dịch thất bại do rớt mạng...",
      projectType: "web",
      price: { amount: 150000, currency: "vnd" },
      status: "Draft",
      demo: { type: "url", url: "https://example.vercel.app" },
      deliveryMethod: "github_repo",
      githubRepoUrl: "https://github.com/example/repo",
      createdAt: getRandomDate(2)
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

    console.log("4. Đang tạo lịch sử Rút Tiền (Có 1 lệnh bị từ chối)...");
    let wdCount = 0;
    // Cho Freelancer 0 và 1 rút tiền thành công
    for (let i = 0; i < 2; i++) {
      const f = freelancers[i];
      if (f.credits > 150) {
        const wdAmount = Math.floor(f.credits - 50); 
        await WithdrawRequest.create({
          userId: f._id,
          amount: wdAmount,
          amountVND: wdAmount * 1000,
          status: 'approved',
          bankDetails: f.payoutSettings,
          adminNote: "Đã chuyển khoản VietQR",
          createdAt: getRandomDate(7),
          approvedAt: getRandomDate(5)
        });
        f.credits -= wdAmount;
        await f.save();
        wdCount++;
      }
    }
    
    // Cho Freelancer 3 tạo lệnh rút tiền nhưng bị REJECTED
    await WithdrawRequest.create({
      userId: freelancers[3]._id,
      amount: 100, // Định rút 100k
      amountVND: 100000,
      status: 'rejected',
      bankDetails: freelancers[3].payoutSettings,
      adminNote: "Tài khoản có dấu hiệu gian lận, tạm giữ tiền.",
      createdAt: getRandomDate(1),
    });

    console.log(`✅ Đã tạo lệnh rút tiền (Có 1 lệnh bị Rejected).`);

    console.log("🎉 Hoàn tất Fake Data chân thực!");
  } catch (err) {
    console.error("❌ Lỗi khi seed data:", err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runSeed();
