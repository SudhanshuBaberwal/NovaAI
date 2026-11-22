import axios from "axios";

export const getMessage = async (conversationId) => {
  try {
    const { data } = await axios.get(
      `${process.env.CHAT_SERVICE}/get-messages/${conversationId}`
    );

    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.messages)) return data.messages;
    return [];
  } catch (error) {
    if (error.response?.status === 404) {
      return [];
    }
    console.error("Error fetching messages from chat service:", error.message);
    return [];
  }
};