import api from "../../utils/axios";

const createOrder = async (payload) => {
  try {
    const planKey =
      typeof payload === "string"
        ? payload
        : payload?.plan?.id || payload?.plan || payload?.planId || payload?.id;

    const { data } = await api.post("/api/billing/create", {
      plan: String(planKey || "").trim().toLowerCase(),
    });

    return data;
  } catch (error) {
    console.error("Create order error:", error);
    throw error;
  }
};

export default createOrder;