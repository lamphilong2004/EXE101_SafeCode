/**
 * Run: node create-admin.js
 * Tạo tài khoản admin mặc định: admin@safecode.com / secret123
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const MONGODB_URI = "mongodb://127.0.0.1:27017/safecode";

const USER_SCHEMA = new mongoose.Schema({
  role: { type: String },
  email: { type: String, lowercase: true, trim: true, unique: true },
  passwordHash: { type: String },
  name: { type: String },
  phone: { type: String, default: null },
  credits: { type: Number, default: 0 },
  payoutSettings: { bankName: String, accountNumber: String, accountName: String },
  lastLoginAt: { type: Date, default: null },
}, { timestamps: true });

const User = mongoose.model("User", USER_SCHEMA);

await mongoose.connect(MONGODB_URI);
console.log("[DB] Connected to", MONGODB_URI);

// Delete existing admin (to fix potentially corrupted hash) and recreate
const deleted = await User.deleteOne({ email: "admin@safecode.com" });
if (deleted.deletedCount > 0) {
  console.log("[DELETE] Removed old admin user.");
}

const passwordHash = await bcrypt.hash("secret123", 10);
const admin = await User.create({
  role: "admin",
  email: "admin@safecode.com",
  passwordHash,
  name: "SafeCode Admin",
});
console.log("[OK] Admin created:", admin.email);
console.log("     Email: admin@safecode.com");
console.log("     Password: secret123");

await mongoose.disconnect();
process.exit(0);
