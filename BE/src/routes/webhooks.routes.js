import { Router } from "express";
import express from "express";
import { stripeWebhook } from "../controllers/webhooks.controller.js";

export const webhooksRoutes = Router();

// Stripe requires the raw body to verify signatures.
webhooksRoutes.post("/stripe", express.raw({ type: "application/json" }), stripeWebhook);
