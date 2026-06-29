import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { CreditHistory } from "../models/CreditHistory.js";
import { CreditRequest } from "../models/CreditRequest.js";
import { calculateUploadCost } from "../services/credit.service.js";
import { httpError } from "../middleware/error.js";
import { stripe } from "../services/stripe.service.js";
import payos, { isPayosConfigured } from "../services/payos.service.js";
import { env } from "../config/env.js";

export const creditRoutes = Router();

// Any authenticated user can view their credit history
creditRoutes.get("/history", requireAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      CreditHistory.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      CreditHistory.countDocuments({ userId: req.user.id }),
    ]);

    res.json({ records, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
});

// Estimate upload cost before committing
creditRoutes.post("/estimate", requireAuth, async (req, res, next) => {
  try {
    const { projectType, sizeBytes, trialMinutes } = req.body || {};

    const cost = calculateUploadCost({
      projectType: projectType || "web",
      sizeBytes: Number(sizeBytes) || 0,
      trialMinutes: Number(trialMinutes) || 0,
    });

    res.json({
      estimatedCredits: cost,
      breakdown: {
        baseCost: 1,
        trialCost: cost - 1,
      },
    });
  } catch (err) {
    next(err);
  }
});

// Buy credits via Stripe Checkout
creditRoutes.post("/buy", requireAuth, async (req, res, next) => {
  try {
    const { amount } = req.body;
    const creditsToBuy = parseInt(amount, 10);
    
    if (isNaN(creditsToBuy) || creditsToBuy <= 0) {
      throw httpError(400, "Invalid credit amount");
    }

    // Price: 1,000 VND per credit. Adjust here if needed.
    const unitPriceVND = 1000;
    const totalAmount = creditsToBuy * unitPriceVND;

    const { successUrl, cancelUrl } = req.body || {};
    const finalSuccessUrl = successUrl || `${env.APP_BASE_URL}/settings/credits?success=true`;
    const finalCancelUrl = cancelUrl || `${env.APP_BASE_URL}/settings/credits?canceled=true`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: req.user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "vnd",
            unit_amount: totalAmount,
            product_data: {
              name: `${creditsToBuy} SafeCode Credits`,
              description: `Nạp ${creditsToBuy} Credits vào tài khoản.`,
            },
          },
        },
      ],
      metadata: {
        creditPurchase: "true",
        userId: String(req.user.id),
        creditsToBuy: String(creditsToBuy),
      },
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
    });

    res.json({ checkoutUrl: session.url, checkoutSessionId: session.id });
  } catch (err) {
    next(err);
  }
});

// [NEW] Buy credits via PayOS
creditRoutes.post("/buy-payos", requireAuth, async (req, res, next) => {
  try {
    if (!isPayosConfigured) {
      throw httpError(500, "PayOS chưa được cấu hình. Vui lòng thêm API Key vào .env");
    }

    const { amount } = req.body;
    const creditsToBuy = parseInt(amount, 10);
    
    if (isNaN(creditsToBuy) || creditsToBuy <= 0) {
      throw httpError(400, "Invalid credit amount");
    }

    // Price: 1,000 VND per credit.
    const unitPriceVND = 1000;
    const totalAmount = creditsToBuy * unitPriceVND;

    const { successUrl, cancelUrl } = req.body || {};
    const finalSuccessUrl = successUrl || `${env.APP_BASE_URL}/settings/credits?success=true`;
    const finalCancelUrl = cancelUrl || `${env.APP_BASE_URL}/settings/credits?canceled=true`;

    const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000));

    const paymentData = {
      orderCode,
      amount: totalAmount,
      description: `Nap ${creditsToBuy} Credit`,
      items: [
        {
          name: `${creditsToBuy} SafeCode Credits`,
          quantity: 1,
          price: totalAmount
        }
      ],
      returnUrl: finalSuccessUrl,
      cancelUrl: finalCancelUrl
    };

    const paymentLinkRes = await payos.createPaymentLink(paymentData);

    const request = new CreditRequest({
      userId: req.user.id,
      amount: creditsToBuy,
      amountVND: totalAmount,
      status: 'pending',
      payosOrderCode: orderCode,
      paymentLinkId: paymentLinkRes.paymentLinkId
    });

    await request.save();

    res.json({ checkoutUrl: paymentLinkRes.checkoutUrl, orderCode });
  } catch (err) {
    next(err);
  }
});

// [NEW] Request manual top-up (Bank Transfer + Bill Upload)
creditRoutes.post("/request", requireAuth, async (req, res, next) => {
  try {
    const { amount, billImageUrl } = req.body;
    const creditsToBuy = parseInt(amount, 10);
    
    if (isNaN(creditsToBuy) || creditsToBuy <= 0) {
      throw httpError(400, "Invalid credit amount");
    }
    if (!billImageUrl) {
      throw httpError(400, "Bill image is required");
    }

    const unitPriceVND = 1000; // 1000 VND / Credit
    const totalAmount = creditsToBuy * unitPriceVND;

    // AI OCR verification stub (Plan C foundation)
    // Simulate an AI scanning the bill. 
    // In production, this would call AWS Textract, Google Vision, or a custom ML proxy service.
    const runAIOcrStub = (url, expectedAmount) => {
      // Fake logic: if bill contains "success", we pretend AI successfully read the exact expected amount
      if (url.includes("success")) {
        return { detected: true, confidence: 0.95, suggestedAmount: expectedAmount };
      } 
      // Failed scan or mismatch
      return { detected: true, confidence: 0.45, suggestedAmount: 0 };
    };

    const ocrResult = runAIOcrStub(billImageUrl, totalAmount);
    
    const request = new CreditRequest({
      userId: req.user.id,
      amount: creditsToBuy,
      amountVND: totalAmount,
      status: 'pending',
      billImageUrl,
      aiVerification: ocrResult
    });

    await request.save();

    res.status(201).json({ success: true, request });
  } catch (err) {
    next(err);
  }
});

// [NEW] Get my top-up requests
creditRoutes.get("/my-requests", requireAuth, async (req, res, next) => {
  try {
    const requests = await CreditRequest.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ requests });
  } catch (err) {
    next(err);
  }
});

// [NEW] Get Bank Information
creditRoutes.get("/bank-info", requireAuth, (req, res) => {
  res.json({
    bankName: env.BANK_NAME,
    accountNumber: env.BANK_ACCOUNT_NO,
    accountName: env.BANK_ACCOUNT_NAME,
    branch: env.BANK_BRANCH
  });
});
