import { stripe } from "../services/stripe.service.js";
import payos from "../services/payos.service.js";
import { env } from "../config/env.js";
import { File } from "../models/File.js";
import { Transaction } from "../models/Transaction.js";
import { User } from "../models/User.js";
import { CreditHistory } from "../models/CreditHistory.js";
import { CreditRequest } from "../models/CreditRequest.js";
import { createNotification } from "../socket.js";

export async function stripeWebhook(req, res) {
  const sig = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const checkoutSessionId = session.id;
      const paymentIntentId = session.payment_intent;
      const customerEmail = session.customer_details?.email || session.customer_email;

      // Handle Credit Purchase
      if (session.metadata && session.metadata.creditPurchase === "true") {
        const userId = session.metadata.userId;
        const creditsToBuy = parseInt(session.metadata.creditsToBuy, 10);
        
        const user = await User.findById(userId);
        if (user) {
          // Add credits
          user.credits = (user.credits || 0) + creditsToBuy;
          await user.save();

          // Log history
          await CreditHistory.create({
            userId: user._id,
            type: "purchase",
            amount: creditsToBuy,
            description: `Nạp ${creditsToBuy} Credits qua Stripe`,
            balanceAfter: user.credits,
            fileId: null,
          });
        }
        return res.json({ received: true });
      }

      // Handle File Payment
      const fileDoc = await File.findOne({ "stripe.checkoutSessionId": checkoutSessionId });
      if (fileDoc) {
        if (fileDoc.status !== "Paid") {
          fileDoc.status = "Paid";
          fileDoc.paidAt = new Date();
          fileDoc.stripe.paymentIntentId = paymentIntentId || null;
          fileDoc.stripe.customerId = session.customer || null;
          await fileDoc.save();
        }

        // idempotency: store eventId unique
        await Transaction.updateOne(
          { "stripe.eventId": event.id },
          {
            $setOnInsert: {
              fileId: fileDoc._id,
              freelancerId: fileDoc.freelancerId,
              clientEmail: (customerEmail || fileDoc.intendedClientEmail || "").toLowerCase(),
              type: "checkout",
              status: "Succeeded",
              amount: session.amount_total || fileDoc.price.amount,
              currency: (session.currency || fileDoc.price.currency || "usd").toLowerCase(),
              stripe: {
                eventId: event.id,
                checkoutSessionId,
                paymentIntentId: paymentIntentId || null,
                customerId: session.customer || null,
              },
            },
          },
          { upsert: true }
        );

        await Transaction.updateMany(
          { fileId: fileDoc._id, type: "checkout", status: "Pending", "stripe.checkoutSessionId": checkoutSessionId },
          { $set: { status: "Succeeded", "stripe.paymentIntentId": paymentIntentId || null, "stripe.eventId": event.id } }
        );
      }
    }

    return res.json({ received: true });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Stripe webhook handler failed", err);
    return res.status(500).json({ error: "Webhook handler error" });
  }
}

export async function payosWebhook(req, res) {
  try {
    let webhookData = null;
    try {
      webhookData = typeof payos.verifyPaymentWebhookData === "function" 
        ? payos.verifyPaymentWebhookData(req.body)
        : payos.webhooks.verify(req.body);
    } catch (err) {
      console.warn("PayOS Signature Verification Failed, falling back to API verification", err.message);
      webhookData = req.body.data || req.body;
    }

    const orderCode = webhookData?.orderCode || webhookData?.data?.orderCode || req.body.data?.orderCode;

    if (!orderCode) {
      return res.json({ success: true, message: "No orderCode found" });
    }

    // Verify payment status via PayOS API directly to be absolutely sure
    let isSuccess = false;
    try {
      const paymentInfo = await payos.getPaymentLinkInformation(orderCode);
      isSuccess = paymentInfo && paymentInfo.status === "PAID";
    } catch (err) {
      console.error("Failed to fetch payment link info from PayOS:", err.message);
      isSuccess = req.body.code === "00" || webhookData?.code === "00" || req.body.desc === "success";
    }

    if (isSuccess && orderCode) {
      const fileDoc = await File.findOne({ "payos.orderCode": orderCode });

      if (fileDoc && fileDoc.status !== "Paid") {
        fileDoc.status = "Paid";
        fileDoc.paidAt = new Date();
        await fileDoc.save();

        await Transaction.updateMany(
          { fileId: fileDoc._id, type: "checkout", status: "Pending", "payos.orderCode": orderCode },
          { $set: { status: "Succeeded" } }
        );

        // Notify client via room
        import("../socket.js").then(({ emitToRoom }) => {
          emitToRoom(fileDoc._id.toString(), "file_paid", { fileId: fileDoc._id });
        });

        // Issue License and notify client
        try {
          const { issueLicense } = await import("../services/license.service.js");
          const { sendDecryptionKeyEmail } = await import("../services/email.service.js");
          // Find the checkout transaction to get the client's user ID
          const transaction = await Transaction.findOne({ "payos.orderCode": orderCode, type: "checkout" });
          if (transaction) {
            const { key: licenseSerial } = await issueLicense(String(transaction.userId), fileDoc._id);
            await sendDecryptionKeyEmail(fileDoc.intendedClientEmail, {
              fileName: fileDoc.title,
              licenseKey: licenseSerial,
              isV3: true,
            });
          }
        } catch (licErr) {
          console.error("[FILE PAYMENT WEBHOOK] License issue failed:", licErr);
        }

        // Notify Freelancer (Escrow - money in platform)
        await createNotification(
          fileDoc.freelancerId,
          "payment_received",
          `Khách hàng đã thanh toán qua VietQR cho file "${fileDoc.title}". Tiền đã vào tài khoản nền tảng.`,
          { relatedFileId: fileDoc._id }
        );
      }

      // Check if it's a Credit Top-up
      const creditReq = await CreditRequest.findOne({ payosOrderCode: orderCode });
      if (creditReq && creditReq.status === "pending") {
        creditReq.status = "approved";
        creditReq.approvedAt = new Date();
        await creditReq.save();

        // === CREDIT PURCHASE: Credit the USER ===
        const user = await User.findById(creditReq.userId);
          if (user) {
            user.credits = (user.credits || 0) + creditReq.amount;
            await user.save();

            await CreditHistory.create({
              userId: user._id,
              type: "deposit",
              amount: creditReq.amount,
              description: `Nạp ${creditReq.amount} Credits qua VietQR (PayOS)`,
              balanceAfter: user.credits,
              fileId: null,
            });

            await createNotification(
              user._id,
              "credit_approved",
              `Thanh toán thành công. ${creditReq.amount} Credit đã được cộng vào tài khoản của bạn.`,
              {}
            );
          }
        }
      }
    return res.json({ success: true });
  } catch (err) {
    console.error("PayOS webhook handler failed", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
