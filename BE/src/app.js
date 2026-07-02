import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import swaggerUi from "swagger-ui-express";

import { env } from "./config/env.js";
import { swaggerSpec } from "./config/swagger.js";
import { routes } from "./routes/index.js";
import { notFoundHandler, errorHandler } from "./middleware/error.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  // Disable CSP and X-Frame-Options so the Proxy can be embedded in iframe across different domains (Vercel, localhost)
  app.use(helmet({ 
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    xFrameOptions: false
  }));

  const allowedOrigins = String(env.CORS_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const isDevLocalOrigin = (origin) => {
    if (!origin) return true;
    if (env.NODE_ENV === "production") return false;
    return /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(String(origin));
  };

  app.use(
    cors({
      origin(origin, cb) {
        if (isDevLocalOrigin(origin)) return cb(null, true);
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        if (origin.endsWith('.vercel.app')) return cb(null, true); // Allow any Vercel deployment
        return cb(new Error("Not allowed by CORS"));
      },
      credentials: true,
    })
  );

  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 300, // Relaxed for dev/heavy UI interaction
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // JSON for most routes. Stripe webhook must receive raw body for signature verification.
  const jsonParser = express.json({ limit: "2mb" });
  app.use((req, res, next) => {
    if (req.originalUrl.startsWith("/webhooks/stripe")) return next();
    return jsonParser(req, res, next);
  });

  app.get("/health", (req, res) => res.json({ ok: true }));

  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Proxy Asset Interceptor: Fixes absolute paths (e.g. /assets/...) from Vercel SPAs
  app.use((req, res, next) => {
    const referer = req.get("Referer");
    if (referer) {
      const match = referer.match(/\/proxy\/demo\/([^/]+)/);
      if (match) {
        const fileId = match[1];
        // If it doesn't match an internal API route, assume it's a proxy asset
        const isApiRoute = ["/auth", "/billing", "/credits", "/files", "/payments", "/proxy", "/preview", "/admin", "/messages", "/notifications", "/reviews", "/kyc", "/webhooks", "/api-docs"].some(r => req.originalUrl.startsWith(r));
        if (!isApiRoute) {
          req.url = `/proxy/demo/${fileId}${req.url}`;
        }
      }
    }
    next();
  });

  app.use(routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
