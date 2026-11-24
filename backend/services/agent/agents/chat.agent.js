import { getModel } from "../models/LLMmodels.js";
import { getMemory } from "../config/memory.js";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";

const MAX_HISTORY_MESSAGES = 24;
const MAX_SNIPPET_LENGTH = 1500;

// Normalizes string or multi-part content blocks returned by different LLM providers
const extractTextContent = (content) => {
  if (typeof content === "string") return content.trim();
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === "string" ? part : part?.text || ""))
      .join("")
      .trim();
  }
  return "";
};

// Sanitizes Redis chat history and prevents empty or duplicate trailing messages
const buildHistoryMessages = (rawHistory, currentPrompt) => {
  const list = Array.isArray(rawHistory)
    ? rawHistory
    : Array.isArray(rawHistory?.messages)
      ? rawHistory.messages
      : Array.isArray(rawHistory?.data)
        ? rawHistory.data
        : [];

  const validMessages = list
    .map((msg) => ({
      role: String(msg?.role || msg?.sender || "").toLowerCase(),
      content: extractTextContent(msg?.content ?? msg?.text ?? msg?.message),
    }))
    .filter((msg) => msg.content.length > 0)
    .slice(-MAX_HISTORY_MESSAGES);

  // Avoid duplicating the current prompt if memory already persisted it
  const lastMsg = validMessages[validMessages.length - 1];
  if (
    lastMsg &&
    lastMsg.role === "user" &&
    lastMsg.content === String(currentPrompt || "").trim()
  ) {
    validMessages.pop();
  }

  return validMessages.map((msg) =>
    msg.role === "user"
      ? new HumanMessage(msg.content)
      : new AIMessage(msg.content),
  );
};

// Formats Tavily/web search results cleanly while bounding token usage
const formatSearchResults = (searchResults = []) => {
  if (!Array.isArray(searchResults) || searchResults.length === 0) return "";

  return searchResults
    .map((item, idx) => {
      const title = String(item?.title || `Source ${idx + 1}`).trim();
      const url = String(item?.url || "").trim();
      const rawSnippet = String(item?.content || item?.snippet || "").trim();
      const snippet =
        rawSnippet.length > MAX_SNIPPET_LENGTH
          ? `${rawSnippet.slice(0, MAX_SNIPPET_LENGTH)}...`
          : rawSnippet;

      return `[${idx + 1}] ${title}${url ? ` (${url})` : ""}\n${snippet}`;
    })
    .join("\n\n");
};

export const chatAgent = async (state) => {
  const userPrompt = String(state?.prompt || "").trim();
  const existingImages = Array.isArray(state?.images) ? state.images : [];

  try {
    const llm = await getModel("chat");

    let rawHistory = [];
    if (state?.conversationId) {
      try {
        rawHistory = await getMemory(state.conversationId);
      } catch (memError) {
        console.warn("Memory fetch warning in chatAgent:", memError.message);
      }
    }

    const formattedSearchResults = formatSearchResults(state?.searchResults);
    const hasSearchResults = formattedSearchResults.length > 0;

    const nowUTC = new Date().toUTCString();
    const nowIST = new Date().toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "full",
      timeStyle: "medium",
    });

    const searchContext = hasSearchResults
      ? `
Web Search Results:
${formattedSearchResults}

Search Synthesis Rules:
- Synthesize a direct, accurate answer grounded in the Web Search Results above.
- For queries asking the current time, date, or live status ("now", "today"), rely on the Current Reference Time below rather than cached timestamps inside scraped pages.
- Cite sources inline using descriptive Markdown links like [Source Title](https://example.com) rather than raw URLs.
- Never mention internal search pipelines or tool names.
`
      : "";

    const systemPrompt = `
You are NovaAI, a sharp, reliable, and adaptable AI assistant.

Current Reference Time:
- UTC: ${nowUTC}
- India (IST): ${nowIST}
${searchContext}
Core Behavior:
- Start directly with the answer in your first sentence. Never open with filler phrases such as "Sure!", "Certainly!", "Of course!", or "Here is...".
- Match response depth to the query: give concise, natural answers for simple questions, and structured, thorough breakdowns for technical or multi-part topics.
- Never fabricate facts, URLs, or APIs. If a request is genuinely ambiguous or missing critical details, ask one brief clarifying question instead of guessing.

Formatting & Markdown Rules (Strict):
- For casual greetings or simple one-line questions, reply in clean plain text without unnecessary headings or bullet lists.
- For structured, educational, or technical responses, format with clean GitHub Flavored Markdown:
  - Use ## for main sections and ### for subsections (avoid # so headings fit cleanly inside chat bubbles).
  - Always place a blank line before and after headings, lists, blockquotes, tables, and code blocks.
  - Never put a heading and body text on the same line.
  - When rendering Markdown tables, put EVERY row on its own line with standard pipes and a separator row (never collapse table rows onto a single line).
  - Format links as clean Markdown links ([Label](URL)) so they render as interactive source badges.
  - Use **bold** selectively for key concepts and keep paragraphs concise (2–4 sentences max).

Coding Guidelines:
- Wrap all code snippets in fenced code blocks with an explicit language tag (e.g., \`\`\`javascript, \`\`\`jsx, \`\`\`python, \`\`\`bash).
- Provide complete, runnable snippets without "// rest of code here" placeholders unless brevity is requested.
- Keep explanations outside code blocks rather than cluttering code with excessive comments.
`;

    const messages = [
      new SystemMessage(systemPrompt),
      ...buildHistoryMessages(rawHistory, userPrompt),
      new HumanMessage(userPrompt),
    ];

    const result = await llm.invoke(messages);
    const aiResponse =
      extractTextContent(result?.content) ||
      "I couldn't generate a response for that request. Please try rephrasing.";

    return {
      ...state,
      aiResponse,
      images: existingImages,
      artifacts: [],
    };
  } catch (error) {
    console.error("Error in chatAgent:", error.message);

    const isRateLimit =
      error?.statusCode === 429 ||
      error?.code === 429 ||
      String(error?.message || "").includes("429");

    return {
      ...state,
      aiResponse: isRateLimit
        ? "The AI provider is temporarily experiencing high traffic. Please try again in a few seconds."
        : "Something went wrong while generating a response. Please try again.",
      images: existingImages,
      artifacts: [],
    };
  }
};
