import React, { useState } from "react";
import {
  User,
  Sparkles,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
} from "lucide-react";
import Markdown from "react-markdown";

const MessageBubble = ({ role, content, userAvatar, onRegenerate }) => {
  const isUser = role === "user";
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex items-start gap-2.5 sm:gap-3.5 w-full ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles size={15} className="text-white" />
        </div>
      )}

      <div
        className={`group flex flex-col max-w-[85%] sm:max-w-[78%] ${
          isUser ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed break-words ${
            isUser
              ? "bg-zinc-800 text-white border border-zinc-700 rounded-br-xs whitespace-pre-wrap"
              : "bg-zinc-900/70 text-zinc-200 border border-zinc-800 rounded-bl-xs"
          }`}
        >
          {isUser ? (
            content
          ) : (
            <Markdown
              components={{
                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                h1: ({ children }) => (
                  <h1 className="text-lg font-bold text-white mt-3 mb-1.5">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-base font-bold text-white mt-3 mb-1.5">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-sm font-semibold text-white mt-2.5 mb-1">
                    {children}
                  </h3>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal pl-5 mb-2 space-y-1">
                    {children}
                  </ol>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-white">
                    {children}
                  </strong>
                ),
                code: ({ inline, children }) =>
                  inline ? (
                    <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-100 font-mono text-xs">
                      {children}
                    </code>
                  ) : (
                    <pre className="p-3 my-2 rounded-xl bg-black border border-zinc-800 overflow-x-auto font-mono text-xs text-zinc-200">
                      <code>{children}</code>
                    </pre>
                  ),
              }}
            >
              {content}
            </Markdown>
          )}
        </div>

        {!isUser && (
          <div className="flex items-center gap-1 mt-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150">
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
              title="Copy"
            >
              {copied ? (
                <Check size={13} className="text-white" />
              ) : (
                <Copy size={13} />
              )}
            </button>
            <button
              className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
              title="Good response"
            >
              <ThumbsUp size={13} />
            </button>
            <button
              className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
              title="Bad response"
            >
              <ThumbsDown size={13} />
            </button>
            {onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-1.5 rounded-md text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
                title="Regenerate"
              >
                <RotateCcw size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center shrink-0 mt-0.5 overflow-hidden border border-zinc-700">
          {userAvatar && !imgError ? (
            <img
              src={userAvatar}
              alt="User"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <User size={15} />
          )}
        </div>
      )}
    </div>
  );
};

export default MessageBubble;