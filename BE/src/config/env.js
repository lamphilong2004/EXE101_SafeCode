import dotenv from "dotenv";

dotenv.config();

function required(name) {
  const val = process.env[name];
  if (!val) throw new Error(`Missing env var: ${name}`);
  return val;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: Number(process.env.PORT || 4000),
  CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",

  MONGODB_URI: required("MONGODB_URI"),

  JWT_SECRET: required("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  AWS_REGION: process.env.AWS_REGION || "ap-southeast-1",
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || "mock",
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || "mock",
  S3_BUCKET_ENCRYPTED: process.env.S3_BUCKET_ENCRYPTED,
  S3_BUCKET_PUBLIC: process.env.S3_BUCKET_PUBLIC,

  // SMTP for Notifications
  SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM || '"SafeCode" <no-reply@safecode.app>',

  MASTER_KEY_B64: required("MASTER_KEY_B64"),

  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "mock",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "mock",
  APP_BASE_URL: process.env.APP_BASE_URL || "http://localhost:5173",

  TRIAL_DURATION_HOURS: Number(process.env.TRIAL_DURATION_HOURS) || 24,

  // BANK TRANSFER DETAILS
  BANK_NAME: process.env.BANK_NAME || "Vietcombank",
  BANK_ACCOUNT_NO: process.env.BANK_ACCOUNT_NO || "0123456789",
  BANK_ACCOUNT_NAME: process.env.BANK_ACCOUNT_NAME || "SAFECODE JSC",
  BANK_BRANCH: process.env.BANK_BRANCH || "HCM",
};
