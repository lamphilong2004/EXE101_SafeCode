import bcrypt from "bcryptjs";
import crypto from "crypto";
import { User } from "../models/User.js";
import { httpError } from "../middleware/error.js";
import { signJwt } from "../middleware/auth.js";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import { sendPasswordResetEmail } from "../services/email.service.js";

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

export async function updateProfile(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) throw httpError(404, "User not found");

    const { name, companyName } = req.body;
    if (name !== undefined) user.name = String(name).trim();
    // Assuming companyName could be stored in a new field or just in name
    // For now we'll just update name. If companyName is provided, we can store it in user.companyName (need to update schema, or just skip it).

    await user.save();
    res.json({ success: true, user: sanitizeUser(user) });
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

async function getGoogleUserPayload(idToken) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const isMock = !clientId || clientId.startsWith("YOUR_") || clientId === "mock";

  if (isMock) {
    console.warn("[WARNING] Google Client ID is not configured or is a mock placeholder. Decoding ID token WITHOUT verification.");
    const decoded = jwt.decode(idToken);
    if (!decoded) {
      throw httpError(400, "Invalid ID Token structure");
    }
    return decoded;
  }

  try {
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });
    return ticket.getPayload();
  } catch (err) {
    console.error("Google token verification failed:", err);
    throw httpError(401, "Google token verification failed: " + err.message);
  }
}

export async function googleLogin(req, res, next) {
  try {
    const { token: idToken, role, isRegisteringConfirmation } = req.body || {};
    if (!idToken) throw httpError(400, "Google ID token is required");

    const payload = await getGoogleUserPayload(idToken);
    const { email, name } = payload || {};
    if (!email) throw httpError(400, "Could not extract email from Google token");

    let user = await User.findOne({ email: String(email).toLowerCase().trim() });
    
    if (!user) {
      if (!isRegisteringConfirmation) {
        return res.status(202).json({ actionRequired: 'select_role', email, name });
      }

      const resolvedRole = role || 'client';
      if (resolvedRole !== 'freelancer' && resolvedRole !== 'client') {
        throw httpError(400, "Invalid role for registration");
      }
      
      const randomPassword = Math.random().toString(36).substring(2, 15);
      const passwordHash = await bcrypt.hash(randomPassword, 10);
      
      user = await User.create({
        email: String(email).toLowerCase().trim(),
        passwordHash,
        role: resolvedRole,
        name: name ? String(name).trim() : email.split('@')[0],
        credits: resolvedRole === 'freelancer' ? 10 : 0,
      });
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = signJwt(user);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body || {};
    if (!email) throw httpError(400, "Email is required");

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) {
      return res.json({ success: true, message: "If that email is registered, we have sent a reset link." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `${req.headers.origin || "http://localhost:5173"}?token=${resetToken}`;
    await sendPasswordResetEmail(user.email, resetUrl);

    res.json({ success: true, message: "If that email is registered, we have sent a reset link." });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) throw httpError(400, "Token and new password are required");
    if (String(newPassword).length < 6) throw httpError(400, "Password must be at least 6 characters");

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) throw httpError(400, "Invalid or expired reset token");

    user.passwordHash = await bcrypt.hash(String(newPassword), 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    res.json({ success: true, message: "Password has been reset successfully" });
  } catch (err) {
    next(err);
  }
}
