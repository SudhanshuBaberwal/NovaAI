import { getModel } from "../models/LLMmodels.js";

const CODING_PATTERN =
  /\b(code|coding|website|web\s*app|webpage|landing\s*page|greeting\s*card|card|portfolio|dashboard|navbar|header|footer|hero|component|form|login|signup|modal|sidebar|gallery|slider|carousel|calculator|todo|to-do|game|clone|ui|ux|frontend|front-end|html|css|tailwind|react|next\.?js|vue|javascript|js|typescript|ts|python|java|c\+\+|sql|api|script|function|debug|fix\s+bug)\b/i;

const VALID_AGENTS = new Set([
  "chat",
  "search",
  "coding",
  "pdf",
  "ppt",
  "vision",
]);

export const router = async (state) => {
  const requestedAgent = String(state.agent || "auto")
    .trim()
    .toLowerCase();

  // Handle both array (from req.files) and single Multer file object
  const files = Array.isArray(state.file)
    ? state.file
    : state.file
      ? [state.file]
      : [];
  const primaryFile = files[0];

  if (primaryFile?.mimetype === "application/pdf") {
    return {
      ...state,
      file: primaryFile,
      files,
      agent: "pdfRag",
    };
  }

  if (primaryFile?.mimetype?.startsWith("image/")) {
    return {
      ...state,
      file: primaryFile,
      files,
      agent: "imageAnalyzer",
    };
  }

  // Map frontend "image" pill to graph's "vision" node
  if (requestedAgent === "image") {
    return {
      ...state,
      agent: "vision",
    };
  }

  // Respect explicit agent selection
  if (requestedAgent && requestedAgent !== "auto") {
    return {
      ...state,
      agent: VALID_AGENTS.has(requestedAgent) ? requestedAgent : "chat",
    };
  }

  // Fast deterministic routing for UI / frontend / code generation prompts in Auto mode
  if (CODING_PATTERN.test(state.prompt || "")) {
    return {
      ...state,
      agent: "coding",
    };
  }

  const llm = await getModel("router");
  const prompt = `
You are an agent router.
Available agents:
- chat
- search
- coding
- pdf
- ppt
- vision

Rules:
- coding: build websites, UI cards, components, pages, apps, generate code, debug code, architecture, API design
- search: current events, latest information, live weather/time/prices, news, internet lookup
- pdf: generate PDFs or document context
- ppt: generate presentations or slides
- vision: generate or create standalone AI artwork/pictures/photos (NOT HTML/CSS UI cards or web components)
- chat: general conversation, explanations, learning, questions

Return ONLY one lowercase word from: chat, search, coding, pdf, ppt, vision

User Query: ${state.prompt}
  `;

  try {
    const response = await llm.invoke(prompt);
    const cleaned = String(response.content || "chat")
      .trim()
      .toLowerCase()
      .replace(/[^a-z]/g, "");

    const resolvedAgent =
      cleaned === "image"
        ? "vision"
        : VALID_AGENTS.has(cleaned)
          ? cleaned
          : "chat";

    return {
      ...state,
      agent: resolvedAgent,
    };
  } catch (error) {
    console.error("Router LLM error, falling back to chat:", error.message);
    return {
      ...state,
      agent: "chat",
    };
  }
};