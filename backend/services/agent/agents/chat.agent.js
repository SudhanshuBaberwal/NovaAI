import { getModel } from "../models/LLMmodels.js";
import { getMemory } from "../config/memory.js";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";

export const chatAgent = async (state) => {
  const llm = await getModel("chat");

  const rawHistory = await getMemory(state.conversationId);
  const history = Array.isArray(rawHistory)
    ? rawHistory
    : Array.isArray(rawHistory?.messages)
      ? rawHistory.messages
      : [];

  const hasSearchResults =
    Array.isArray(state.searchResults) && state.searchResults.length > 0;

  const formattedSearchResults = hasSearchResults
    ? state.searchResults
        .map(
          (item, idx) =>
            `[${idx + 1}] ${item.title || "Source"} (${item.url || ""})\n${item.content || ""}`
        )
        .join("\n\n")
    : "";

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

Search Instructions:
- Synthesize an accurate answer using the web search results above.
- For queries asking the current time, date, or live status ("now", "today"), rely on the Current Reference Time below rather than cached timestamps inside scraped snippets.
- Cite sources naturally with Markdown links when helpful, and never mention internal search tools.
`
    : "";

  const systemPrompt = `
You are CortexAI, a sharp, helpful, and reliable AI assistant.

Current Reference Time:
- UTC: ${nowUTC}
- India (IST): ${nowIST}
${searchContext}
Core Behavior:
- Start directly with the answer. Never open with filler phrases like "Sure!", "Certainly!", or "Here is...".
- Match response length to the query: keep simple answers brief and natural, and provide structured, thorough explanations for complex or technical topics.
- Never fabricate facts or APIs. If a request is ambiguous or missing critical context, ask one concise clarifying question instead of guessing.

Formatting & Markdown:
- For casual greetings or simple one-line questions, respond in plain text without unnecessary headings or lists.
- For technical, coding, educational, or multi-part topics, format responses in clean Markdown.
- Use ## for main headings and ### for subheadings (avoid # so titles do not appear oversized inside chat bubbles).
- Always leave a blank line before and after headings, lists, and code blocks.
- Never write headings and body content on the same line.
- Use bullet points for unordered items and numbered lists for sequential steps.
- Use **bold** selectively to highlight key terms or takeaways.
- Keep paragraphs short (2–4 sentences max) and avoid dense walls of text.

Coding Guidelines:
- Always wrap code in fenced code blocks with explicit language tags (e.g., \`\`\`jsx, \`\`\`javascript, \`\`\`python, \`\`\`bash).
- Write complete, clean, working code—never omit core logic with "// rest of code here" placeholders unless asked.
- Place explanations outside code blocks rather than overloading code with inline comments.
`;

  const messages = [new SystemMessage(systemPrompt)];

  history.forEach((msg) => {
    const role = msg.role || msg.sender;
    if (role === "user") {
      messages.push(new HumanMessage(msg.content));
    } else {
      messages.push(new AIMessage(msg.content));
    }
  });

  messages.push(new HumanMessage(state.prompt));

  const result = await llm.invoke(messages);

  return {
    ...state,
    aiResponse: result.content,
  };
};