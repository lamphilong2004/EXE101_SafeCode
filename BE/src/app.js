import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { env } from "./config/env.js";
import { routes } from "./routes/index.js";
import { notFoundHandler, errorHandler } from "./middleware/error.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    })
  );

  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

  app.use(
    rateLimit({
      windowMs: 60_000,
      limit: 120,
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

  app.use(routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
