import Stripe from "stripe";
import Transaction from "../models/transaction.js";
import userModel from "../models/user.js";

export const stripeWebHooks = async (request, response) => {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = request.headers["stripe-signature"];

  console.log(
    "[webhooks] received request, signature=",
    sig ? "present" : "missing",
  );

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET_KEY,
    );
  } catch (error) {
    return response.json({
      success: false,
      message: `Webhook error: ${error.message}`,
    });
  }

  // helper to process a checkout session object
  const processSession = async (session, res) => {
    const { transactionId, appId } = session.metadata || {};

    if (appId === "quickgpt") {
      const transaction = await Transaction.findOne({
        _id: transactionId,
        isPaid: false,
      });
      if (!transaction) {
        return res.json({
          received: true,
          message: "Transaction not found or already processed",
        });
      }

      await userModel.updateOne(
        { _id: transaction.userId },
        { $inc: { credits: transaction.credits } },
      );

      transaction.isPaid = true;
      await transaction.save();
    } else {
      return res.json({
        received: true,
        message: "Ignored event: Invalid app",
      });
    }

    return res.json({ received: true });
  };

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        console.log(
          "[webhooks] payment_intent.succeeded id=",
          paymentIntent.id,
        );
        const sessionList = await stripe.checkout.sessions.list({
          payment_intent: paymentIntent.id,
        });

        const session = sessionList.data && sessionList.data[0];
        if (!session) {
          return response.json({
            received: true,
            message: "No session found for payment intent",
          });
        }

        await processSession(session, response);
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object;
        console.log(
          "[webhooks] checkout.session.completed metadata=",
          session.metadata,
        );
        await processSession(session, response);
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
        break;
    }
    // default handled by cases which return earlier
  } catch (error) {
    console.error("Webhook processsing error:", error);
    return response.status(500).send("Internal Server Error");
  }
};
