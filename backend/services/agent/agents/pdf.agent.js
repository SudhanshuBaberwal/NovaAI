import { getModel } from "../models/LLMmodels.js";
import { generatePDF } from "../utils/generatePDF.js";
import { getFromS3 } from "../utils/getFromS3.js";
import { uploadToS3 } from "../utils/uploadToS3.js";

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
    .slice(0, 40) || "document";

const parseAndNormalizeDocument = (rawText, fallbackTopic) => {
  const cleaned = extractTextContent(rawText);
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    throw new Error("Model did not return a valid JSON document structure.");
  }

  // Remove accidental trailing commas before closing brackets/braces
  const sanitizedJson = jsonMatch[0].replace(/,\s*([}\]])/g, "$1");
  const parsed = JSON.parse(sanitizedJson);

  const title = String(
    parsed?.title || fallbackTopic || "Generated Document",
  ).trim();
  const subtitle = String(
    parsed?.subtitle ||
      `Prepared by NovaAI • ${new Date().toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })}`,
  ).trim();

  const rawSections = Array.isArray(parsed?.sections) ? parsed.sections : [];

  const sections = rawSections
    .map((sec, idx) => {
      const heading = String(
        sec?.heading || sec?.title || `Section ${idx + 1}`,
      ).trim();

      const rawPoints = Array.isArray(sec?.points)
        ? sec.points
        : Array.isArray(sec?.bullets)
          ? sec.bullets
          : [];

      const points = rawPoints
        .map((pt) => {
          const text =
            typeof pt === "string"
              ? pt
              : pt?.text || pt?.point || pt?.content || "";
          // Strip leading markdown bullets so generatePDF doesn't double-bullet
          return String(text)
            .replace(/^[\s•\-*]+/, "")
            .trim();
        })
        .filter(Boolean);

      return { heading, points };
    })
    .filter((sec) => sec.heading && sec.points.length > 0);

  if (sections.length === 0) {
    throw new Error("Generated PDF JSON contained no valid sections.");
  }

  return { title, subtitle, sections };
};

export const pdfAgent = async (state) => {
  const userTopic = String(state?.prompt || "").trim();

  if (!userTopic) {
    return {
      ...state,
      aiResponse:
        "Please provide a topic or instructions for the PDF document.",
      images: [],
      artifacts: [],
    };
  }

  try {
    const llm = await getModel("pdf");

    const currentDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const prompt = `
You are an executive document architect and subject-matter writer.
Current Reference Date: ${currentDate}

Create a comprehensive, well-structured document based on the user's request.

Content Guidelines:
- Write a clear, authoritative document title and an informative subtitle.
- Generate 5–8 logical sections that thoroughly cover the topic from overview to actionable takeaways or conclusions.
- Each section must contain 4–6 specific, concrete bullet points (1–2 crisp sentences each).
- Avoid vague filler, repetitive phrasing, or markdown bullet prefixes (-, *, •) inside the strings.
- Do NOT include markdown code fences (\`\`\`), commentary, or text outside the JSON object.

Return ONLY valid JSON matching this exact schema:
{
  "title": "Document Title",
  "subtitle": "Concise subtitle or context",
  "sections": [
    {
      "heading": "Section Heading",
      "points": [
        "Detailed point one.",
        "Detailed point two.",
        "Detailed point three."
      ]
    }
  ]
}

User Request: ${userTopic}
    `;

    const res = await llm.invoke(prompt);
    const data = parseAndNormalizeDocument(res.content, userTopic);

    const pdfBuffer = await generatePDF(data);

    const filename = `generated-pdfs/${slugify(data.title)}-${Date.now()}.pdf`;
    await uploadToS3(filename, pdfBuffer, "application/pdf");

    const expirySeconds = 24 * 60 * 60; // 24 hours
    const downloadUrl = await getFromS3(filename, expirySeconds);

    const sectionOutline = data.sections
      .map((sec, idx) => `${idx + 1}. ${sec.heading}`)
      .join("\n");

    return {
      ...state,
      aiResponse: [
        `### PDF Document Generated`,
        `**${data.title}**\n*${data.subtitle}*`,
        `**Included Sections (${data.sections.length}):**\n${sectionOutline}`,
        `[Download PDF](${downloadUrl}) *(Link expires in 24 hours)*`,
      ].join("\n\n"),
      images: [],
      artifacts: [],
    };
  } catch (error) {
    console.error("Error in pdfAgent:", error?.message || error);

    const isRateLimit =
      error?.statusCode === 429 ||
      error?.code === 429 ||
      String(error?.message || "").includes("429");

    return {
      ...state,
      aiResponse: isRateLimit
        ? "The AI provider is temporarily busy due to high traffic. Please try generating the PDF again in a few seconds."
        : "I couldn't generate the PDF document right now. Please try again with a slightly more specific topic.",
      images: [],
      artifacts: [],
    };
  }
};
