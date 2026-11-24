import React, { useRef, useEffect } from "react";
import { useSelector } from "react-redux";
import { Sparkles, Code, Lightbulb, PenTool, Compass } from "lucide-react";
import MessageBubble from "./MessageBubble";

const MessageList = () => {
  const rawMessages = useSelector((state) => state.message?.messages);
  const artifacts = useSelector((state) => state.message?.artifacts);
  const { userData } = useSelector((state) => state.user || {});
  const messagesEndRef = useRef(null);

  const messages = Array.isArray(rawMessages)
    ? rawMessages
    : Array.isArray(rawMessages?.messages)
      ? rawMessages.messages
      : Array.isArray(rawMessages?.data)
        ? rawMessages.data
        : [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const hasOpenArtifact = Array.isArray(artifacts) && artifacts.length > 0;
  const containerWidth = hasOpenArtifact ? "max-w-3xl" : "max-w-4xl";

  if (messages.length === 0) {
    return (
      <div
        className={`flex-1 flex flex-col items-center justify-center p-4 sm:p-6 ${containerWidth} mx-auto w-full text-center`}
      >
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
    <div
      className={`flex-1 w-full ${containerWidth} mx-auto px-4 sm:px-6 py-6 space-y-6`}
    >
      {messages.map((msg, idx) => (
        <MessageBubble
          key={msg._id || idx}
          role={msg.role || msg.sender}
          content={msg.content || msg.text || msg.message || ""}
          userAvatar={userData?.avatar}
          images={msg.images}
          artifacts={msg.artifacts}
        />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;