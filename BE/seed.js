/**
 * Run: node seed.js
 * Seeds: freelancer@gmail.com/123456, client@gmail.com/123456, admin@safecode.com/secret123
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

const UserSchema = new mongoose.Schema({
  role: { type: String },
  email: { type: String, lowercase: true, trim: true, unique: true },
  passwordHash: { type: String },
  name: { type: String },
  phone: { type: String, default: null },
  credits: { type: Number, default: 3 },
  payoutSettings: {
    bankName: { type: String, default: "" },
    accountNumber: { type: String, default: "" },
    accountName: { type: String, default: "" },
  },
  lastLoginAt: { type: Date, default: null },
}, { timestamps: true });

const User = mongoose.model("User", UserSchema);

await mongoose.connect(MONGODB_URI);
console.log("[DB] Connected to", MONGODB_URI.substring(0, 40) + "...");

const users = [
  {
    role: "freelancer",
    email: "freelancer@gmail.com",
    password: "123456",
    name: "Alex Freelance",
    credits: 10,
    payoutSettings: {
      bankName: "Vietcombank (VCB)",
      accountNumber: "0123456789",
      accountName: "ALEX FREELANCE",
    },
  },
  {
    role: "client",
    email: "client@gmail.com",
    password: "123456",
    name: "Client User",
    credits: 0,
  },
  {
    role: "admin",
    email: "admin@safecode.com",
    password: "secret123",
    name: "SafeCode Admin",
    credits: 0,
  },
];

for (const u of users) {
  const existing = await User.findOne({ email: u.email });
  if (existing) {
    // Update with fresh hash in case of corruption
    const passwordHash = await bcrypt.hash(u.password, 10);
    await User.updateOne({ email: u.email }, { $set: { passwordHash, name: u.name, payoutSettings: u.payoutSettings || {}, credits: u.credits } });
    console.log(`[UPDATE] ${u.email} — refreshed`);
  } else {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await User.create({ ...u, passwordHash, password: undefined });
    console.log(`[CREATE] ${u.email} (${u.role}) — created`);
  }
}

console.log("\n✅ Done! Test accounts:");
console.log("   Freelancer: freelancer@gmail.com / 123456");
console.log("   Client:     client@gmail.com / 123456");
console.log("   Admin:      admin@safecode.com / secret123");

await mongoose.disconnect();
process.exit(0);
