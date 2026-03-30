import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
});

export async function sendDecryptionKeyEmail(to, { fileName, keyB64, ivB64, authTagB64 }) {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    console.warn("[MAIL] SMTP not configured. Key for", fileName, "is:", keyB64);
    return;
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 12px;">
      <h2 style="color: #4f46e5;">Thanh toán hoàn tất! 🔓</h2>
      <p>Chúc mừng! Freelancer đã xác nhận nhận được thanh toán cho dự án <strong>${fileName}</strong>.</p>
      <p>Dưới đây là thông số kỹ thuật để giải mã sản phẩm của bạn (Hệ thống sẽ tự nhận diện khi bạn bấm 'Unlock' trên Dashboard):</p>
      
      <div style="background: #f8fafc; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 13px; border: 1px solid #cbd5e1; margin: 16px 0;">
        <p><strong>Key (Base64):</strong> ${keyB64}</p>
        <p><strong>IV:</strong> ${ivB64}</p>
        <p><strong>Auth Tag:</strong> ${authTagB64}</p>
      </div>

      <p>Bạn có thể truy cập Dashboard để tải file và tự động giải mã ngay bây giờ.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #64748b;">Đây là email tự động từ SafeCode. Vui lòng không trả lời email này.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject: `[SafeCode] Key giải mã cho dự án: ${fileName}`,
      html,
    });
    console.log(`[MAIL] Decryption key sent to ${to}`);
  } catch (err) {
    console.error("[MAIL] Failed to send email:", err);
  }
}
