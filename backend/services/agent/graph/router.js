import { getModel } from "../models/LLMmodels.js";

export const router = async (state) => {
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
            chat:
                General conversation,
                explanations,
                learning,
                questions,
            search:
                current events,
                latest information,
                news,
                recent developments,
                internet lookup,
            coding:
                generate code,
                dubug code,
                build projects,
                architecture,
                API design,
            pdf:
                questions about generate PDFs or document context
            ppt:
                questions about generate ppts or ppt context
            vision:
                Generate image 
                create image


            Return ONLY one word:
                chat 
                search 
                coding 
                pdf
                ppt
                vision

        
    User Query:${state.prompt}
    `;

    const response = await llm.invoke(prompt)

    return {
        ...state,
        agent:response.content.trim().toLowerCase()
    }
};

