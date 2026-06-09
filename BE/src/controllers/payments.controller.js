import { File } from "../models/File.js";
import { Transaction } from "../models/Transaction.js";
import { httpError } from "../middleware/error.js";
import { stripe } from "../services/stripe.service.js";
import payos, { isPayosConfigured } from "../services/payos.service.js";
import { env } from "../config/env.js";

export async function createCheckout(req, res, next) {
  try {
    const { fileId } = req.params;

    const fileDoc = await File.findById(fileId);
    if (!fileDoc) throw httpError(404, "File not found");

    if (fileDoc.intendedClientEmail !== req.user.email) throw httpError(403, "Forbidden");

    if (fileDoc.status === "Paid") {
      return res.json({ alreadyPaid: true });
    }

    if (fileDoc.status !== "Uploaded" && fileDoc.status !== "CheckoutCreated") {
      throw httpError(409, "File is not ready for checkout");
    }

    const { successUrl, cancelUrl } = req.body || {};

    const finalSuccessUrl = successUrl || `${env.APP_BASE_URL}/payment/success?fileId=${fileId}`;
    const finalCancelUrl = cancelUrl || `${env.APP_BASE_URL}/payment/cancel?fileId=${fileId}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: req.user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: fileDoc.price.currency,
            unit_amount: fileDoc.price.amount,
            product_data: {
              name: fileDoc.title,
              description: fileDoc.description?.slice(0, 400) || undefined,
            },
          },
        },
      ],
      metadata: {
        fileId: String(fileDoc._id),
        freelancerId: String(fileDoc.freelancerId),
      },
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
    });

    fileDoc.status = "CheckoutCreated";
    fileDoc.stripe.checkoutSessionId = session.id;
    await fileDoc.save();

    await Transaction.create({
      fileId: fileDoc._id,
      freelancerId: fileDoc.freelancerId,
      clientEmail: req.user.email,
      type: "checkout",
      status: "Pending",
      amount: fileDoc.price.amount,
      currency: fileDoc.price.currency,
      stripe: {
        checkoutSessionId: session.id,
        customerId: session.customer || null,
      },
    });

    res.json({ checkoutUrl: session.url, checkoutSessionId: session.id });
  } catch (err) {
    next(err);
  }
}

export async function createPayosCheckout(req, res, next) {
  try {
    if (!isPayosConfigured) {
      throw httpError(500, "PayOS chưa được cấu hình. Vui lòng thêm API Key vào .env");
    }

    const { fileId } = req.params;
    const fileDoc = await File.findById(fileId);
    if (!fileDoc) throw httpError(404, "File not found");
    if (fileDoc.intendedClientEmail !== req.user.email) throw httpError(403, "Forbidden");
    if (fileDoc.status === "Paid") return res.json({ alreadyPaid: true });
    if (fileDoc.status !== "Uploaded" && fileDoc.status !== "CheckoutCreated" && fileDoc.status !== "Locked") {
      throw httpError(409, "File is not ready for checkout");
    }

    const { successUrl, cancelUrl } = req.body || {};
    const finalSuccessUrl = successUrl || `${env.APP_BASE_URL}/payment/success?fileId=${fileId}`;
    const finalCancelUrl = cancelUrl || `${env.APP_BASE_URL}/payment/cancel?fileId=${fileId}`;

    const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000));
    
    // Amount in VND. Assuming fileDoc.price.amount is already VND if we are using VietQR.
    const amount = fileDoc.price.currency.toLowerCase() === 'vnd' 
      ? fileDoc.price.amount 
      : fileDoc.price.amount * 25000; // rough fallback

    const paymentData = {
      orderCode,
      amount,
      description: `Thanh toan file ${fileId.slice(-4)}`,
      items: [
        {
          name: fileDoc.title.slice(0, 50),
          quantity: 1,
          price: amount
        }
      ],
      returnUrl: finalSuccessUrl,
      cancelUrl: finalCancelUrl
    };

    const paymentLinkRes = await payos.createPaymentLink(paymentData);

    fileDoc.status = "CheckoutCreated";
    fileDoc.payos = { orderCode, paymentLinkId: paymentLinkRes.paymentLinkId };
    await fileDoc.save();

    await Transaction.create({
      fileId: fileDoc._id,
      freelancerId: fileDoc.freelancerId,
      clientEmail: req.user.email,
      type: "checkout",
      status: "Pending",
      amount,
      currency: "VND",
      payos: {
        orderCode,
        paymentLinkId: paymentLinkRes.paymentLinkId
      }
    });

    res.json({ checkoutUrl: paymentLinkRes.checkoutUrl });
  } catch (err) {
    next(err);
  }
}
