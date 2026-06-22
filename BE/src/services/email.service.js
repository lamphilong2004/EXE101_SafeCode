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

export async function sendDecryptionKeyEmail(to, { fileName, keyB64, ivB64, authTagB64, licenseKey, isV3 }) {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    console.warn("[MAIL] SMTP not configured. License for", fileName, "is:", licenseKey || keyB64);
    return;
  }

  const html = isV3 ? `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 12px;">
      <h2 style="color: #4f46e5;">Thanh toán hoàn tất! 🔓</h2>
      <p>Chúc mừng! Freelancer đã xác nhận nhận được thanh toán cho dự án <strong>${fileName}</strong>.</p>
      <p>Dưới đây là <strong>Mã kích hoạt (License Serial)</strong> của bạn:</p>
      
      <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; font-family: monospace; font-size: 18px; font-weight: bold; text-align: center; border: 2px dashed #4f46e5; margin: 24px 0; color: #1e293b; letter-spacing: 1px;">
        ${licenseKey}
      </div>

      <p><strong>Hướng dẫn:</strong></p>
      <ol>
        <li>Truy cập Dashboard SafeCode.</li>
        <li>Bấm vào nút <strong>"Unlock & Download"</strong> bên cạnh dự án.</li>
        <li>Nhập mã Serial trên để kích hoạt và tải file đã giải mã.</li>
      </ol>

      <p style="font-size: 13px; color: #64748b;">Lưu ý: Mã này chỉ dùng được trên tối đa 3 thiết bị.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #64748b;">Đây là email tự động từ SafeCode.</p>
    </div>
  ` : `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 12px;">
      <h2 style="color: #4f46e5;">Thanh toán hoàn tất! 🔓</h2>
      <p>Chúc mừng! Freelancer đã xác nhận nhận được thanh toán cho dự án <strong>${fileName}</strong>.</p>
      <div style="background: #f8fafc; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 13px; border: 1px solid #cbd5e1; margin: 16px 0;">
        <p><strong>Key (Base64):</strong> ${keyB64}</p>
        <p><strong>IV:</strong> ${ivB64}</p>
        <p><strong>Auth Tag:</strong> ${authTagB64}</p>
      </div>
      <p>Bạn có thể truy cập Dashboard để tải file và tự động giải mã ngay bây giờ.</p>
    </div>
  `;

  try {
    const subject = isV3 ? `[SafeCode] License Key cho dự án: ${fileName}` : `[SafeCode] Key giải mã cho dự án: ${fileName}`;
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      html,
    });
    console.log(`[MAIL] ${isV3 ? 'License' : 'Decryption key'} sent to ${to}`);
  } catch (err) {
    console.error("[MAIL] Failed to send email:", err);
  }
}

export async function sendPasswordResetEmail(to, resetUrl) {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    console.warn("[MAIL] SMTP not configured. Password reset link for", to, "is:", resetUrl);
    return;
  }

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #e2e8f0; padding: 24px; border-radius: 12px;">
      <h2 style="color: #4f46e5;">Khôi phục mật khẩu 🔒</h2>
      <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản SafeCode của mình.</p>
      <p>Vui lòng bấm vào nút dưới đây để thiết lập mật khẩu mới (link này có hiệu lực trong 1 giờ):</p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${resetUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
          Đặt lại mật khẩu
        </a>
      </div>

      <p>Hoặc bạn có thể copy và dán đường link này vào trình duyệt:</p>
      <p style="background: #f1f5f9; padding: 12px; border-radius: 8px; font-size: 13px; word-break: break-all;">
        <a href="${resetUrl}" style="color: #4f46e5;">${resetUrl}</a>
      </p>

      <p style="font-size: 13px; color: #64748b; margin-top: 24px;">Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
      <p style="font-size: 12px; color: #64748b;">Đây là email tự động từ SafeCode.</p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject: "[SafeCode] Khôi phục mật khẩu tài khoản",
      html,
    });
    console.log(`[MAIL] Password reset email sent to ${to}`);
  } catch (err) {
    console.error("[MAIL] Failed to send password reset email:", err);
  }
}
