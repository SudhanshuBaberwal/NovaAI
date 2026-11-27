import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Code2,
  FileText,
  Presentation,
  ImageIcon,
  Globe2,
  MessageSquare,
} from "lucide-react";

const AGENT_STATUS_CONFIG = {
  auto: {
    icon: Sparkles,
    steps: [
      "Routing your request...",
      "Analyzing context...",
      "Generating response...",
    ],
  },
  chat: {
    icon: MessageSquare,
    steps: ["Thinking...", "Drafting response..."],
  },
  coding: {
    icon: Code2,
    steps: [
      "Architecting solution...",
      "Writing clean code...",
      "Bundling live preview...",
    ],
  },
  pdf: {
    icon: FileText,
    steps: [
      "Reading document context...",
      "Structuring executive brief...",
      "Compiling PDF...",
    ],
  },
  ppt: {
    icon: Presentation,
    steps: [
      "Outlining slide deck...",
      "Designing widescreen layouts...",
      "Rendering .pptx slides...",
    ],
  },
  vision: {
    icon: ImageIcon,
    steps: [
      "Interpreting visual prompt...",
      "Rendering high-res pixels...",
      "Finalizing image...",
    ],
  },
  search: {
    icon: Globe2,
    steps: [
      "Searching live web...",
      "Cross-checking sources...",
      "Synthesizing answer...",
    ],
  },
};

const LoadingAnimation = ({ agent = "auto", hasAttachments = false }) => {
  const normalizedAgent = String(agent || "auto").toLowerCase();
  const config = hasAttachments
    ? {
        icon: FileText,
        steps: [
          "Uploading attachment...",
          "Extracting content...",
          "Generating insights...",
        ],
      }
    : AGENT_STATUS_CONFIG[normalizedAgent] || AGENT_STATUS_CONFIG.auto;

  const Icon = config.icon;
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    setStepIndex(0);
    if (config.steps.length <= 1) return;

    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % config.steps.length);
    }, 2200);

    return () => clearInterval(interval);
  }, [normalizedAgent, hasAttachments]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.98 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="relative overflow-hidden flex items-center justify-between gap-3 px-3.5 py-2.5 mb-2.5 rounded-xl bg-zinc-950/90 border border-zinc-800 shadow-lg"
    >
      {/* Subtle monochrome shimmer sweep */}
      <motion.div
        aria-hidden="true"
        initial={{ x: "-100%" }}
        animate={{ x: "200%" }}
        transition={{
          repeat: Infinity,
          duration: 2.2,
          ease: "linear",
        }}
        className="pointer-events-none absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
      />

      {/* Left: Animated Icon + Cycling Status Text */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative flex items-center justify-center w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 text-white shrink-0">
          <motion.span
            animate={{ scale: [1, 1.35, 1], opacity: [0.45, 0, 0.45] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
            className="absolute inset-0 rounded-lg border border-white/40"
          />
          <Icon size={14} />
        </div>

        <div className="flex items-center gap-2 min-w-0">
          <AnimatePresence mode="wait">
            <motion.span
              key={config.steps[stepIndex]}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="text-xs font-medium text-zinc-200 truncate"
            >
              {config.steps[stepIndex]}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>

      {/* Right: Equalizer Wave Bars */}
      <div className="flex items-center gap-1 shrink-0 px-1">
        {[0, 1, 2, 3].map((bar) => (
          <motion.span
            key={bar}
            animate={{
              height: ["4px", "14px", "6px", "12px", "4px"],
              opacity: [0.4, 1, 0.6, 1, 0.4],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.1,
              delay: bar * 0.14,
              ease: "easeInOut",
            }}
            className="w-0.5 rounded-full bg-white"
          />
        ))}
      </div>
    </motion.div>
  );
};

export default LoadingAnimation;