import fs from "fs";
import { PDFParse } from "pdf-parse";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { vectorStore } from "../config/vectorDb.js";
import { getModel } from "../models/LLMmodels.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentLimit.js";

export const pdfRag = async (state) => {
  try {
    await checkAgentLimit(state.userId,"pdf")
    const buffer = fs.readFileSync(state.file.path);
    const pdf = new PDFParse({
      data: buffer,
    });

    const result = await pdf.getText();
    const text = result.text;

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await splitter.createDocuments([text]);
    const collectionName = `pdf-${Date.now()}`;

    const store = await vectorStore(docs, collectionName);
    const relevantDocs = await store.similaritySearch(state.prompt, 5);

    const context = relevantDocs.map((d) => d.pageContent).join("\n\n");
    const llm = await getModel("pdf-rag");

    const messages = [
      new SystemMessage(`
        You are NOVA AI PDF Assistant.
        Rules:
        - Answer ONLY from the uploaded PDF.
        - Never make up information.
        - If the answer is not present in the PDF, reply: "I couldn't find this information in this uploaded PDF."
        - Use Markdown formatting.
      `),
      new HumanMessage(`
        Context:
        ${context}

        Question: ${state.prompt}
      `),
    ];

    const response = await llm.invoke(messages);
    const deductRes = await deductCredits(state.userId, "pdf");

    return {
      ...state,
      aiResponse: response.content,
      ...(typeof deductRes?.credits === "number"
        ? { credits: deductRes.credits }
        : {}),
    };
  } catch (error) {
    console.error("pdfRag error:", error);
    return {
      ...state,
      aiResponse: "Failed to analyze pdf",
    };
  } finally {
    if (state.file?.path && fs.existsSync(state.file.path)) {
      fs.unlinkSync(state.file.path);
    }
  }
};