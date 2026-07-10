import { getModel } from "../models/LLMmodels.js"

export const chatAgent = async (state) => {
    const llm= await getModel("chat")
    const systemPrompt = `You are NovaAI, an intelligent AI assistant`
    const result = (await llm).invoke([
        {
            "role":"system",
            "content":systemPrompt
        },
        {
            "role":"human",
            "content":state.prompt
        }
    ])

    return {
        ...state,
        aiResponse:result
    }
}