import { Router, Request, Response } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

export const paymentsRouter = Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "",
});

const PRO_PLAN_PRICE = 19900; // ₹199 in paise
const PRO_PLAN_CURRENCY = "INR";

paymentsRouter.get("/plans", (_req, res: Response) => {
  res.json({
    plans: [
      {
        id: "free",
        name: "Free",
        price: 0,
        currency: "INR",
        features: [
          "3 subjects",
          "50 topics",
          "Basic progress tracking",
          "7-day study streak",
          "Community support",
        ],
        limits: { subjects: 3, topics: 50 },
      },
      {
        id: "pro",
        name: "Pro",
        price: 199,
        currency: "INR",
        priceMonthly: "₹199/month",
        features: [
          "Unlimited subjects",
          "Unlimited topics",
          "AI syllabus parsing",
          "AI study plan generation",
          "Smart recommendations",
          "Advanced analytics",
          "Priority support",
          "Export progress reports",
        ],
        limits: { subjects: -1, topics: -1 },
        popular: true,
      },
    ],
  });
});

paymentsRouter.post("/create-order", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const order = await razorpay.orders.create({
      amount: PRO_PLAN_PRICE,
      currency: PRO_PLAN_CURRENCY,
      receipt: `sylla_${req.userId}_${Date.now()}`,
      notes: {
        userId: req.userId!,
        plan: "PRO",
      },
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Razorpay order error:", err);
    res.status(500).json({ error: "Failed to create payment order" });
  }
});

paymentsRouter.post("/verify", authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
      .update(sign)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      res.status(400).json({ error: "Invalid payment signature" });
      return;
    }

    // Upgrade user to PRO for 30 days
    const planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await prisma.user.update({
      where: { id: req.userId },
      data: {
        plan: "PRO",
        planExpiresAt,
        razorpaySubId: razorpay_payment_id,
      },
    });

    res.json({
      success: true,
      message: "Payment verified! Welcome to Sylla Pro 🎉",
      planExpiresAt,
    });
  } catch {
    res.status(500).json({ error: "Payment verification failed" });
  }
});

// Razorpay webhook
paymentsRouter.post("/webhook", (req: Request, res: Response): void => {
  const signature = req.headers["x-razorpay-signature"] as string;
  const body = JSON.stringify(req.body);

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || "")
    .update(body)
    .digest("hex");

  if (signature !== expectedSignature) {
    res.status(400).json({ error: "Invalid webhook signature" });
    return;
  }

  // Handle webhook events
  const event = req.body.event;
  console.log("Razorpay webhook event:", event);

  res.json({ received: true });
});
