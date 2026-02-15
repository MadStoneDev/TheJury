"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  IconEye,
  IconEyeOff,
  IconChevronLeft,
  IconChevronRight,
  IconPlayerStop,
  IconMaximize,
  IconMinimize,
  IconWifi,
  IconWifiOff,
} from "@tabler/icons-react";

interface PresenterControlsProps {
  liveState: string;
  currentQuestion: number;
  totalQuestions: number;
  isConnected: boolean;
  onToggleResults: () => void;
  onPrevQuestion: () => void;
  onNextQuestion: () => void;
  onClosePoll: () => void;
}

export default function PresenterControls({
  liveState,
  currentQuestion,
  totalQuestions,
  isConnected,
  onToggleResults,
  onPrevQuestion,
  onNextQuestion,
  onClosePoll,
}: PresenterControlsProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Auto-hide after 3s of inactivity
  useEffect(() => {
    const handleMouseMove = () => {
      setIsVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setIsVisible(false), 3000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    // Start the initial hide timer
    hideTimerRef.current = setTimeout(() => setIsVisible(false), 3000);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  // Track fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await document.documentElement.requestFullscreen();
      }
    } catch {
      // Fullscreen not supported or denied
    }
  };

  const resultsVisible =
    liveState === "accepting_votes" || liveState === "results_revealed";

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 shadow-2xl">
            {/* Connection indicator */}
            <div className="flex items-center gap-1.5 px-2">
              {isConnected ? (
                <IconWifi size={16} className="text-emerald-400" />
              ) : (
                <IconWifiOff size={16} className="text-red-400" />
              )}
            </div>

            <div className="w-px h-6 bg-white/10" />

            {/* Results toggle */}
            <button
              onClick={onToggleResults}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                resultsVisible
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
              }`}
              title={resultsVisible ? "Hide results" : "Show results"}
            >
              {resultsVisible ? (
                <>
                  <IconEyeOff size={16} />
                  Hide Results
                </>
              ) : (
                <>
                  <IconEye size={16} />
                  Show Results
                </>
              )}
            </button>

            {/* Multi-question navigation */}
            {totalQuestions > 1 && (
              <>
                <div className="w-px h-6 bg-white/10" />
                <button
                  onClick={onPrevQuestion}
                  disabled={currentQuestion <= 1}
                  className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Previous question"
                >
                  <IconChevronLeft size={18} />
                </button>
                <span className="text-sm text-white/60 font-mono tabular-nums min-w-[60px] text-center">
                  Q{currentQuestion}/{totalQuestions}
                </span>
                <button
                  onClick={onNextQuestion}
                  disabled={currentQuestion >= totalQuestions}
                  className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Next question"
                >
                  <IconChevronRight size={18} />
                </button>
              </>
            )}

            <div className="w-px h-6 bg-white/10" />

            {/* Fullscreen toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              {isFullscreen ? (
                <IconMinimize size={18} />
              ) : (
                <IconMaximize size={18} />
              )}
            </button>

            {/* Close poll */}
            <button
              onClick={onClosePoll}
              disabled={liveState === "closed"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="Close poll"
            >
              <IconPlayerStop size={16} />
              Close
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
