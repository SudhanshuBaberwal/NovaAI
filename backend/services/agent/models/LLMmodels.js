import { ChatOpenAI } from "@langchain/openai";
import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

let groq;
let openai;
let gemini;

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

export const getModel = async (agent) => {
  switch (agent) {
    case "router":
    case "chat":
    case "search":
      return getGroqModel();

    case "coding": {
      if (!process.env.GOOGLE_API_KEY) {
        throw new Error("Missing GOOGLE_API_KEY in agent .env");
      }

      gemini ??= new ChatGoogleGenerativeAI({
        model: "gemini-2.5-flash",
        temperature: 0,
        maxRetries: 2,
      });

      return gemini;
    }

    default:
      return getGroqModel();
  }
};