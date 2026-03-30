import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { httpError } from "./error.js";

export function signJwt(user) {
  return jwt.sign(
    { sub: String(user._id), role: user.role, email: user.email },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

export async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith("Bearer ")) throw httpError(401, "Missing token");

    const token = auth.slice("Bearer ".length);
    const payload = jwt.verify(token, env.JWT_SECRET);

    const user = await User.findById(payload.sub);
    if (!user) throw httpError(401, "Invalid token");

    req.user = {
      id: String(user._id),
      role: user.role,
      email: user.email,
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") return next(httpError(401, "Token expired"));
    if (err.name === "JsonWebTokenError") return next(httpError(401, "Invalid token"));
    next(httpError(401, "Unauthorized"));
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(httpError(401, "Unauthorized"));
    if (!roles.includes(req.user.role)) return next(httpError(403, "Forbidden"));
    next();
  };
}
