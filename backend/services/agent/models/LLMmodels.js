import "dotenv/config";
import { ChatGroq } from "@langchain/groq";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";

const agentCache = new Map();

const getGeminiKey = () =>
  process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

// 1. Groq (Free Tier)
const createGroq = (model, maxTokens = 8192) => {
  if (!process.env.GROQ_API_KEY) return null;
  return new ChatGroq({
    model,
    apiKey: process.env.GROQ_API_KEY,
    temperature: 0,
    maxTokens,
    maxRetries: 1,
  });
};

// 2. Google Gemini AI Studio (Standing Free Tier: Flash & Flash-Lite)
const createGemini = (model, maxOutputTokens = 8192) => {
  const apiKey = getGeminiKey();
  if (!apiKey) return null;
  return new ChatGoogleGenerativeAI({
    model,
    apiKey,
    temperature: 0,
    maxOutputTokens,
    maxRetries: 1,
  });
};

// 3. Mistral Experiment Plan (Free Tier via OpenAI-compatible endpoint)
const createMistral = (model, maxTokens = 8192) => {
  if (!process.env.MISTRAL_API_KEY) return null;
  return new ChatOpenAI({
    model,
    apiKey: process.env.MISTRAL_API_KEY,
    temperature: 0,
    maxTokens,
    maxRetries: 1,
    configuration: {
      baseURL: "https://api.mistral.ai/v1",
    },
  });
};

// 4. OpenRouter Free Models (Strictly ":free" / "openrouter/free" endpoints)
const createOpenRouterFree = (model = "openrouter/free", maxTokens = 6000) => {
  if (!process.env.OPENROUTER_API_KEY) return null;
  return new ChatOpenAI({
    model,
    apiKey: process.env.OPENROUTER_API_KEY,
    temperature: 0,
    maxTokens,
    maxRetries: 1,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
    },
  });
};

// 5. NVIDIA NIM Developer Free Tier
const createNvidia = (
  model = "meta/llama-3.3-70b-instruct",
  maxTokens = 4096,
) => {
  if (!process.env.NVIDIA_API_KEY) return null;
  return new ChatOpenAI({
    model,
    apiKey: process.env.NVIDIA_API_KEY,
    temperature: 0,
    maxTokens,
    maxRetries: 1,
    configuration: {
      baseURL: "https://integrate.api.nvidia.com/v1",
    },
  });
};

// 6. Cloudflare Workers AI (10,000 Free Neurons/day)
const createCloudflare = (
  model = "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  maxTokens = 4096,
) => {
  if (!process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_ID) {
    return null;
  }
  return new ChatOpenAI({
    model,
    apiKey: process.env.CLOUDFLARE_API_TOKEN,
    temperature: 0,
    maxTokens,
    maxRetries: 1,
    configuration: {
      baseURL: `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/v1`,
    },
  });
};

// Global cross-provider safety net across all free tiers
const buildGlobalFallbackPool = () =>
  [
    createGroq("openai/gpt-oss-120b"),
    createGemini("gemini-3.5-flash-lite"),
    createMistral("mistral-small-latest"),
    createNvidia("meta/llama-3.3-70b-instruct"),
    createCloudflare("@cf/meta/llama-3.3-70b-instruct-fp8-fast"),
    createOpenRouterFree("openrouter/free"),
  ].filter(Boolean);

const attachFallbacks = (candidates) => {
  const valid = candidates.filter(Boolean);
  if (valid.length === 0) {
    throw new Error(
      "No free LLM API keys configured in agent .env (GROQ_API_KEY, GEMINI_API_KEY, MISTRAL_API_KEY, OPENROUTER_API_KEY, NVIDIA_API_KEY, or CLOUDFLARE_API_TOKEN).",
    );
  }
  return valid.length > 1 ? valid[0].withFallbacks(valid.slice(1)) : valid[0];
};

const buildAgentChain = (agent) => {
  const safetyNet = buildGlobalFallbackPool();

  switch (agent) {
    // 1. Ultra-fast classification & intent routing
    case "router":
    case "intent":
      return attachFallbacks([
        createGroq("openai/gpt-oss-20b", 1024),
        createGemini("gemini-3.5-flash-lite", 1024),
        createMistral("mistral-small-latest", 1024),
        ...safetyNet,
      ]);

    // 2. General conversation & live web search synthesis
    case "chat":
    case "search":
      return attachFallbacks([
        createGroq("openai/gpt-oss-120b", 8192),
        createGemini("gemini-3.8-flash", 8192),
        createNvidia("meta/llama-3.3-70b-instruct", 4096),
        createMistral("mistral-large-latest", 8192),
        ...safetyNet,
      ]);

    // 3. Dedicated coding & UI generator (Codestral + Gemini 3.8 Flash + Qwen Coder)
    case "coding":
      return attachFallbacks([
        createMistral("codestral-latest", 8192),
        createGemini("gemini-3.8-flash", 16384),
        createCloudflare("@cf/qwen/qwen2.5-coder-32b-instruct", 4096),
        createOpenRouterFree("qwen/qwen3-coder:free", 8192),
        ...safetyNet,
      ]);

    // 4. Document & presentation deck generators
    case "pdf":
    case "ppt":
      return attachFallbacks([
        createGemini("gemini-3.8-flash", 8192),
        createMistral("mistral-large-latest", 8192),
        createGroq("openai/gpt-oss-120b", 8192),
        ...safetyNet,
      ]);

    // 5. Uploaded PDF RAG question answering
    case "pdf-rag":
    case "pdfRag":
      return attachFallbacks([
        createGemini("gemini-3.5-flash-lite", 8192),
        createGroq("llama-3.3-70b-versatile", 8192),
        createNvidia("nvidia/llama-3.1-nemotron-70b-instruct", 4096),
        ...safetyNet,
      ]);

    // 6. Multimodal image analyzer (vision-capable free models only)
    case "imageAnalyzer":
      return attachFallbacks([
        createGemini("gemini-3.8-flash", 8192),
        createGemini("gemini-3.5-flash-lite", 8192),
        createMistral("pixtral-12b-2409", 4096),
        createOpenRouterFree("openrouter/free", 4096),
      ]);

    // 7. Explicit fallback / default agent
    case "fallback":
    default:
      return attachFallbacks(safetyNet);
  }
};

export const getModel = async (agent = "default") => {
  const key = String(agent || "default");
  if (!agentCache.has(key)) {
    agentCache.set(key, buildAgentChain(key));
  }
  return agentCache.get(key);
};