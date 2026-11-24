import { Annotation } from "@langchain/langgraph";

export const agentState = Annotation.Root({
  prompt: Annotation(),
  conversationId: Annotation(),
  agent: Annotation(),
  aiResponse: Annotation(),
  searchResults: Annotation(),
  images: Annotation({
    reducer: (_, next) => next ?? [],
    default: () => [],
  }),
  artifacts: Annotation({
    reducer: (_, next) => next ?? [],
    default: () => [],
  }),
});