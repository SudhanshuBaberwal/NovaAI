import { checkAgentLimit } from "../config/agentLimit.js";
import { searchTool } from "../config/tavily.js";
import { deductCredits } from "../utils/deductCredits.js";

export const searchAgent = async (state) => {
  try {
    await checkAgentLimit(state.userId,"search")
    const response = await searchTool.invoke({
      query: state.prompt,
    });

    const results = Array.isArray(response?.results)
      ? response.results
      : Array.isArray(response)
        ? response
        : [];

    await deductCredits(state.userId, "search");
    const images = Array.isArray(response?.images) ? response.images : [];
    return {
      ...state,
      searchResults: results,
      images,
    };
  } catch (error) {
    console.error("Search agent error:", error);
    return {
      ...state,
      searchResults: [],
      images: [],
    };
  }
};
