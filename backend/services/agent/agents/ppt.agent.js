import { getModel } from "../models/LLMmodels.js";
import { generatePpt } from "../utils/generatePpt.js";
import { getFromS3 } from "../utils/getFromS3.js";
import { uploadToS3 } from "../utils/uploadToS3.js";

const PPTX_MIME_TYPE =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";

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

const slugify = (text = "") =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "presentation";

const parseAndNormalizeDeck = (rawText, fallbackTopic) => {
  const cleaned = extractTextContent(rawText);
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Model did not return a valid JSON presentation structure.");
  }

  const sanitizedJson = jsonMatch[0].replace(/,\s*([}\]])/g, "$1");
  const parsed = JSON.parse(sanitizedJson);

  const title = String(
    parsed?.title || fallbackTopic || "Generated Presentation"
  ).trim();
  const subtitle = String(
    parsed?.subtitle || `Prepared by NovaAI`
  ).trim();

  const rawSlides = Array.isArray(parsed?.slides) ? parsed.slides : [];

  const slides = rawSlides
    .map((slide, idx) => {
      const slideTitle = String(
        slide?.title || slide?.heading || `Slide ${idx + 1}`
      ).trim();

      const rawPoints = Array.isArray(slide?.points)
        ? slide.points
        : Array.isArray(slide?.bullets)
          ? slide.bullets
          : [];

      const points = rawPoints
        .map((pt) => {
          const text =
            typeof pt === "string"
              ? pt
              : pt?.text || pt?.point || pt?.content || "";
          return String(text)
            .replace(/^[\s•\-*]+/, "")
            .trim();
        })
        .filter(Boolean);

      return { title: slideTitle, points };
    })
    .filter((slide) => slide.title && slide.points.length > 0);

  if (slides.length === 0) {
    throw new Error("Generated PPT JSON contained no valid slides.");
  }

  return { title, subtitle, slides };
};

export const pptAgent = async (state) => {
  const userTopic = String(state?.prompt || "").trim();

  if (!userTopic) {
    return {
      ...state,
      aiResponse: "Please provide a topic for the presentation.",
      images: [],
      artifacts: [],
    };
  }

  try {
    const llm = await getModel("ppt");

    const prompt = `
You are an executive presentation designer.
Create a crisp, well-structured 6-slide presentation deck on the user's topic.

Rules:
- Generate exactly 6 content slides.
- Each slide must have 4–5 concise bullet points (12–18 words each so they fit cleanly on slides).
- Start bullet points with a short bold-style lead-in phrase followed by a colon when appropriate (e.g., "Core Architecture: Modular design enables rapid scaling across global markets.").
- Do NOT include markdown bullets (-, *, •) or code fences (\`\`\`).
- Return ONLY valid JSON.

Format:
{
  "title": "Presentation Title",
  "subtitle": "Concise executive subtitle",
  "slides": [
    {
      "title": "Slide Title",
      "points": [
        "Lead-in: Concise point one.",
        "Lead-in: Concise point two."
      ]
    }
  ]
}

Topic: ${userTopic}
    `;

    const res = await llm.invoke(prompt);
    const data = parseAndNormalizeDeck(res.content, userTopic);

    const pptBuffer = await generatePpt(data);

    const filename = `generated-ppts/${slugify(data.title)}-${Date.now()}.pptx`;
    const expirySeconds = 24 * 60 * 60; // 24 hours

    const [, downloadUrl] = await Promise.all([
      uploadToS3(filename, pptBuffer, PPTX_MIME_TYPE),
      getFromS3(filename, expirySeconds),
    ]);

    const slideOutline = data.slides
      .map((s, idx) => `${idx + 1}. ${s.title}`)
      .join("\n");

    return {
      ...state,
      aiResponse: [
        `### Presentation Generated`,
        `**${data.title}**\n*${data.subtitle}*`,
        `**Included Slides (${data.slides.length} content slides + Cover & Closing):**\n${slideOutline}`,
        `[Download Presentation (.pptx)](${downloadUrl}) *(Link expires in 24 hours)*`,
      ].join("\n\n"),
      images: [],
      artifacts: [],
    };
  } catch (error) {
    console.error("Error in pptAgent:", error?.message || error);

    const isRateLimit =
      error?.statusCode === 429 ||
      error?.code === 429 ||
      String(error?.message || "").includes("429");

    return {
      ...state,
      aiResponse: isRateLimit
        ? "The AI provider is temporarily busy due to high traffic. Please try generating the presentation again in a few seconds."
        : "I couldn't generate that presentation right now. Please try again in a moment.",
      images: [],
      artifacts: [],
    };
  }
};