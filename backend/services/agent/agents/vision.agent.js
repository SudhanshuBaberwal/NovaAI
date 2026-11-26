import axios from "axios";
import { getModel } from "../models/LLMmodels.js";
import { uploadToS3 } from "../utils/uploadToS3.js";
import { getFromS3 } from "../utils/getFromS3.js";
import { deductCredits } from "../utils/deductCredits.js";

const DIMENSIONS_BY_RATIO = {
  square: { width: 1024, height: 1024 },
  landscape: { width: 1280, height: 720 },
  portrait: { width: 720, height: 1280 },
};

const parsePromptPlan = (rawText, fallbackPrompt) => {
  const cleaned = String(rawText || "").trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      const ratio = String(parsed.aspectRatio || "square")
        .toLowerCase()
        .trim();

      return {
        enhancedPrompt: String(parsed.enhancedPrompt || fallbackPrompt).trim(),
        aspectRatio: DIMENSIONS_BY_RATIO[ratio] ? ratio : "square",
        style: String(parsed.style || "Custom Visual").trim(),
      };
    } catch {
      // Fall back to plain text if JSON parsing fails
    }
  }

  const plainPrompt = cleaned.replace(/^["'`]+|["'`]+$/g, "").trim();

  return {
    enhancedPrompt: plainPrompt || fallbackPrompt,
    aspectRatio: "square",
    style: "Custom Visual",
  };
};

export const visinAgent = async (state) => {
  try {
    const llm = await getModel("image");

    const res = await llm.invoke(`
You are an elite AI image prompt engineer.
Transform the user's request into a vivid, cohesive image generation prompt tailored to the subject and artistic medium.

Guidelines:
- Match the medium to the user's intent (e.g., photorealistic photography, 3D render, anime/illustration, digital painting, minimalist vector/logo, cinematic concept art). Do NOT force photography terms onto cartoons, logos, or paintings.
- Specify the main subject, pose/action, environment/background, lighting mood, color palette, camera framing or perspective, and fine surface textures.
- Keep the prompt concise, descriptive, and natural (60–110 words). Avoid repetitive buzzword lists.
- Detect the best aspectRatio from the user's request ("landscape" for banners/wallpapers/scenery, "portrait" for mobile wallpapers/posters/full-body characters, or "square" by default).

Return ONLY valid JSON matching this schema:
{
  "enhancedPrompt": "detailed prompt here",
  "aspectRatio": "square | landscape | portrait",
  "style": "2-3 word style label"
}

User Request: ${state.prompt}
    `);

    const { enhancedPrompt, aspectRatio, style } = parsePromptPlan(
      res.content,
      state.prompt,
    );

    const { width, height } = DIMENSIONS_BY_RATIO[aspectRatio];
    const seed = Math.floor(Math.random() * 1_000_000_000);

    const params = new URLSearchParams({
      width: String(width),
      height: String(height),
      seed: String(seed),
      nologo: "true",
      enhance: "false",
      model: "flux",
    });

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      enhancedPrompt,
    )}?${params.toString()}`;

    const imageRes = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 60000,
      headers: {
        Accept: "image/*",
      },
    });

    const contentType = imageRes.headers?.["content-type"] || "image/png";
    if (!contentType.startsWith("image/")) {
      throw new Error("Upstream image service returned a non-image response.");
    }

    const extension =
      contentType.includes("jpeg") || contentType.includes("jpg")
        ? "jpg"
        : contentType.includes("webp")
          ? "webp"
          : "png";

    const buffer = Buffer.from(imageRes.data);
    const filename = `generated-images/image-${Date.now()}-${seed}.${extension}`;

    await uploadToS3(filename, buffer, contentType);

    const expirySeconds = 24 * 60 * 60; // 24 hours
    const downloadUrl = await getFromS3(filename, expirySeconds);
    await deductCredits(state.userId, "vision");
    return {
      ...state,
      aiResponse: [
        `### Image Generated`,
        `**Style:** ${style} • **Resolution:** ${width}×${height}`,
        `> *${enhancedPrompt}*`,
        `[Download Image](${downloadUrl}) *(Link expires in 24 hours)*`,
      ].join("\n\n"),
      images: [downloadUrl],
      artifacts: [],
    };
  } catch (error) {
    console.error("Error in visionAgent:", error.message);

    return {
      ...state,
      aiResponse:
        "I couldn't generate that image right now due to an upstream image service timeout or error. Please try again in a moment.",
      images: [],
      artifacts: [],
    };
  }
};

export const visionAgent = visinAgent;
