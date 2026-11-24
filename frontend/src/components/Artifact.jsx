import React, { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  PanelRightClose,
  PanelLeftOpen,
  RefreshCw,
} from "lucide-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { setArtifacts } from "../redux/messageSlice";

const LANGUAGE_MAP = {
  html: { prism: "markup", label: "HTML" },
  htm: { prism: "markup", label: "HTML" },
  xml: { prism: "markup", label: "XML" },
  svg: { prism: "markup", label: "SVG" },
  css: { prism: "css", label: "CSS" },
  scss: { prism: "scss", label: "SCSS" },
  js: { prism: "javascript", label: "JavaScript" },
  mjs: { prism: "javascript", label: "JavaScript" },
  cjs: { prism: "javascript", label: "JavaScript" },
  jsx: { prism: "jsx", label: "JSX" },
  ts: { prism: "typescript", label: "TypeScript" },
  tsx: { prism: "tsx", label: "TSX" },
  py: { prism: "python", label: "Python" },
  python: { prism: "python", label: "Python" },
  json: { prism: "json", label: "JSON" },
  java: { prism: "java", label: "Java" },
  cpp: { prism: "cpp", label: "C++" },
  c: { prism: "c", label: "C" },
  cs: { prism: "csharp", label: "C#" },
  go: { prism: "go", label: "Go" },
  rs: { prism: "rust", label: "Rust" },
  rust: { prism: "rust", label: "Rust" },
  php: { prism: "php", label: "PHP" },
  rb: { prism: "ruby", label: "Ruby" },
  sql: { prism: "sql", label: "SQL" },
  sh: { prism: "bash", label: "Bash" },
  bash: { prism: "bash", label: "Bash" },
  yaml: { prism: "yaml", label: "YAML" },
  yml: { prism: "yaml", label: "YAML" },
  md: { prism: "markdown", label: "Markdown" },
};

const getLanguageInfo = (fileName = "", fallbackType = "") => {
  const ext = fileName.includes(".")
    ? fileName.split(".").pop().toLowerCase().trim()
    : "";
  const key = ext || fallbackType.toLowerCase().trim();

  if (LANGUAGE_MAP[key]) {
    return LANGUAGE_MAP[key];
  }

  return {
    prism: key || "text",
    label: key ? key.toUpperCase() : "TEXT",
  };
};

// Bundles index.html, CSS, and JS files into a single runnable iframe srcDoc
const buildPreviewDocument = (files = []) => {
  if (!Array.isArray(files) || files.length === 0) return "";

  const htmlFile =
    files.find((f) => f.name?.toLowerCase() === "index.html") ||
    files.find((f) => f.name?.toLowerCase().endsWith(".html"));

  const cssContent = files
    .filter((f) => f.name?.toLowerCase().endsWith(".css"))
    .map((f) => f.content || "")
    .join("\n\n");

  const jsContent = files
    .filter((f) => f.name?.toLowerCase().endsWith(".js"))
    .map((f) => f.content || "")
    .join("\n\n");

  let html = htmlFile?.content || "";

  if (!html && (cssContent || jsContent)) {
    html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Preview</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;
  }

  // Strip local stylesheet/script tags so they don't 404 inside srcDoc
  html = html
    .replace(/<link[^>]+href=["'](?:\.\/)?[^"']+\.css["'][^>]*>/gi, "")
    .replace(
      /<script[^>]+src=["'](?:\.\/)?[^"']+\.js["'][^>]*>\s*<\/script>/gi,
      "",
    );

  const styleTag = cssContent ? `<style>\n${cssContent}\n</style>` : "";
  const fallbackGuardScript = `<script>
    window.addEventListener("error", function (e) {
      var target = e.target;
      if (target && target.tagName === "IMG" && !target.dataset.fallbackApplied) {
        target.dataset.fallbackApplied = "true";
        target.src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=80";
      }
    }, true);
  </script>`;

  const scriptTag = `${fallbackGuardScript}\n${
    jsContent ? `<script>\n${jsContent}\n</script>` : ""
  }`;

  if (styleTag) {
    html = html.includes("</head>")
      ? html.replace("</head>", `${styleTag}\n</head>`)
      : `${styleTag}\n${html}`;
  }

  if (scriptTag) {
    html = html.includes("</body>")
      ? html.replace("</body>", `${scriptTag}\n</body>`)
      : `${html}\n${scriptTag}`;
  }

  return html;
};

const Artifact = ({ artifactData, onClose }) => {
  const dispatch = useDispatch();
  const artifacts = useSelector((state) => state.message?.artifacts);

  const artifact =
    artifactData ||
    (Array.isArray(artifacts) && artifacts.length > 0
      ? artifacts[artifacts.length - 1]
      : null);

  const files = useMemo(() => {
    if (!artifact) return [];
    if (Array.isArray(artifact.files) && artifact.files.length > 0) {
      return artifact.files;
    }
    if (artifact.content) {
      return [
        {
          name: artifact.title || "index.html",
          content: artifact.content,
        },
      ];
    }
    return [];
  }, [artifact]);

  const hasWebPreview = useMemo(
    () => files.some((f) => /\.(html|css|js)$/i.test(f.name || "")),
    [files],
  );

  const [activeTab, setActiveTab] = useState("code"); // 'code' | 'preview'
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);

  // Auto-expand when a new artifact arrives or is reopened from a message card
  useEffect(() => {
    if (!artifact) return;
    setSelectedFileIndex(0);
    setIsCollapsed(false);
    setActiveTab(hasWebPreview ? "preview" : "code");
  }, [artifacts, artifact?.id, artifact?.title, hasWebPreview]);

  // Hide completely when no artifact is active
  if (!artifact || files.length === 0) {
    return null;
  }

  const activeFile = files[selectedFileIndex] || files[0];
  const languageInfo = getLanguageInfo(activeFile?.name, artifact.type);
  const previewSrcDoc = buildPreviewDocument(files);

  const handleClose = () => {
    setIsFullscreen(false);
    setIsCollapsed(false);
    if (onClose) {
      onClose();
    } else {
      dispatch(setArtifacts([]));
    }
  };

  const handleCopy = () => {
    if (!activeFile?.content) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Collapsed State: Slim vertical rail on desktop + floating pill on mobile
  if (isCollapsed) {
    return (
      <>
        {/* Desktop Collapsed Vertical Rail */}
        <aside className="hidden lg:flex flex-col items-center justify-between w-12 h-dvh py-3 bg-zinc-950 border-l border-zinc-800 shrink-0 z-30 transition-all duration-200">
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Expand Artifact"
            >
              <PanelLeftOpen size={16} />
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("code");
                setIsCollapsed(false);
              }}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
              title="Open Code View"
            >
              <Code2 size={15} />
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("preview");
                setIsCollapsed(false);
              }}
              className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
              title="Open Preview"
            >
              <Eye size={15} />
            </button>
          </div>

          {/* Vertical Artifact Title */}
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="my-4 text-[11px] font-mono tracking-wider text-zinc-400 hover:text-white transition-colors cursor-pointer [writing-mode:vertical-rl] rotate-180 truncate max-h-56"
            title={`Expand: ${artifact.title || "Generated Project"}`}
          >
            {artifact.title || "Generated Project"}
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            title="Close Artifact"
          >
            <X size={15} />
          </button>
        </aside>

        {/* Mobile Collapsed Floating Pill */}
        <div className="lg:hidden fixed bottom-24 right-4 z-40 flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full bg-zinc-900 border border-zinc-700 shadow-2xl">
          <button
            type="button"
            onClick={() => setIsCollapsed(false)}
            className="flex items-center gap-2 text-xs font-medium text-white cursor-pointer"
          >
            <Code2 size={14} className="text-zinc-300" />
            <span className="max-w-[140px] truncate">
              {artifact.title || "Artifact"}
            </span>
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
            title="Close Artifact"
          >
            <X size={13} />
          </button>
        </div>
      </>
    );
  }

  return (
    <aside
      className={`flex flex-col bg-zinc-950 border-l border-zinc-800 transition-all duration-200 ${
        isFullscreen
          ? "fixed inset-0 z-50 w-full h-dvh"
          : "fixed inset-0 z-50 w-full h-dvh lg:static lg:z-30 lg:w-[48%] xl:w-[50%] lg:max-w-[720px] shrink-0"
      }`}
    >
      {/* Top Header Bar */}
      <div className="h-14 px-3 sm:px-4 border-b border-zinc-800 flex items-center justify-between gap-2 bg-black shrink-0">
        {/* Left: Collapse Toggle, Title & Copy */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => {
              setIsFullscreen(false);
              setIsCollapsed(true);
            }}
            className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            title="Collapse Panel"
          >
            <PanelRightClose size={15} />
          </button>

          <div className="p-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 shrink-0">
            <Code2 size={15} />
          </div>

          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white truncate max-w-[120px] sm:max-w-[190px]">
              {artifact.title || "Generated Project"}
            </h3>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer shrink-0"
            title={`Copy ${activeFile?.name || "code"}`}
          >
            {copied ? (
              <Check size={15} className="text-white" />
            ) : (
              <Copy size={15} />
            )}
          </button>
        </div>

        {/* Right: Code / Preview Switcher, Fullscreen & Close */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <div className="flex items-center bg-zinc-900 border border-zinc-800 p-0.5 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab("code")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === "code"
                  ? "bg-white text-black font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Code2 size={13} />
              <span>Code</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preview")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === "preview"
                  ? "bg-white text-black font-semibold"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Eye size={13} />
              <span>Preview</span>
            </button>
          </div>

          {activeTab === "preview" && hasWebPreview && (
            <button
              type="button"
              onClick={() => setPreviewKey((k) => k + 1)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
              title="Reload Preview"
            >
              <RefreshCw size={15} />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsFullscreen((prev) => !prev)}
            className="hidden lg:flex items-center justify-center p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            title="Close Artifact"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* File Tabs Bar (Shown in Code View) */}
      {activeTab === "code" && files.length > 0 && (
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-zinc-800 bg-zinc-950 shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {files.map((file, idx) => {
              const isSelected = idx === selectedFileIndex;
              return (
                <button
                  key={`${file.name}-${idx}`}
                  type="button"
                  onClick={() => setSelectedFileIndex(idx)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono transition-colors cursor-pointer shrink-0 ${
                    isSelected
                      ? "bg-zinc-800 text-white border border-zinc-700"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent"
                  }`}
                >
                  <FileCode size={12} />
                  <span>{file.name}</span>
                </button>
              );
            })}
          </div>

          <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-zinc-400 uppercase shrink-0">
            {languageInfo.label}
          </span>
        </div>
      )}

      {/* Main Content View */}
      <div className="flex-1 overflow-hidden relative flex flex-col bg-black">
        {activeTab === "code" ? (
          <div className="flex-1 overflow-y-auto overflow-x-auto scrollbar-none bg-black">
            <SyntaxHighlighter
              language={languageInfo.prism}
              style={vscDarkPlus}
              showLineNumbers
              lineNumberStyle={{
                minWidth: "2.75em",
                paddingRight: "1em",
                color: "#52525b",
                userSelect: "none",
              }}
              customStyle={{
                margin: 0,
                padding: "1rem",
                background: "#000000",
                fontSize: "0.8rem",
                lineHeight: "1.65",
              }}
              codeTagProps={{
                style: {
                  fontFamily:
                    "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                },
              }}
            >
              {activeFile?.content || ""}
            </SyntaxHighlighter>
          </div>
        ) : hasWebPreview && previewSrcDoc ? (
          <iframe
            key={`${artifact.id || artifact.title}-${previewKey}`}
            title={artifact.title || "Live Preview"}
            srcDoc={previewSrcDoc}
            sandbox="allow-scripts allow-modals"
            className="w-full h-full bg-white border-0"
          />
        ) : (
          <div className="w-full h-full bg-zinc-950 flex flex-col items-center justify-center p-6 text-center text-zinc-400">
            <Terminal size={32} className="mb-3 text-zinc-600" />
            <p className="text-sm font-medium text-zinc-300">
              No Visual Preview Available
            </p>
            <p className="text-xs text-zinc-500 max-w-xs mt-1">
              Switch to the Code tab to inspect or copy the generated files.
            </p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="h-8 px-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between text-[11px] text-zinc-500 font-mono shrink-0">
        <span>
          {activeFile?.name || "file"} •{" "}
          {(activeFile?.content || "").split("\n").length} lines
        </span>
        <span>{languageInfo.label} • UTF-8</span>
      </div>
    </aside>
  );
};

export default Artifact;
