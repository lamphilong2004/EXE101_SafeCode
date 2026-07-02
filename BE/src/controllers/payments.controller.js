import { File } from "../models/File.js";
import { Transaction } from "../models/Transaction.js";
import { CreditRequest } from "../models/CreditRequest.js";
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

    if (fileDoc.status !== "Uploaded" && fileDoc.status !== "Verifying Payment") {
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

    fileDoc.status = "Verifying Payment";
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
    const { fileId } = req.params;
    const fileDoc = await File.findById(fileId);
    if (!fileDoc) throw httpError(404, "File not found");
    if (fileDoc.intendedClientEmail !== req.user.email) throw httpError(403, "Forbidden");
    if (fileDoc.status === "Paid") return res.json({ alreadyPaid: true });
    if (fileDoc.status !== "Uploaded" && fileDoc.status !== "Verifying Payment" && fileDoc.status !== "Locked" && fileDoc.status !== "Testing Phase") {
      throw httpError(409, "File is not ready for checkout");
    }

    // === MOCK PAYMENT FLOW (For Demo/Presentation) ===
    if (!isPayosConfigured) {
      console.log(`[MOCK PAYMENT] Simulating successful payment for file ${fileId}`);
      
      fileDoc.status = "Paid";
      fileDoc.paidAt = new Date();
      await fileDoc.save();

      // Simulate a Transaction record
      await Transaction.create({
        fileId: fileDoc._id,
        freelancerId: fileDoc.freelancerId,
        clientEmail: req.user.email,
        type: "checkout",
        status: "Succeeded",
        amount: fileDoc.price.amount,
        currency: fileDoc.price.currency,
        stripe: { eventId: `mock_${Date.now()}` },
      });

      // Issue License
      const { issueLicense } = await import("../services/license.service.js");
      const { sendDecryptionKeyEmail } = await import("../services/email.service.js");
      const { rewardCreditsForSale } = await import("../services/credit.service.js");
      const { createNotification } = await import("../socket.js");
      
      try {
        const { key: licenseSerial } = await issueLicense(req.user.id, fileDoc._id);
        await sendDecryptionKeyEmail(fileDoc.intendedClientEmail, {
          fileName: fileDoc.title,
          licenseKey: licenseSerial,
          isV3: true,
        });

        await rewardCreditsForSale(fileDoc.freelancerId, {
          amountInVnd: fileDoc.price.amount,
          fileId: fileDoc._id,
        });

        createNotification(
          String(fileDoc.freelancerId),
          "Thanh toán (Giả lập) thành công! 🎉",
          `Khách hàng đã thanh toán thành công cho "${fileDoc.title}".`,
          { type: "payment", relatedFileId: fileDoc._id }
        );
      } catch (err) {
        console.error("[MOCK PAYMENT] Post-payment actions failed:", err);
      }

      // Instead of returning a checkoutUrl, return a flag to tell the frontend to simulate success
      return res.json({ mockSuccess: true });
    }

    // === REAL PAYOS FLOW ===
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

    const paymentLinkRes = typeof payos.createPaymentLink === "function"
      ? await payos.createPaymentLink(paymentData)
      : await payos.paymentRequests.create(paymentData);

    fileDoc.status = "Verifying Payment";
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

    res.json({
      checkoutUrl: paymentLinkRes.checkoutUrl,
      orderCode,
      qrCode: paymentLinkRes.qrCode,
      accountNumber: paymentLinkRes.accountNumber,
      accountName: paymentLinkRes.accountName,
      bin: paymentLinkRes.bin,
      amount: paymentLinkRes.amount,
      description: paymentLinkRes.description
    });
  } catch (err) {
    next(err);
  }
}

// === NEW: Create PayOS QR for file payment, identical flow to credit purchase ===
// The freelancerId is stored in CreditRequest so webhook can auto-credit the right freelancer
export async function createFilePaymentQr(req, res, next) {
  try {
    const { fileId } = req.params;
    const fileDoc = await File.findById(fileId);
    if (!fileDoc) throw httpError(404, "File not found");
    if (fileDoc.intendedClientEmail !== req.user.email) throw httpError(403, "Forbidden");
    if (fileDoc.status === "Paid") return res.json({ alreadyPaid: true });

    if (!isPayosConfigured) {
      throw httpError(500, "PayOS chưa được cấu hình trên server.");
    }

    // Amount in VND from the file
    const amount = fileDoc.price.currency.toLowerCase() === 'vnd'
      ? fileDoc.price.amount
      : fileDoc.price.amount * 25000;

    const orderCode = Number(String(Date.now()).slice(-6) + Math.floor(Math.random() * 1000));

    const paymentData = {
      orderCode,
      amount,
      description: `TT file ${fileId.slice(-4)}`,
      items: [
        {
          name: fileDoc.title.slice(0, 50),
          quantity: 1,
          price: amount
        }
      ],
      returnUrl: req.body.successUrl || `${env.APP_BASE_URL}/files`,
      cancelUrl: req.body.cancelUrl || `${env.APP_BASE_URL}/files`
    };

    const paymentLinkRes = typeof payos.createPaymentLink === "function"
      ? await payos.createPaymentLink(paymentData)
      : await payos.paymentRequests.create(paymentData);

    // Save to CreditRequest (type: file_payment) so webhook knows who to credit
    await CreditRequest.create({
      userId: req.user.id,          // client who pays
      amount: Math.round(amount / 2000), // credits to give freelancer (1 CR = 2000 VND)
      amountVND: amount,
      status: 'pending',
      type: 'file_payment',
      freelancerId: fileDoc.freelancerId,
      fileId: fileDoc._id,
      payosOrderCode: orderCode,
      paymentLinkId: paymentLinkRes.paymentLinkId
    });

    // Also update file status so it shows as pending payment
    fileDoc.status = "Verifying Payment";
    fileDoc.payos = { orderCode, paymentLinkId: paymentLinkRes.paymentLinkId };
    await fileDoc.save();

    res.json({
      checkoutUrl: paymentLinkRes.checkoutUrl,
      orderCode,
      qrCode: paymentLinkRes.qrCode,
      accountNumber: paymentLinkRes.accountNumber,
      accountName: paymentLinkRes.accountName,
      bin: paymentLinkRes.bin,
      amount: paymentLinkRes.amount,
      description: paymentLinkRes.description,
      freelancerId: fileDoc.freelancerId
    });
  } catch (err) {
    next(err);
  }
}
