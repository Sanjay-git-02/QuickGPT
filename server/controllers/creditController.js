import Transaction from "../models/transaction.js";
import userModel from "../models/user.js";
import Stripe from "stripe";

const plans = [
  {
    _id: "basic",
    name: "Basic",
    price: 10,
    credits: 100,
    features: [
      "100 text generations",
      "50 image generations",
      "Standard support",
      "Access to basic models",
    ],
  },
  {
    _id: "pro",
    name: "Pro",
    price: 20,
    credits: 500,
    features: [
      "500 text generations",
      "200 image generations",
      "Priority support",
      "Access to pro models",
      "Faster response time",
    ],
  },
  {
    _id: "premium",
    name: "Premium",
    price: 30,
    credits: 1000,
    features: [
      "1000 text generations",
      "500 image generations",
      "24/7 VIP support",
      "Access to premium models",
      "Dedicated account manager",
    ],
  },
];

export const getPlans = async (req, res) => {
  try {
    res.json({ success: true, plans });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const purchasePlan = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user._id;

    const plan = plans.find((p) => p._id === planId);
    if (!plan) {
      return res.json({ success: false, message: "Invalid Plan" });
    }

    const transaction = await Transaction.create({
      userId,
      planId: plan._id,
      amount: plan.price,
      credits: plan.credits,
      isPaid: false,
    });

    const origin = req.headers.origin || process.env.CLIENT_URL;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: plan.price * 100,
            product_data: {
              name: plan.name,
            },
          },
          quantity: 1,
        },
      ],

      success_url: `${origin}/loading?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}`,

      metadata: {
        transactionId: transaction._id.toString(),
        appId: "quickgpt",
      },

      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    });

    return res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Endpoint to complete a checkout session (can be called after Stripe redirect)
export const completePurchase = async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) return res.status(400).json({ success: false, message: "Missing session_id" });

    console.log('[completePurchase] session_id=', session_id);
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripe.checkout.sessions.retrieve(session_id);
    console.log('[completePurchase] stripe session metadata=', session?.metadata);
    if (!session) return res.status(404).json({ success: false, message: "Session not found" });

    const { transactionId, appId } = session.metadata || {};
    if (appId !== "quickgpt") return res.json({ success: false, message: "Invalid app" });

    const transaction = await Transaction.findOne({ _id: transactionId, isPaid: false });
    console.log('[completePurchase] found transaction=', !!transaction, transactionId);
    if (!transaction) return res.json({ success: false, message: "Transaction not found or already processed" });

    await userModel.updateOne({ _id: transaction.userId }, { $inc: { credits: transaction.credits } });
    transaction.isPaid = true;
    await transaction.save();
    console.log('[completePurchase] credited user=', transaction.userId, 'credits=', transaction.credits);

    return res.json({ success: true, message: "Purchase completed" });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};

// Dev helper: simulate a successful purchase without contacting Stripe
export const simulatePurchase = async (req, res) => {
  try {
    const { planId } = req.body;
    const userId = req.user._id;

    const plan = plans.find((p) => p._id === planId);
    if (!plan) return res.json({ success: false, message: "Invalid Plan" });

    const transaction = await Transaction.create({
      userId,
      planId: plan._id,
      amount: plan.price,
      credits: plan.credits,
      isPaid: true,
    });

    await userModel.updateOne(
      { _id: userId },
      { $inc: { credits: plan.credits } },
    );

    return res.json({
      success: true,
      message: "Simulated purchase completed",
      transaction,
    });
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};
