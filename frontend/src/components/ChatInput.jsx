import React, { useState, useRef, useEffect } from "react";
import { ArrowUp, Paperclip, Globe, Mic } from "lucide-react";
import { useSelector } from "react-redux";
import sendMessage from "../features/sendMessage";

const ChatInput = () => {
  const [input, setInput] = useState("");
  const [isWebSearch, setIsWebSearch] = useState(false);
  const textareaRef = useRef(null);

  const { selectedConversation } = useSelector((state) => state.conversation);
  // Auto-resize textarea height as content grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const message = input.trim();
    if (!message) return;
    try {
      const conversationId = selectedConversation?._id;
      if (!conversationId) {
        console.error(
          "No conversation selected. Create or select a conversation first.",
        );
        return;
      }
      const payload = {
        prompt: input.trim(),
        conversationId,
      };
      const data = await sendMessage(payload);
      console.log(data);
      setInput("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4 pt-2 shrink-0">
      <form
        onSubmit={handleSubmit}
        className="relative bg-zinc-900/90 border border-zinc-800 rounded-2xl p-2.5 focus-within:border-zinc-700 focus-within:ring-1 focus-within:ring-zinc-700 transition-all shadow-xl"
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message NovaAI..."
          rows={1}
          className="w-full bg-transparent text-white placeholder-zinc-500 text-sm resize-none focus:outline-none px-2 py-1 max-h-44 scrollbar-none"
        />

        <div className="flex items-center justify-between pt-2 px-1">
          {/* Left Controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Attach File"
            >
              <Paperclip size={18} />
            </button>
            <button
              type="button"
              onClick={() => setIsWebSearch((prev) => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                isWebSearch
                  ? "bg-zinc-100 text-black font-semibold"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
              title="Search Web"
            >
              <Globe size={15} />
              <span>Search</span>
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              title="Voice Input"
            >
              <Mic size={18} />
            </button>
            <button
              type="submit"
              disabled={!input.trim()}
              className={`p-2 rounded-xl transition-all duration-150 ${
                input.trim()
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
