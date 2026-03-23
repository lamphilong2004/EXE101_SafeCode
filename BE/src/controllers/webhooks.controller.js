import { stripe } from "../services/stripe.service.js";
import { env } from "../config/env.js";
import { File } from "../models/File.js";
import { Transaction } from "../models/Transaction.js";

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
