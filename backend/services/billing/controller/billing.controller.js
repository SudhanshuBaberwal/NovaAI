import crypto from "crypto";
import { PLANS } from "../config/plans.js";
import razorpay from "../config/razorpay.js";
import Payment from "../models/payment.model.js";
import axios from "axios";

const extractPlanKey = (req) => {
  const candidate =
    req.body?.plan?.id ??
    req.body?.plan?.planId ??
    req.body?.plan ??
    req.body?.planId ??
    req.query?.plan ??
    "";

  if (typeof candidate === "object" && candidate !== null) {
    return String(candidate.id || candidate.name || "")
      .trim()
      .toLowerCase();
  }

  return String(candidate).trim().toLowerCase();
};

export const createOrder = async (req, res) => {
  try {
    const planKey = extractPlanKey(req);
    const userId = req.headers["x-user-id"] || req.body?.userId;

    const selectedPlan = PLANS[planKey];
    if (!selectedPlan) {
      return res.status(404).json({
        success: false,
        message: `Plan Not Found! Received: "${planKey}"`,
      });
    }

    if (selectedPlan.amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot create a payment order for the Free plan.",
      });
    }

    const order = await razorpay.orders.create({
      amount: selectedPlan.amount * 100,
      currency: "INR",
      receipt: `receipt-${Date.now()}`,
    });

    await Payment.create({
      userId,
      orderId: order.id,
      amount: selectedPlan.amount,
      credits: selectedPlan.credits,
      plan: selectedPlan.id,
      currency: order.currency || "INR",
      status: "created",
    });

    return res.status(200).json({
      success: true,
      order,
      plan: selectedPlan,
    });
  } catch (error) {
    console.error("Create order error:", error);
    return res.status(500).json({
      success: false,
      message: `Create order error: ${error.message || error}`,
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
      req.body;

    const generateSignature = crypto
      .createHmac("sha256", process.env.ROZAR_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generateSignature !== razorpay_signature) {
      return res
        .status(400)
        .json({ success: false, message: "Payment Verification Failed" });
    }

    const payment = await Payment.findOne({ orderId: razorpay_order_id });
    if (!payment) {
      return res
        .status(400)
        .json({ success: false, message: "Payment Not Found" });
    }
    if (payment.status !== "paid") {
      payment.status = "paid";
      payment.paymentId = razorpay_payment_id;
      await payment.save();

      const resolvedUserId =
        payment.userId || req.headers["x-user-id"] || req.body?.userId;

      if (!resolvedUserId) {
        return res.status(400).json({
          success: false,
          message: "User ID missing on payment record.",
        });
      }

      try {
        const authRes = await axios.post(
          `${process.env.AUTH_SERVICE}/update-plan`,
          {
            userId: resolvedUserId,
            plan: payment.plan,
            credits: payment.credits,
          },
          {
            headers: {
              "x-user-id": String(resolvedUserId),
            },
          },
        );

        return res.status(200).json({
          success: true,
          message: "Payment Verified",
          plan: payment.plan,
          credits: payment.credits,
          user: authRes.data?.user || null,
        });
      } catch (authError) {
        console.error(
          "Auth service /update-plan failed:",
          authError?.response?.status,
          authError?.response?.data || authError.message,
        );
        return res.status(502).json({
          success: false,
          message:
            authError?.response?.data?.message ||
            "Payment verified, but failed to update user plan in Auth service.",
        });
      }
    }
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: `Verify payment error : ${error}` });
  }
};
