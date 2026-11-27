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
  X,
  Loader2,
} from "lucide-react";
import { AnimatePresence } from "motion/react";
import { useSelector, useDispatch } from "react-redux";
import sendMessage from "../features/sendMessage";
import { addMessages, setArtifacts } from "../redux/messageSlice";
import {
  addConversation,
  setSelectedConversation,
  setConvTitle,
} from "../redux/conversationSlice";
import { setUserData } from "../redux/userSlice";
import { createConversation } from "../features/createConversations";
import updateConversation from "../features/updateConversation";
import { useToast } from "../utils/ToastContext";
import LoadingAnimation from "./LoadingAnimation";

const AGENT_CREDIT_COST = {
  auto: 1,
  chat: 1,
  search: 5,
  coding: 10,
  pdf: 10,
  vision: 10,
  ppt: 10,
};

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

const isAllowedFile = (file) =>
  file && (file.type === "application/pdf" || file.type.startsWith("image/"));

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
  const [attachments, setAttachments] = useState([]);
  const [sendingHasFiles, setSendingHasFiles] = useState(false);
  const [isWebSearch, setIsWebSearch] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("auto");
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const dispatch = useDispatch();
  const { showToast } = useToast();

  const { selectedConversation } = useSelector((state) => state.conversation);
  const { userData } = useSelector((state) => state.user);
  const artifacts = useSelector((state) => state.message?.artifacts);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  useEffect(() => {
    return () => {
      attachments.forEach((item) => {
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, [attachments]);

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

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    const validItems = [];
    for (const file of selectedFiles) {
      if (!isAllowedFile(file)) {
        showToast?.("Only PDF and Image files are allowed.", "error");
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        showToast?.(`${file.name} exceeds the 20MB limit.`, "error");
        continue;
      }

      const isImage = file.type.startsWith("image/");
      validItems.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        name: file.name,
        isImage,
        previewUrl: isImage ? URL.createObjectURL(file) : null,
      });
    }

    if (validItems.length > 0) {
      setAttachments((prev) => [...prev, ...validItems]);
    }

    e.target.value = "";
  };

  const handleRemoveAttachment = (id) => {
    setAttachments((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const message = input.trim();
    const hasFiles = attachments.length > 0;
    if ((!message && !hasFiles) || isSending) return;

    setSendingHasFiles(hasFiles);
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
      const effectivePrompt =
        message ||
        `Analyze the attached ${attachments.map((a) => a.name).join(", ")}`;

      const optimisticImages = attachments
        .filter((a) => a.isImage && a.previewUrl)
        .map((a) => a.previewUrl);

      const currentAttachments = [...attachments];

      // 2. Optimistically append user message & clear input/attachments immediately
      dispatch(
        addMessages({
          role: "user",
          content: effectivePrompt,
          images: optimisticImages,
        }),
      );
      setInput("");
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      // 3. Rename "New Chat" using the first message
      if (conversation.title === "New Chat") {
        const newTitle = effectivePrompt.slice(0, 40);
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

      // 4. Send FormData
      const normalizedAgent = selectedAgent.toLowerCase();
      const formData = new FormData();
      formData.append("prompt", effectivePrompt);
      formData.append("conversationId", conversationId);
      formData.append("agent", normalizedAgent);

      currentAttachments.forEach((item) => {
        formData.append("files", item.file);
      });

      const data = await sendMessage(formData);

      const aiReply =
        data?.response || data?.answer || data?.message || data?.data;

      if (aiReply) {
        let incomingArtifacts = Array.isArray(data?.artifacts)
          ? data.artifacts
          : [];

        if (incomingArtifacts.length === 0 && normalizedAgent === "coding") {
          incomingArtifacts = extractFallbackArtifacts(
            aiReply,
            effectivePrompt,
          );
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

        // 5. Sync remaining credits in Redux immediately
        if (userData) {
          const cost = AGENT_CREDIT_COST[data?.agent || normalizedAgent] ?? 1;
          const updatedCredits =
            typeof data?.credits === "number"
              ? data.credits
              : Math.max(0, (Number(userData.credits) || 0) - cost);

          dispatch(
            setUserData({
              ...userData,
              credits: updatedCredits,
            }),
          );
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      showToast?.(
        error?.response?.data?.message || "Failed to send message.",
        "error",
      );
    } finally {
      setIsSending(false);
      setSendingHasFiles(false);
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
  const canSubmit =
    (input.trim().length > 0 || attachments.length > 0) && !isSending;

  return (
    <div
      className={`w-full ${containerWidth} mx-auto px-4 sm:px-6 pb-4 pt-2 shrink-0`}
    >
      {/* Active Query Loading Animation */}
      <AnimatePresence>
        {isSending && (
          <LoadingAnimation
            agent={selectedAgent}
            hasAttachments={sendingHasFiles}
          />
        )}
      </AnimatePresence>

      <form
        onSubmit={handleSubmit}
        className="relative bg-zinc-900/90 border border-zinc-800 rounded-2xl p-2.5 focus-within:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-700 transition-all shadow-xl"
      >
        {/* Hidden File Input (Images & PDFs only) */}
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Agent Selector Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pb-2.5 mb-1.5 border-b border-zinc-800/80">
          {agents.map((agent) => {
            const isActive = selectedAgent === agent.id;
            const Icon = agent.icon;

            return (
              <button
                key={agent.id}
                type="button"
                disabled={isSending}
                onClick={() => handleSelectAgent(agent.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border transition-all duration-150 ${
                  isActive
                    ? "bg-white text-black font-semibold border-white"
                    : "bg-zinc-950/60 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800 hover:border-zinc-700"
                } ${isSending ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
              >
                <Icon size={13} strokeWidth={isActive ? 2.4 : 2} />
                <span>{agent.label}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Attachments Preview */}
        {attachments.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap px-2 py-2 mb-1.5">
            {attachments.map((item) => (
              <div
                key={item.id}
                className="relative group flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 max-w-[200px]"
              >
                {item.isImage && item.previewUrl ? (
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    className="w-7 h-7 rounded-md object-cover border border-zinc-700 shrink-0"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-300 shrink-0">
                    <FileText size={14} />
                  </div>
                )}
                <span className="truncate">{item.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(item.id)}
                  className="p-0.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors cursor-pointer shrink-0"
                  title="Remove attachment"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Prompt Textarea */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isSending ? "Generating response..." : activeAgent.placeholder
          }
          rows={1}
          className="w-full bg-transparent text-white placeholder-zinc-500 text-sm resize-none focus:outline-none px-2 py-1 max-h-44 scrollbar-none"
        />

        {/* Bottom Controls */}
        <div className="flex items-center justify-between pt-2 px-1">
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={isSending}
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Attach Image or PDF"
            >
              <Paperclip size={18} />
            </button>
            <button
              type="button"
              disabled={isSending}
              onClick={() =>
                handleSelectAgent(
                  selectedAgent === "search" ? "auto" : "search",
                )
              }
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
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
              disabled={isSending}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Voice Input"
            >
              <Mic size={18} />
            </button>
            <button
              type="submit"
              disabled={!canSubmit}
              className={`p-2 rounded-xl transition-all duration-150 ${
                canSubmit
                  ? "bg-white text-black hover:bg-zinc-200 cursor-pointer active:scale-95"
                  : isSending
                    ? "bg-zinc-800 text-white cursor-wait"
                    : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              }`}
              title={isSending ? "Generating..." : "Send Message"}
            >
              {isSending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <ArrowUp size={18} strokeWidth={2.5} />
              )}
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