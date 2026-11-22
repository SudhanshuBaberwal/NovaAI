import redis from "../../../shared/redis/redis.js";
import { addMessage } from "../config/memory.js";
import graph from "../graph/graph.js";
import axios from "axios";

export const agent = async (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        success: false,
        message: "Request body is missing. Send a JSON payload.",
      });
    }

    const { prompt, conversationId , agent } = req.body;

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
      content: prompt.trim(),
    });

    // 1. Run the agent graph using existing history before saving the new turn
    const result = await graph.invoke({
      prompt: prompt.trim(),
      conversationId,
      agent
    });

    const response = result.aiResponse;

    // 2. Save both user and assistant messages to Redis with exact positional arguments
    await addMessage(conversationId, "user", prompt.trim());
    await addMessage(conversationId, "assistant", response);

    // 3. Persist both messages to the database

    await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
      conversationId,
      role: "assistant",
      content: response,
      images:result.images
    });

    return res.status(200).json({
      success: true,
      answer:response,
      images:result.images
    });
  } catch (error) {
    console.error("Error in agent API:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};