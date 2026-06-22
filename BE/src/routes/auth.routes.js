import { Router } from "express";
import rateLimit from "express-rate-limit";
import { login, me, register, updatePayoutSettings, updateProfile, googleLogin, forgotPassword, resetPassword, verifyOtp, resendOtp } from "../controllers/auth.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export const authRoutes = Router();

// Stricter rate limit for auth endpoints (brute-force prevention)
const authLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many auth attempts. Please try again in 1 minute." },
});

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: API xác thực và quản lý tài khoản người dùng
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - name
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minimum: 6
 *                 example: 123456
 *               name:
 *                 type: string
 *                 example: Nguyễn Văn A
 *               role:
 *                 type: string
 *                 enum: [freelancer, client, admin]
 *                 example: freelancer
 *     responses:
 *       201:
 *         description: Đăng ký thành công và trả về JWT Token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Dữ liệu đầu vào không hợp lệ hoặc email đã tồn tại
 */
authRoutes.post("/register", authLimiter, register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Đăng nhập tài khoản
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: 123456
 *     responses:
 *       200:
 *         description: Đăng nhập thành công, trả về Token và thông tin User
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       401:
 *         description: Sai email hoặc mật khẩu
 */
authRoutes.post("/login", authLimiter, login);
authRoutes.post("/google", authLimiter, googleLogin);
authRoutes.post("/forgot-password", authLimiter, forgotPassword);
authRoutes.post("/reset-password", authLimiter, resetPassword);
authRoutes.post("/verify-otp", authLimiter, verifyOtp);
authRoutes.post("/resend-otp", authLimiter, resendOtp);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Lấy thông tin tài khoản hiện tại (Yêu cầu Token)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trả về thông tin người dùng hiện tại
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 role:
 *                   type: string
 *                 credits:
 *                   type: number
 *       401:
 *         description: Chưa xác thực (Token không hợp lệ hoặc thiếu)
 */
authRoutes.get("/me", requireAuth, me);

authRoutes.put("/me", requireAuth, updateProfile);
authRoutes.put("/me/payout", requireAuth, requireRole("freelancer"), updatePayoutSettings);
