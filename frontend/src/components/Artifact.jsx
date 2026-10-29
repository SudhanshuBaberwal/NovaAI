import React, { useState } from "react";
import {
  Code2,
  Eye,
  Copy,
  Check,
  X,
  Maximize2,
  Minimize2,
  Terminal,
  FileCode,
} from "lucide-react";

const Artifact = ({ artifactData, onClose }) => {
  const [activeTab, setActiveTab] = useState("code"); // 'code' | 'preview'
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Fallback sample data if no artifact prop is passed
  const artifact = artifactData || {
    title: "Sidebar.jsx",
    type: "javascript",
    content: `// Sample Artifact Output
import React from "react";

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-black border-r border-zinc-800 text-white p-4">
      <h2 className="text-lg font-bold">NovaAI Workspace</h2>
      <p className="text-xs text-zinc-500 mt-1">Monochrome Theme Active</p>
    </aside>
  );
}`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(artifact.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex flex-col bg-zinc-950 border-l border-zinc-800 transition-all duration-300 z-30 ${
        isFullscreen
          ? "fixed inset-0 z-50 w-full h-full"
          : "w-full lg:w-[480px] xl:w-[560px] h-screen shrink-0"
      }`}
    >
      {/* Top Header Bar */}
      <div className="h-14 px-4 border-b border-zinc-800 flex items-center justify-between bg-black/80 shrink-0">
        {/* Title Info */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 shrink-0">
            <FileCode size={16} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate leading-tight">
              {artifact.title}
            </h3>
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
              {artifact.type}
            </span>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-2">
          {/* Code / Preview Switcher */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 p-0.5 rounded-lg">
            <button
              onClick={() => setActiveTab("code")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === "code"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Code2 size={13} />
              <span>Code</span>
            </button>
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === "preview"
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Eye size={13} />
              <span>Preview</span>
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            title="Copy Code"
          >
            {copied ? (
              <Check size={16} className="text-emerald-400" />
            ) : (
              <Copy size={16} />
            )}
          </button>

          {/* Full Size / Fullscreen Toggle Button */}
          <button
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium border border-zinc-800 transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Full Size" : "Full Size"}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            <span className="hidden sm:inline">
              {isFullscreen ? "Exit Full Size" : "Full Size"}
            </span>
          </button>

          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
              title="Close Panel"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content View (No Horizontal Scrollbar) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative bg-black font-mono text-xs leading-relaxed">
        {activeTab === "code" ? (
          <div className="p-4 text-zinc-300">
            <pre className="font-mono whitespace-pre-wrap break-words">
              <code>{artifact.content}</code>
            </pre>
          </div>
        ) : (
          <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-6 text-center text-zinc-400">
            <Terminal size={32} className="mb-3 text-zinc-600" />
            <p className="text-sm font-medium text-zinc-300">
              Live Preview Container
            </p>
            <p className="text-xs text-zinc-500 max-w-xs mt-1">
              Component rendering or sandbox execution can be displayed here.
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="h-8 px-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between text-[11px] text-zinc-500 font-mono shrink-0">
        <span>Lines: {artifact.content.split("\n").length}</span>
        <span>UTF-8</span>
      </div>
    </div>
  );
};

export default Artifact;