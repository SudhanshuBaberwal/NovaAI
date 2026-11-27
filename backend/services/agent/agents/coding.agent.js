import { getModel } from "../models/LLMmodels.js";
import { resolveUnsplashPlaceholders } from "../config/unsplash.js";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentLimit.js";

const parseProjectFiles = (rawText = "") => {
  const files = [];

  // 1. Primary parser: <file name="index.html">...</file> (immune to quote/newline escaping bugs)
  const fileTagRegex = /<file\s+name=["']([^"']+)["']\s*>([\s\S]*?)<\/file>/gi;
  for (const match of rawText.matchAll(fileTagRegex)) {
    const name = match[1]?.trim();
    const content = match[2]?.replace(/^\n+|\n+$/g, "");
    if (name && content) {
      files.push({ name, content });
    }
  }

  if (files.length > 0) {
    return files;
  }

  // 2. Fallback parser: JSON { "files": [...] }
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed?.files) && parsed.files.length > 0) {
        return parsed.files.filter(
          (f) => f?.name && typeof f?.content === "string",
        );
      }
    } catch (err) {
      console.error("Fallback JSON parse failed in codingAgent:", err.message);
    }
  }

  return [];
};

const isFrontendOrProjectPrompt = (prompt = "") => {
  const projectKeywords =
    /\b(website|web\s*app|webpage|landing\s*page|portfolio|dashboard|navbar|header|footer|hero\s*section|card|component|form|login|signup|modal|sidebar|gallery|slider|carousel|pricing|calculator|todo|to-do|game|clone|ui|ux|frontend|front-end|html|css|tailwind|react|page|template|layout|design|build|create|generate|make)\b/i;
  const nonGenerationKeywords =
    /\b(explain|what\s+is|how\s+does|why\s+does|debug|fix\s+this|review|optimize\s+this|difference\s+between)\b/i;

  return projectKeywords.test(prompt) && !nonGenerationKeywords.test(prompt);
};

export const codingAgent = async (state) => {
  await checkAgentLimit(state.userId,"coding")
  const intentLLM = await getModel("intent");
  const llm = await getModel("coding");

  let isCodeGeneration = isFrontendOrProjectPrompt(state.prompt);
  let intent = isCodeGeneration ? "CODE_GENERATION" : "CODE_EXPLANATION";

  if (!isCodeGeneration) {
    const intentRes = await intentLLM.invoke(`
You are an intent classifier.
Classify the user's request into ONE of these exact labels:
- CODE_GENERATION (building, writing, creating, or generating any UI, website, component, page, app, or runnable code)
- CODE_REVIEW
- CODE_EXPLANATION
- DEBUGGING
- DOCUMENTATION

Return ONLY the label name with no punctuation or extra text.
User Request: ${state.prompt}
    `);

    intent = String(intentRes.content || "")
      .trim()
      .toUpperCase();
    isCodeGeneration =
      intent.includes("CODE_GENERATION") || intent.includes("CODE GENERATION");
  }

  if (isCodeGeneration) {
    const prompt = `
You are NOVA AI coding agent.
Generate a complete, working, visually polished project for the user's request.

Default stack:
- index.html
- style.css
- script.js

Use React / Next.js / Vue ONLY if explicitly requested.

Design & Code Rules:
- Fully responsive layout (mobile, tablet, desktop)
- Modern, clean UI with CSS variables, Flexbox/Grid, smooth hover transitions, and balanced spacing
- Include realistic sample data, interactive states, and working JavaScript functionality
- Link style.css and script.js properly inside index.html

Image Rules (CRITICAL):
- Whenever the UI needs photos, banners, cards, avatars, or backgrounds, NEVER invent fake Unsplash URLs or use source.unsplash.com.
- Instead, write UNSPLASH_IMAGE(descriptive search query) as the exact URL value.
- Examples:
  - HTML: <img src="UNSPLASH_IMAGE(fresh green salad bowl)" alt="Fresh Green Salad" />
  - CSS: background-image: url("UNSPLASH_IMAGE(modern dark coffee shop)");
  - JS: image: "UNSPLASH_IMAGE(margherita pizza)"
- Use specific 2–4 word English search terms for each item so every card gets a relevant, distinct photo.

Output Format (STRICT):
Return ONLY the project files wrapped in <file name="..."> tags. Do NOT wrap in markdown code fences (\`\`\`), and do NOT include explanations before or after.

<file name="index.html">
<!DOCTYPE html>
<html lang="en">
...
</html>
</file>

<file name="style.css">
...
</file>

<file name="script.js">
...
</file>

User Request: ${state.prompt}
    `;

    const res = await llm.invoke(prompt);
    const rawText = String(res.content || "").trim();
    const parsedFiles = parseProjectFiles(rawText);
    if (parsedFiles.length > 0) {
      const hydratedFiles = await resolveUnsplashPlaceholders(parsedFiles);

      await deductCredits(state.userId, "coding");
      return {
        ...state,
        aiResponse: "Code Generated Successfully.",
        artifacts: [
          {
            id: Date.now(),
            type: "Project",
            files: hydratedFiles,
            title: state.prompt,
          },
        ],
      };
    }
  }

  const res = await llm.invoke(`
The user's request is: ${intent}

Return Markdown only.
Never generate project files.
Use headings like:
## Overview
## Explanation
## Problems
## Improvements
## Best Practices
## Optimized Code (if needed)

User Request:
${state.prompt}
  `);

  await deductCredits(state.userId, "coding");

  return {
    ...state,
    aiResponse: res.content,
    artifacts: [],
  };
};
