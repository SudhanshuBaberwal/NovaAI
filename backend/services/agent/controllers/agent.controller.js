import { addMessage } from "../config/memory.js";
import graph from "../graph/graph.js";
import axios from "axios";

const normalizeImages = (images) => {
  if (!Array.isArray(images)) return [];
  return images
    .map((img) => {
      if (typeof img === "string") return img.trim();
      if (img && typeof img === "object") {
        return String(img.url || img.src || "").trim();
      }
      return "";
    })
    .filter(Boolean);
};

export const agent = async (req, res) => {
  try {
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({
        success: false,
        message: "Request body is missing. Send a JSON payload.",
      });
    }

    const { prompt, conversationId, agent } = req.body;
    const userId = req.headers["x-user-id"] || req.body?.userId;
    const file = Array.isArray(req.files)
      ? req.files
      : [
          ...(req.files?.files || []),
          ...(req.files?.file || []),
          ...(req.file ? [req.file] : []),
        ];

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

    const cleanPrompt = prompt.trim();

    // 1. Persist user message to database
    await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
      conversationId,
      role: "user",
      content: cleanPrompt,
    });

    // 2. Run the agent graph using existing history before saving the new turn
    let result;
    try {
      result = await graph.invoke({
        prompt: cleanPrompt,
        conversationId,
        agent,
        userId,
        file,
      });
    } catch (graphError) {
      const isRateLimit =
        graphError?.statusCode === 429 ||
        graphError?.code === 429 ||
        String(graphError?.message || "").includes("429");

      if (isRateLimit) {
        const fallbackMsg =
          "The AI provider is temporarily busy due to high traffic. Please try again in a few seconds.";

        await addMessage(conversationId, "user", cleanPrompt);
        await addMessage(conversationId, "assistant", fallbackMsg);

        await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
          conversationId,
          role: "assistant",
          content: fallbackMsg,
          images: [],
          artifacts: [],
        });

        return res.status(200).json({
          success: true,
          answer: fallbackMsg,
          images: [],
          artifacts: [],
        });
      }

      throw graphError;
    }

    const normalizedImages = normalizeImages(result?.images);
    const normalizedArtifacts = Array.isArray(result?.artifacts)
      ? result.artifacts
      : [];

    const response =
      result?.aiResponse ||
      result?.response ||
      result?.answer ||
      (normalizedArtifacts.length > 0
        ? "Code Generated Successfully."
        : normalizedImages.length > 0
          ? "Image Generated Successfully."
          : "Sorry, I couldn't generate a response. Please try again.");

    // 3. Save both user and assistant messages to Redis memory
    await addMessage(conversationId, "user", cleanPrompt);
    await addMessage(conversationId, "assistant", response);

    // 4. Persist assistant message with string[] images and artifacts to database
    await axios.post(`${process.env.CHAT_SERVICE}/save-message`, {
      conversationId,
      role: "assistant",
      content: response,
      images: normalizedImages,
      artifacts: normalizedArtifacts,
    });

    // 5. Fetch/forward remaining credits if your graph nodes deducted credits
    const remainingCredits =
      typeof result?.credits === "number" ? result.credits : undefined;

    return res.status(200).json({
      success: true,
      answer: response,
      images: normalizedImages,
      artifacts: normalizedArtifacts,
      agent: result?.agent || agent,
      ...(typeof remainingCredits === "number"
        ? { credits: remainingCredits }
        : {}),
    });
  } catch (error) {
    console.error(
      "Error in agent API:",
      error?.response?.data || error.message || error,
    );

    return res.status(500).json({
      success: false,
      message: error?.response?.data?.message || error.message,
    });
  }
};
