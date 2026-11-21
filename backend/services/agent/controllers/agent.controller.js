import graph from "../graph/graph.js";
import axios from "axios";

export const agent = async (req, res) => {
  try {
    console.log("Request body:", req.body);

    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        success: false,
        message: "Request body is missing. Send a JSON payload.",
      });
    }

    const { prompt, conversationId } = req.body;

    if (!prompt?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Prompt is required.",
      });
    }

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID is required.",
      });
    }

    await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
      conversationId,
      role: "user",
      content: prompt,
    });

    const result = await graph.invoke({
      prompt,
      conversationId,
    });

    return res.status(200).json({
      success: true,
      response: result.aiResponse,
    });
  } catch (error) {
    console.error("Error in agent API:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
