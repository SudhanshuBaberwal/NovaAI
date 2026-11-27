import api from "../../utils/axios";

const sendMessage = async (formData) => {
  try {
    const isFormData = formData instanceof FormData;
    const { data } = await api.post("/api/agent/chat", formData, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
    });
    return data;
  } catch (error) {
    console.error("Send message error:", error);
    throw error;
  }
};

export default sendMessage;