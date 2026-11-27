import "dotenv/config";
import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenRouter } from "@langchain/openrouter";

let groq;
let gemini;
let codingModel;

const getGroqModel = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("Missing GROQ_API_KEY in agent .env");
  }

  groq ??= new ChatGroq({
    model: "openai/gpt-oss-120b",
    temperature: 0,
    maxRetries: 2,
  });

  return groq;
};

const getGeminiModel = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY or GOOGLE_API_KEY in agent .env");
  }

  if (!gemini) {
    const primaryGemini = new ChatGoogleGenerativeAI({
      model: "gemini-3.8-flash",
      apiKey,
      temperature: 0,
      maxOutputTokens: 8192,
      maxRetries: 2,
    });

    const fallbacks = [
      new ChatGoogleGenerativeAI({
        model: "gemini-3.5-flash",
        apiKey,
        temperature: 0,
        maxOutputTokens: 8192,
        maxRetries: 1,
      }),
    ];

    if (process.env.GROQ_API_KEY) {
      fallbacks.push(getGroqModel());
    }

    gemini = primaryGemini.withFallbacks(fallbacks);
  }

  return gemini;
};

const getCodingModel = () => {
  if (!codingModel) {
    const models = [];

    // Use Gemini 3.8 Flash first if GEMINI_API_KEY / GOOGLE_API_KEY is configured
    if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
      models.push(getGeminiModel());
    }

    // Add OpenRouter models if OPENROUTER_API_KEY is configured
    if (process.env.OPENROUTER_API_KEY) {
      models.push(
        new ChatOpenRouter({
          model: "deepseek/deepseek-chat",
          apiKey: process.env.OPENROUTER_API_KEY,
          temperature: 0,
          maxTokens: 6000,
          maxRetries: 1,
        }),
        new ChatOpenRouter({
          model: "qwen/qwen-2.5-coder-32b-instruct",
          apiKey: process.env.OPENROUTER_API_KEY,
          temperature: 0,
          maxTokens: 6000,
          maxRetries: 1,
        }),
      );
    }

    // Always keep Groq as final safety fallback
    if (process.env.GROQ_API_KEY) {
      models.push(getGroqModel());
    }

    if (models.length === 0) {
      throw new Error("No LLM API keys found in agent .env");
    }

    codingModel =
      models.length > 1 ? models[0].withFallbacks(models.slice(1)) : models[0];
  }

  return codingModel;
};

export const getModel = async (agent) => {
  switch (agent) {
    case "router":
    case "intent":
    case "chat":
    case "search":
      return getGroqModel();

    case "coding":
      return getCodingModel();

    case "gemini":
    case "pdf":
    case "ppt":
    case "imageAnalyzer":
      return getGeminiModel();

    default:
      return getGroqModel();
  }
};
