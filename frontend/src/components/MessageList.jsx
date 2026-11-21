import React, { useRef, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  User,
  Sparkles,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Code,
  Lightbulb,
  PenTool,
  Compass,
} from "lucide-react";

const MessageList = () => {
  const { selectedConversation } = useSelector(
    (state) => state.conversation || {},
  );
  const { messages } = useSelector((state) => state.message);
  const messagesEndRef = useRef(null);
  const [copiedIdx, setCopiedIdx] = useState(null);

  // const messages = selectedConversation?.messages || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(index);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  // Welcome Screen when no messages are active
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-3xl mx-auto w-full text-center">
        <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-inner">
          <Sparkles size={28} className="text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          What can I help with today?
        </h1>
        <p className="text-sm text-zinc-400 max-w-md mb-8">
          Ask questions, summarize documents, debug code, or brainstorm ideas
          with NovaAI.
        </p>

        {/* Suggestion Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
          {[
            {
              title: "Write React Code",
              desc: "Build a responsive sidebar component in Tailwind",
              icon: Code,
            },
            {
              title: "Brainstorm Strategy",
              desc: "Marketing plan for launching a SaaS product",
              icon: Lightbulb,
            },
            {
              title: "Summarize Document",
              desc: "Paste text or key points to get a concise summary",
              icon: PenTool,
            },
            {
              title: "Explore Ideas",
              desc: "Suggest creative topics for technical blogging",
              icon: Compass,
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                className="p-3.5 rounded-xl border border-zinc-800/80 bg-zinc-900/40 hover:bg-zinc-900 hover:border-zinc-700 transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon
                    size={16}
                    className="text-zinc-400 group-hover:text-white transition-colors"
                  />
                  <span className="text-xs font-semibold text-zinc-200">
                    {item.title}
                  </span>
                </div>
                <p className="text-[12px] text-zinc-500 line-clamp-1">
                  {item.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto px-4 py-6 space-y-6">
      {Array.isArray(messages) &&
        messages.map((msg, idx) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={idx}
              className={`flex items-start gap-3 sm:gap-4 ${
                isUser ? "justify-end" : "justify-start"
              }`}
            >
              {/* AI Avatar */}
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles size={16} className="text-white" />
                </div>
              )}

              {/* Content Box */}
              <div
                className={`group relative max-w-[85%] sm:max-w-[78%] ${isUser ? "order-1" : "order-2"}`}
              >
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? "bg-zinc-800 text-white rounded-br-none border border-zinc-700"
                      : "bg-zinc-900/60 text-zinc-200 border border-zinc-800/80 rounded-bl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>

                {/* AI Message Action Toolbar */}
                {!isUser && (
                  <div className="flex items-center gap-1 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleCopy(msg.content, idx)}
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                      title="Copy message"
                    >
                      {copiedIdx === idx ? (
                        <Check size={14} className="text-emerald-400" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                    <button
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                      title="Good response"
                    >
                      <ThumbsUp size={14} />
                    </button>
                    <button
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                      title="Bad response"
                    >
                      <ThumbsDown size={14} />
                    </button>
                    <button
                      className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                      title="Regenerate"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-white text-black font-semibold flex items-center justify-center shrink-0 mt-0.5 order-2">
                  <User size={16} />
                </div>
              )}
            </div>
          );
        })}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
