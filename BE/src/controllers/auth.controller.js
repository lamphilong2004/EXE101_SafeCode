import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { httpError } from "../middleware/error.js";
import { signJwt } from "../middleware/auth.js";

function sanitizeUser(user) {
  return {
    id: String(user._id),
    email: user.email,
    role: user.role,
    name: user.name || null,
    credits: user.credits,
    subscription: {
      status: user.subscription?.status || "inactive",
      currentPeriodEnd: user.subscription?.currentPeriodEnd || null,
    },
    payoutSettings: {
      ...user.payoutSettings,
      qrCodeUrl: user.payoutSettings?.qrCodeUrl || "",
    } || null,
  };
}

export async function register(req, res, next) {
  try {
    const { email, password, role, name } = req.body || {};
    if (!email || !password || !role) throw httpError(400, "email, password, role are required");
    if (role !== "freelancer" && role !== "client") throw httpError(400, "Invalid role");
    if (String(password).length < 6) throw httpError(400, "Password must be at least 6 characters");

    const existing = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (existing) throw httpError(409, "Email already exists");

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await User.create({
      email: String(email).toLowerCase().trim(),
      passwordHash,
      role,
      name: name ? String(name).trim() : undefined,
      credits: role === 'freelancer' ? 10 : 0, // Give 10 welcome credits
    });

    const token = signJwt(user);
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) throw httpError(400, "email and password are required");

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) throw httpError(401, "Invalid credentials");

    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) throw httpError(401, "Invalid credentials");

    user.lastLoginAt = new Date();
    await user.save();

    const token = signJwt(user);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) throw httpError(401, "Unauthorized");
    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function updatePayoutSettings(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) throw httpError(404, "User not found");

    const { bankName, accountNumber, accountName, qrCodeUrl } = req.body;
    user.payoutSettings = {
      bankName: String(bankName || "").trim(),
      accountNumber: String(accountNumber || "").trim(),
      accountName: String(accountName || "").trim(),
      qrCodeUrl: String(qrCodeUrl || "").trim(),
    };

    await user.save();
    res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}
