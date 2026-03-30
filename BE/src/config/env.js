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

  AWS_REGION: required("AWS_REGION"),
  AWS_ACCESS_KEY_ID: required("AWS_ACCESS_KEY_ID"),
  AWS_SECRET_ACCESS_KEY: required("AWS_SECRET_ACCESS_KEY"),
  S3_BUCKET_ENCRYPTED: process.env.S3_BUCKET_ENCRYPTED,
  S3_BUCKET_PUBLIC: process.env.S3_BUCKET_PUBLIC,

  // SMTP for Notifications
  SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM || '"SafeCode" <no-reply@safecode.app>',

  MASTER_KEY_B64: required("MASTER_KEY_B64"),

  STRIPE_SECRET_KEY: required("STRIPE_SECRET_KEY"),
  STRIPE_WEBHOOK_SECRET: required("STRIPE_WEBHOOK_SECRET"),
  APP_BASE_URL: process.env.APP_BASE_URL || "http://localhost:5173",

  TRIAL_DURATION_HOURS: Number(process.env.TRIAL_DURATION_HOURS) || 24,
};
