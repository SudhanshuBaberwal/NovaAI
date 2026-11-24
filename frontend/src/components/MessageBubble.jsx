import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import {
  User,
  Sparkles,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  X,
  Maximize2,
  ExternalLink,
  ArrowUpRight,
  Code2,
  PanelRightOpen,
} from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { setArtifacts } from "../redux/messageSlice";

// Repairs collapsed single-line Markdown tables (e.g. "| Col1 | Col2 | |---|---| | Val1 | Val2 |")
const normalizeMarkdown = (text) => {
  if (!text || typeof text !== "string") return "";
  return text.replace(/\|\s+\|(?=\s*[-:]+|\s*[A-Za-z0-9*"'`])/g, "|\n|");
};

const CodeBlock = ({ language, children }) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const dispatch = useDispatch();
  const codeText = String(children).replace(/\n$/, "");
  const normalizedLang = language ? language.toLowerCase() : "text";

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeText);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleOpenInArtifact = () => {
    const ext = normalizedLang === "text" ? "txt" : normalizedLang;
    const fileName = `snippet.${ext}`;
    dispatch(
      setArtifacts([
        {
          id: Date.now(),
          type: "Code",
          title: fileName,
          files: [
            {
              name: fileName,
              content: codeText,
            },
          ],
        },
      ])
    );
  };

  return (
    <div className="my-4 rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-md">
      <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-900/90 border-b border-zinc-800 text-[11px] font-mono text-zinc-400">
        <span className="uppercase tracking-wider">{language || "code"}</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpenInArtifact}
            className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Open in Artifact Panel"
          >
            <PanelRightOpen size={12} />
            <span>Artifact</span>
          </button>
          <button
            type="button"
            onClick={handleCopyCode}
            className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            {copiedCode ? (
              <>
                <Check size={12} className="text-white" />
                <span className="text-white">Copied</span>
              </>
            ) : (
              <>
                <Copy size={12} />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto font-mono text-xs leading-relaxed scrollbar-none">
        <SyntaxHighlighter
          language={normalizedLang}
          style={vscDarkPlus}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: "0.875rem",
            background: "transparent",
            fontSize: "0.75rem",
            lineHeight: "1.625",
          }}
          codeTagProps={{
            style: {
              fontFamily: "inherit",
            },
          }}
        >
          {codeText}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

const MessageBubble = ({
  role,
  content,
  userAvatar,
  onRegenerate,
  images,
  artifacts,
}) => {
  const isUser = role === "user";
  const dispatch = useDispatch();
  const [copied, setCopied] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [failedUrls, setFailedUrls] = useState({});
  const [previewImage, setPreviewImage] = useState(null);

  const validImages = (
    Array.isArray(images) ? images : images ? [images] : []
  )
    .map((img, index) => {
      if (typeof img === "string") {
        return { url: img.trim(), alt: `Image ${index + 1}` };
      }
      if (img && typeof img === "object") {
        const url = img.url || img.src || img.image_url || "";
        return {
          url: typeof url === "string" ? url.trim() : "",
          alt: img.description || img.alt || img.title || `Image ${index + 1}`,
        };
      }
      return null;
    })
    .filter((item) => item && item.url && !failedUrls[item.url]);

  const hasImages = validImages.length > 0;
  const hasContent = Boolean(content && content.trim());
  const hasArtifacts = Array.isArray(artifacts) && artifacts.length > 0;

  useEffect(() => {
    if (!previewImage) return;
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setPreviewImage(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [previewImage]);

  const handleCopy = () => {
    if (!content) return;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageError = (url) => {
    setFailedUrls((prev) => ({ ...prev, [url]: true }));
  };

  return (
    <>
      <div
        className={`flex items-start gap-3 sm:gap-3.5 w-full ${
          isUser ? "justify-end" : "justify-start"
        }`}
      >
        {/* Assistant Avatar */}
        {!isUser && (
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles size={15} className="text-white" />
          </div>
        )}

        {/* Bubble & Actions */}
        <div
          className={`group flex flex-col min-w-0 ${
            isUser
              ? "max-w-[85%] sm:max-w-[75%] items-end"
              : "flex-1 max-w-full items-start"
          }`}
        >
          <div
            className={`rounded-2xl break-words overflow-hidden ${
              isUser
                ? "bg-zinc-800 text-white border border-zinc-700 rounded-br-xs text-sm leading-relaxed"
                : "w-full bg-zinc-900/75 text-zinc-200 border border-zinc-800/90 rounded-bl-xs text-[14.5px] leading-[1.72]"
            } ${
              hasContent || hasArtifacts
                ? isUser
                  ? "px-4 py-3"
                  : "px-5 py-4"
                : "p-2"
            }`}
          >
            {/* Image Gallery */}
            {hasImages && (
              <div
                className={`grid gap-2.5 max-w-xl ${
                  validImages.length === 1 ? "grid-cols-1" : "grid-cols-2"
                } ${hasContent || hasArtifacts ? "mb-4" : ""}`}
              >
                {validImages.map((img, idx) => (
                  <button
                    key={`${img.url}-${idx}`}
                    type="button"
                    onClick={() => setPreviewImage(img)}
                    className="group/img relative overflow-hidden rounded-xl border border-zinc-700/80 bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-500 cursor-pointer block text-left"
                  >
                    <img
                      src={img.url}
                      alt={img.alt}
                      loading="lazy"
                      onError={() => handleImageError(img.url)}
                      className={`w-full object-cover transition-transform duration-200 group-hover/img:scale-[1.03] ${
                        validImages.length === 1
                          ? "max-h-72 min-h-36"
                          : "h-32 sm:h-40"
                      }`}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/30 transition-colors flex items-end justify-end p-2">
                      <span className="opacity-0 group-hover/img:opacity-100 transition-opacity p-1.5 rounded-lg bg-black/80 border border-zinc-700 text-white">
                        <Maximize2 size={12} />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Text / Rich AI Markdown Content */}
            {hasContent &&
              (isUser ? (
                <div className="whitespace-pre-wrap">{content}</div>
              ) : (
                <Markdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Paragraphs
                    p: ({ children }) => (
                      <p className="mb-3.5 last:mb-0 text-zinc-200/95">
                        {children}
                      </p>
                    ),

                    // Distinct Headings with clear hierarchy & breathing room
                    h1: ({ children }) => (
                      <h1 className="text-xl font-bold text-white tracking-tight mt-6 mb-3 pb-2 border-b border-zinc-800 first:mt-0">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-[17px] font-bold text-white tracking-tight mt-6 mb-2.5 first:mt-0">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-[15px] font-semibold text-zinc-100 mt-5 mb-2 first:mt-0">
                        {children}
                      </h3>
                    ),
                    h4: ({ children }) => (
                      <h4 className="text-sm font-semibold text-zinc-200 mt-4 mb-1.5 first:mt-0">
                        {children}
                      </h4>
                    ),

                    // Lists with comfortable item spacing
                    ul: ({ children }) => (
                      <ul className="list-disc pl-5 my-3.5 space-y-2 marker:text-zinc-500">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal pl-5 my-3.5 space-y-2 marker:text-zinc-400 marker:font-semibold">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="pl-1 leading-relaxed text-zinc-200">
                        {children}
                      </li>
                    ),

                    // Styled Monochrome Links with external indicator
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded-md bg-zinc-800/90 hover:bg-zinc-700 text-white font-medium text-[13px] border border-zinc-700/80 underline decoration-zinc-500 underline-offset-2 transition-colors"
                      >
                        <span>{children}</span>
                        <ArrowUpRight
                          size={12}
                          className="text-zinc-400 shrink-0"
                        />
                      </a>
                    ),

                    // Emphasis & Dividers
                    strong: ({ children }) => (
                      <strong className="font-semibold text-white">
                        {children}
                      </strong>
                    ),
                    em: ({ children }) => (
                      <em className="italic text-zinc-300">{children}</em>
                    ),
                    hr: () => <hr className="my-5 border-zinc-800" />,

                    // Blockquotes / Callouts
                    blockquote: ({ children }) => (
                      <blockquote className="my-4 pl-4 py-1.5 pr-3 border-l-2 border-zinc-500 bg-zinc-950/60 rounded-r-xl text-zinc-300 italic">
                        {children}
                      </blockquote>
                    ),

                    // Structured Monochrome Tables
                    table: ({ children }) => (
                      <div className="my-4 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/80 scrollbar-none">
                        <table className="w-full border-collapse text-left text-xs sm:text-[13px]">
                          {children}
                        </table>
                      </div>
                    ),
                    thead: ({ children }) => (
                      <thead className="bg-zinc-900 border-b border-zinc-800 text-[11px] font-semibold uppercase tracking-wider text-zinc-300">
                        {children}
                      </thead>
                    ),
                    tbody: ({ children }) => (
                      <tbody className="divide-y divide-zinc-800/70">
                        {children}
                      </tbody>
                    ),
                    tr: ({ children }) => (
                      <tr className="hover:bg-zinc-900/50 transition-colors">
                        {children}
                      </tr>
                    ),
                    th: ({ children }) => (
                      <th className="px-3.5 py-2.5 font-semibold text-white whitespace-nowrap">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="px-3.5 py-2.5 text-zinc-300 align-top leading-relaxed">
                        {children}
                      </td>
                    ),

                    // Prevent <pre> from wrapping our custom <CodeBlock> div
                    pre: ({ children }) => <>{children}</>,

                    // Inline & Fenced Code Blocks
                    code: ({ inline, className, children }) => {
                      const match = /language-([^\s]+)/.exec(className || "");
                      const isInline =
                        inline ?? (!match && !String(children).includes("\n"));

                      if (isInline) {
                        return (
                          <code className="px-1.5 py-0.5 mx-0.5 rounded-md bg-zinc-800 border border-zinc-700/70 text-zinc-100 font-mono text-[12.5px]">
                            {children}
                          </code>
                        );
                      }

                      return (
                        <CodeBlock language={match?.[1]}>{children}</CodeBlock>
                      );
                    },
                  }}
                >
                  {normalizeMarkdown(content)}
                </Markdown>
              ))}

            {/* Interactive Artifact Card (Opens Preview & Code Panel on Demand) */}
            {!isUser && hasArtifacts && (
              <button
                type="button"
                onClick={() => dispatch(setArtifacts(artifacts))}
                className={`${
                  hasContent ? "mt-3.5" : ""
                } flex items-center justify-between gap-3 w-full max-w-md px-3.5 py-2.5 rounded-xl bg-zinc-950 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 transition-all text-left cursor-pointer group/art`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-white shrink-0">
                    <Code2 size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">
                      {artifacts[0]?.title || "Generated Project"}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {artifacts[0]?.files?.length || 1}{" "}
                      {(artifacts[0]?.files?.length || 1) === 1
                        ? "file"
                        : "files"}{" "}
                      • Click to open Preview & Code
                    </p>
                  </div>
                </div>
                <ArrowUpRight
                  size={15}
                  className="text-zinc-500 group-hover/art:text-white shrink-0 transition-colors"
                />
              </button>
            )}
          </div>

          {/* Assistant Action Bar */}
          {!isUser && (
            <div className="flex items-center gap-1 mt-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150">
              {hasContent && (
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
              )}
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

        {/* User Avatar */}
        {isUser && (
          <div className="w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center shrink-0 mt-0.5 overflow-hidden border border-zinc-700">
            {userAvatar && !avatarError ? (
              <img
                src={userAvatar}
                alt="User"
                onError={() => setAvatarError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <User size={15} />
            )}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center"
          >
            <div className="flex items-center gap-2 self-end mb-2">
              <a
                href={previewImage.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Open original image"
              >
                <ExternalLink size={16} />
              </a>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Close preview"
              >
                <X size={16} />
              </button>
            </div>

            <img
              src={previewImage.url}
              alt={previewImage.alt}
              className="max-h-[80vh] w-auto rounded-2xl border border-zinc-800 object-contain bg-zinc-950"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default MessageBubble;