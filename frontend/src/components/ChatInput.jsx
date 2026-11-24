import React, { useState, useRef, useEffect } from "react";
import {
  ArrowUp,
  Paperclip,
  Globe,
  Mic,
  Zap,
  Code2,
  MessageSquare,
  FileText,
  Presentation,
  ImageIcon,
  Globe2,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import sendMessage from "../features/sendMessage";
import { addMessages, setArtifacts } from "../redux/messageSlice";
import {
  addConversation,
  setSelectedConversation,
  setConvTitle,
} from "../redux/conversationSlice";
import { createConversation } from "../features/createConversations";
import updateConversation from "../features/updateConversation";

const extractFallbackArtifacts = (markdownText, promptTitle) => {
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\s*\n([\s\S]*?)```/g;
  const matches = [...String(markdownText || "").matchAll(codeBlockRegex)];
  if (matches.length === 0) return [];

  const files = matches.map((m, idx) => {
    const lang = (m[1] || "html").toLowerCase();
    const ext =
      lang === "javascript" ? "js" : lang === "typescript" ? "ts" : lang || "txt";
    const defaultName =
      ext === "html"
        ? "index.html"
        : ext === "css"
          ? "style.css"
          : ext === "js"
            ? "script.js"
            : `file-${idx + 1}.${ext}`;

    return {
      name: defaultName,
      content: m[2].trim(),
    };
  });

  return [
    {
      id: Date.now(),
      type: "Project",
      title: promptTitle,
      files,
    },
  ];
};

const ChatInput = () => {
  const [input, setInput] = useState("");
  const [isWebSearch, setIsWebSearch] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("auto");
  const textareaRef = useRef(null);
  const dispatch = useDispatch();

  const { selectedConversation } = useSelector((state) => state.conversation);
  const artifacts = useSelector((state) => state.message?.artifacts);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const agents = [
    {
      id: "auto",
      icon: Zap,
      label: "Auto",
      placeholder: "Message NovaAI...",
    },
    {
      id: "chat",
      icon: MessageSquare,
      label: "Chat",
      placeholder: "Ask a question or start a conversation...",
    },
    {
      id: "coding",
      icon: Code2,
      label: "Coding",
      placeholder: "Write, debug, or refactor code...",
    },
    {
      id: "pdf",
      icon: FileText,
      label: "PDF",
      placeholder: "Generate or summarize a PDF document...",
    },
    {
      id: "ppt",
      icon: Presentation,
      label: "PPT",
      placeholder: "Describe the slides you want to create...",
    },
    {
      id: "vision",
      icon: ImageIcon,
      label: "Vision",
      placeholder: "Describe the image you want to generate...",
    },
    {
      id: "search",
      icon: Globe2,
      label: "Search",
      placeholder: "Search the web for real-time information...",
    },
  ];

  const activeAgent =
    agents.find((agent) => agent.id === selectedAgent) || agents[0];

  const handleSelectAgent = (agentId) => {
    setSelectedAgent(agentId);
    setIsWebSearch(agentId === "search");
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const message = input.trim();
    if (!message || isSending) return;

    setIsSending(true);
    try {
      let conversation = selectedConversation;

      // 1. Create & select a new conversation if none is active
      if (!conversation?._id) {
        const conv = await createConversation();
        if (!conv?._id) {
          console.error("Failed to create conversation.");
          return;
        }
        dispatch(addConversation(conv));
        dispatch(setSelectedConversation(conv));
        conversation = conv;
      }

      const conversationId = conversation._id;

      // 2. Optimistically append user message & clear input immediately
      dispatch(addMessages({ role: "user", content: message }));
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      // 3. Rename "New Chat" using the first message
      if (conversation.title === "New Chat") {
        const newTitle = message.slice(0, 40);
        try {
          await updateConversation({ id: conversationId, title: newTitle });
          dispatch(setConvTitle({ conversationId, title: newTitle }));
          dispatch(
            setSelectedConversation({ ...conversation, title: newTitle }),
          );
        } catch (titleErr) {
          console.error("Failed to update title:", titleErr);
        }
      }

      // 4. Send message & selected agent to backend
      const data = await sendMessage({
        prompt: message,
        conversationId,
        agent: selectedAgent.toLowerCase(),
      });

      const aiReply =
        data?.response || data?.answer || data?.message || data?.data;

      if (aiReply) {
        let incomingArtifacts = Array.isArray(data?.artifacts)
          ? data.artifacts
          : [];

        if (
          incomingArtifacts.length === 0 &&
          selectedAgent.toLowerCase() === "coding"
        ) {
          incomingArtifacts = extractFallbackArtifacts(aiReply, message);
        }

        dispatch(setArtifacts(incomingArtifacts));
        dispatch(
          addMessages({
            role: "assistant",
            content: aiReply,
            images: data?.images || [],
            artifacts: incomingArtifacts,
          }),
        );
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasOpenArtifact = Array.isArray(artifacts) && artifacts.length > 0;
  const containerWidth = hasOpenArtifact ? "max-w-3xl" : "max-w-4xl";

  return (
    <div
      className={`w-full ${containerWidth} mx-auto px-4 sm:px-6 pb-4 pt-2 shrink-0`}
    >
      <form
        onSubmit={handleSubmit}
        className="relative bg-zinc-900/90 border border-zinc-800 rounded-2xl p-2.5 focus-within:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-700 transition-all shadow-xl"
      >
        {/* Agent Selector Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pb-2.5 mb-1.5 border-b border-zinc-800/80">
          {agents.map((agent) => {
            const isActive = selectedAgent === agent.id;
            const Icon = agent.icon;

            return (
              <button
                key={agent.id}
                type="button"
                onClick={() => handleSelectAgent(agent.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "bg-white text-black font-semibold border-white"
                    : "bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800 hover:border-zinc-700"
                }`}
              >
                <Icon size={13} strokeWidth={isActive ? 2.4 : 2} />
                <span>{agent.label}</span>
              </button>
            );
          })}
        </div>

        {/* Prompt Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={activeAgent.placeholder}
          rows={1}
          className="w-full bg-transparent text-white placeholder-zinc-500 text-sm resize-none focus:outline-none px-2 py-1 max-h-44 scrollbar-none"
        />

        {/* Bottom Controls */}
        <div className="flex items-center justify-between pt-2 px-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Attach File"
            >
              <Paperclip size={18} />
            </button>
            <button
              type="button"
              onClick={() =>
                handleSelectAgent(
                  selectedAgent === "search" ? "auto" : "search",
                )
              }
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                isWebSearch || selectedAgent === "search"
                  ? "bg-zinc-100 text-black font-semibold"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
              title="Search Web"
            >
              <Globe size={15} />
              <span>Search</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Voice Input"
            >
              <Mic size={18} />
            </button>
            <button
              type="submit"
              disabled={!input.trim() || isSending}
              className={`p-2 rounded-xl transition-all duration-150 ${
                input.trim() && !isSending
                  ? "bg-white text-black hover:bg-zinc-200 cursor-pointer active:scale-95"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              }`}
              title="Send Message"
            >
              <ArrowUp size={18} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </form>

      <p className="text-[11px] text-center text-zinc-600 mt-2">
        NovaAI can make mistakes. Verify important info.
      </p>
    </div>
  );
};

export default ChatInput;