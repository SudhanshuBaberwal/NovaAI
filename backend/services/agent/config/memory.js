import redis from "../../../shared/redis/redis.js";
import { getMessage } from "../utils/getMessages.js";

const TTL_SECONDS = 24 * 60 * 60;

const normalizeMessages = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.messages)) return data.messages;
  return [];
};

export const getMemory = async (conversationId) => {
  const key = `messages-${conversationId}`;
  const cached = await redis.get(key);

  if (cached) {
    const parsed = JSON.parse(cached);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  }

  const rawMessages = await getMessage(conversationId);
  const messages = normalizeMessages(rawMessages);

  await redis.set(key, JSON.stringify(messages), "EX", TTL_SECONDS);
  return messages;
};

export const addMessage = async (conversationId, role, content) => {
  const key = `messages-${conversationId}`;
  const rawMessages = await redis.get(key);
  const parsed = rawMessages ? JSON.parse(rawMessages) : [];
  const messages = Array.isArray(parsed) ? parsed : [];

  messages.push({
    role,
    content,
  });

  if (messages.length > 20) {
    messages.shift();
  }

  await redis.set(key, JSON.stringify(messages), "EX", TTL_SECONDS);
};