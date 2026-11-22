import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

export const createConversation = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const conversation = await Conversation.create({
      userId: userId,
    });
    return res.status(200).json(conversation);
  } catch (error) {
    console.log("Error in chat conversation API : ", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getConversation = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const conversation = await Conversation.find({
      userId: userId,
    }).sort({ updatedAt: -1 });
    return res.status(200).json(conversation);
  } catch (error) {
    console.log("Error in get conversation API : ", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const saveMessage = async (req, res) => {
  try {
    const { conversationId, role, content } = req.body;
    const message = await Message.create({
      conversationId,
      content,
      role,
    });
    return res.status(200).json(message);
  } catch (error) {
    console.log("Error in save message API : ", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID is required",
      });
    }

    const messages = await Message.find({
      conversationId: conversationId,
    })

    return res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error("Error in getMessage API:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateConversation = async (req, res) => {
  try {
    const { id, title } = req.body;
    const conversation = await Conversation.findByIdAndUpdate(id, {
      title,
    }).sort({ updatedAt: -1 });
    return res.status(200).json(conversation);
  } catch (error) {
    console.log("Error in update conversation API : ", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
