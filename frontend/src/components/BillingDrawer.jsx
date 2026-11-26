import React, { useEffect, useState } from "react";
import {
  X,
  Coins,
  Check,
  Sparkles,
  Zap,
  Crown,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useDispatch, useSelector } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { useToast } from "../utils/ToastContext";
import createOrder from "../features/createOrder";
import verifyPayment from "../features/verifyPayment";

export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    amount: 0,
    credits: 100,
    validity: 30,
  },
  starter: {
    id: "starter",
    name: "Starter",
    amount: 199,
    credits: 500,
    validity: 30,
  },
  pro: {
    id: "pro",
    name: "Pro",
    amount: 499,
    credits: 1000,
    validity: 30,
  },
};

const PLAN_UI_META = {
  free: {
    badge: "Default",
    icon: Zap,
    description: "Essential AI chat and everyday productivity tools.",
    features: [
      "100 AI Credits for 30 days",
      "Standard Chat & Web Search",
      "Basic Code Generation",
      "Standard PDF & PPT exports",
    ],
    cta: "Current Plan",
  },
  starter: {
    badge: "Most Popular",
    icon: Sparkles,
    highlighted: true,
    description: "Built for creators, students, and daily builders.",
    features: [
      "500 AI Credits for 30 days",
      "Full Coding Agent & Live Preview",
      "HD Vision Image Generation",
      "Unlimited PDF & PPT Deck Exports",
      "Priority model routing",
    ],
    cta: "Upgrade to Starter",
  },
  pro: {
    badge: "Best Value",
    icon: Crown,
    description: "Maximum throughput for power users and heavy workflows.",
    features: [
      "1,000 AI Credits for 30 days",
      "Fastest Gemini & Groq priority lane",
      "Multi-file Project & UI Artifacts",
      "High-speed Vision Renders & S3 CDN",
      "Early access to new NovaAI agents",
    ],
    cta: "Upgrade to Pro",
  },
};

const AGENT_COSTS = [
  { label: "Chat", cost: 1 },
  { label: "Search", cost: 5 },
  { label: "Coding", cost: 10 },
  { label: "PDF", cost: 10 },
  { label: "Vision", cost: 10 },
  { label: "PPT", cost: 10 },
];

const PLAN_LIST = Object.values(PLANS).map((plan) => ({
  ...plan,
  ...PLAN_UI_META[plan.id],
}));

const BillingDrawer = ({ isOpen, onClose, onPaymentSuccess }) => {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const { showToast } = useToast();
  const [processingPlan, setProcessingPlan] = useState(null);

  const currentPlanId = String(userData?.plan || "free").toLowerCase();
  const availableCredits =
    typeof userData?.credits === "number"
      ? userData.credits
      : PLANS[currentPlanId]?.credits ?? PLANS.free.credits;

  const totalCredits =
    typeof userData?.totalCredits === "number" && userData.totalCredits > 0
      ? Math.max(userData.totalCredits, availableCredits)
      : Math.max(PLANS[currentPlanId]?.credits ?? 100, availableCredits);

  const creditPercentage = Math.min(
    100,
    Math.max(0, Math.round((availableCredits / totalCredits) * 100))
  );

  const formattedExpiry = userData?.planExpiresAt
    ? new Date(userData.planExpiresAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "30 Days Validity";

  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const handlePlanAction = async (plan) => {
    if (plan.id === currentPlanId || processingPlan) return;

    setProcessingPlan(plan.id);
    try {
      const orderData = await createOrder({ plan: plan.id });

      if (!orderData || orderData?.success === false) {
        throw new Error(
          orderData?.message || "Failed to create billing order."
        );
      }

      if (typeof window.Razorpay !== "function") {
        throw new Error(
          "Razorpay SDK failed to load. Check your internet connection or script tag."
        );
      }

      const razorpayOrder = orderData?.order || {};
      const resolvedPlan = orderData?.plan || plan;

      const options = {
        key:
          import.meta.env.VITE_ROZAR_KEY_ID ||
          import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount ?? plan.amount * 100,
        currency: razorpayOrder.currency || "INR",
        name: "NOVA AI",
        description: `${resolvedPlan.name} Plan (${resolvedPlan.validity || plan.validity} Days)`,
        order_id: razorpayOrder.id || orderData.order_id,
        prefill: {
          name: userData?.name || "",
          email: userData?.email || "",
        },
        theme: {
          color: "#09090b",
        },
        handler: async (paymentResponse) => {
          try {
            const data = await verifyPayment({
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_signature: paymentResponse.razorpay_signature,
            });

            if (!data || data?.success === false) {
              throw new Error(data?.message || "Payment verification failed.");
            }

            const addedCredits = Number(
              data?.credits ?? resolvedPlan.credits ?? plan.credits
            );

            const updatedUser = data?.user
              ? { ...userData, ...data.user }
              : {
                  ...userData,
                  plan: data?.plan || resolvedPlan.id || plan.id,
                  credits: (Number(userData?.credits) || 0) + addedCredits,
                  totalCredits:
                    (Number(userData?.totalCredits) || 0) + addedCredits,
                  planExpiresAt: new Date(
                    Date.now() + 30 * 24 * 60 * 60 * 1000
                  ).toISOString(),
                };

            dispatch(setUserData(updatedUser));

            if (typeof onPaymentSuccess === "function") {
              await onPaymentSuccess(data, resolvedPlan);
            }

            showToast(
              `${resolvedPlan.name} Plan activated! +${addedCredits} Credits added.`,
              "success"
            );
            onClose?.();
          } catch (verifyErr) {
            console.error("Payment verification error:", verifyErr);
            showToast(
              verifyErr?.response?.data?.message ||
                verifyErr?.message ||
                "Payment verification failed.",
              "error"
            );
          }
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", (failedResponse) => {
        console.error("Razorpay payment failed:", failedResponse?.error);
        showToast(
          failedResponse?.error?.description ||
            "Payment failed. Please try again.",
          "error"
        );
      });
      razorpay.open();
    } catch (error) {
      console.error("Billing plan selection failed:", error);
      showToast(
        error?.response?.data?.message ||
          error?.message ||
          "Unable to create order. Please try again.",
        "error"
      );
    } finally {
      setProcessingPlan(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
          {/* Animated Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-xs"
          />

          {/* Spring Slide-Over Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              stiffness: 320,
              damping: 32,
              mass: 0.9,
            }}
            className="relative z-10 w-full max-w-2xl h-full bg-zinc-950 text-zinc-100 border-l border-zinc-800 flex flex-col shadow-2xl"
          >
            {/* Top Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 h-16 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.2 }}
                  className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white"
                >
                  <Coins size={18} />
                </motion.div>
                <div>
                  <h2 className="text-base font-semibold text-white tracking-tight">
                    Plans &amp; Credits
                  </h2>
                  <p className="text-xs text-zinc-400">
                    Choose a 30-day credit pack to power your NovaAI agents
                  </p>
                </div>
              </div>

              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.94 }}
                onClick={onClose}
                className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                title="Close Billing"
              >
                <X size={18} />
              </motion.button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 scrollbar-none">
              {/* Current Balance & Credit Usage Card */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.28, ease: "easeOut" }}
                className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black border border-zinc-800 flex items-center justify-center text-white shrink-0">
                      <Coins size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold">
                          Available Credits
                        </span>
                        <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-200 border border-zinc-700">
                          {currentPlanId} Plan
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <p className="text-xl font-bold text-white">
                          {availableCredits.toLocaleString()}
                        </p>
                        <span className="text-xs text-zinc-500">
                          / {totalCredits.toLocaleString()} Credits
                        </span>
                      </div>
                    </div>
                  </div>

                  <span className="text-[11px] font-medium text-zinc-400 bg-black border border-zinc-800 px-3 py-1.5 rounded-xl shrink-0">
                    {userData?.planExpiresAt
                      ? `Expires ${formattedExpiry}`
                      : "30 Days Validity"}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-2 rounded-full bg-black border border-zinc-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${creditPercentage}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className={`h-full rounded-full ${
                        availableCredits <= 10 ? "bg-zinc-400" : "bg-white"
                      }`}
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
                    <span>{creditPercentage}% remaining</span>
                    <div className="flex flex-wrap items-center gap-2">
                      {AGENT_COSTS.map((item) => (
                        <span
                          key={item.label}
                          className="px-1.5 py-0.5 rounded bg-black/80 border border-zinc-800/80 text-zinc-400"
                        >
                          {item.label}: {item.cost}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* 3-Tier Plan Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {PLAN_LIST.map((plan, index) => {
                  const Icon = plan.icon;
                  const isCurrent = currentPlanId === plan.id;
                  const isLoading = processingPlan === plan.id;

                  return (
                    <motion.div
                      key={plan.id}
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.12 + index * 0.06,
                        duration: 0.3,
                        ease: "easeOut",
                      }}
                      whileHover={{ y: -3 }}
                      className={`relative rounded-2xl p-4 flex flex-col justify-between border transition-colors ${
                        plan.highlighted
                          ? "bg-zinc-900 border-white/40 shadow-lg"
                          : "bg-zinc-900/40 border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      <div>
                        {/* Plan Top Row */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-black border border-zinc-800 flex items-center justify-center text-white">
                            <Icon size={16} />
                          </div>
                          <span
                            className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              plan.highlighted
                                ? "bg-white text-black border-white"
                                : "bg-zinc-950 text-zinc-400 border-zinc-800"
                            }`}
                          >
                            {isCurrent ? "Active" : plan.badge}
                          </span>
                        </div>

                        {/* Title & Description */}
                        <h3 className="text-base font-bold text-white">
                          {plan.name}
                        </h3>
                        <p className="text-xs text-zinc-400 mt-1 leading-relaxed min-h-[34px]">
                          {plan.description}
                        </p>

                        {/* Price & Credits */}
                        <div className="mt-4 pb-4 border-b border-zinc-800/80">
                          <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-bold text-white">
                              ₹{plan.amount}
                            </span>
                            <span className="text-xs text-zinc-500">
                              / {plan.validity} days
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-300 mt-1 font-medium">
                            {plan.credits.toLocaleString()} Credits •{" "}
                            {plan.validity} Days Validity
                          </p>
                        </div>

                        {/* Feature List */}
                        <ul className="mt-4 space-y-2.5">
                          {plan.features.map((feature, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-xs text-zinc-300"
                            >
                              <Check
                                size={14}
                                className="text-white shrink-0 mt-0.5"
                              />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Action Button */}
                      <motion.button
                        type="button"
                        disabled={isCurrent || isLoading}
                        whileHover={
                          !isCurrent && !isLoading ? { scale: 1.015 } : {}
                        }
                        whileTap={
                          !isCurrent && !isLoading ? { scale: 0.98 } : {}
                        }
                        onClick={() => handlePlanAction(plan)}
                        className={`mt-6 w-full py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                          isCurrent
                            ? "bg-zinc-800 text-zinc-400 border border-zinc-700 cursor-default"
                            : plan.highlighted
                              ? "bg-white text-black hover:bg-zinc-200 cursor-pointer"
                              : "bg-zinc-950 text-white border border-zinc-700 hover:bg-zinc-800 cursor-pointer"
                        }`}
                      >
                        <span>
                          {isCurrent
                            ? "Current Plan"
                            : isLoading
                              ? "Opening Checkout..."
                              : plan.cta}
                        </span>
                        {!isCurrent && !isLoading && <ArrowUpRight size={14} />}
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="px-5 sm:px-6 py-3.5 border-t border-zinc-800 bg-black/60 flex items-center justify-between text-[11px] text-zinc-500 shrink-0">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-zinc-400" />
                <span>Secured by Razorpay. Instant 30-day credit top-up.</span>
              </div>
              <span>NovaAI Billing</span>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BillingDrawer;