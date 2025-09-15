import { useState, useEffect, useCallback, useRef } from "react";

/**
 * A comprehensive exam security hook that PREVENTS violations.
 * - Blocks keyboard shortcuts for new tabs (Ctrl+T), closing tabs (Ctrl+W), etc.
 * - Disables text selection, copy, paste, and right-clicking.
 * - Detects tab switching, window blurring, and exiting fullscreen as fallback violations.
 *
 * @param {Function} onFinishExam - Callback to auto-submit the exam.
 * @param {number} maxViolations - The violation number that triggers the final warning.
 * @param {Function} onWarning - Callback to show a popup for any violation.
 */
export function useFullScreenExamSecurity(
  onFinishExam,
  maxViolations = 3,
  onWarning
) {
  const [violations, setViolations] = useState(-1); // -1 indicates exam has not started
  const isHandlingViolation = useRef(false);

  const handleViolation = useCallback(
    (reason) => {
      if (isHandlingViolation.current) return;
      isHandlingViolation.current = true;
      const newCount = violations + 1;
      setViolations(newCount);

      if (newCount <= maxViolations) {
        let message;
        if (newCount === maxViolations) {
          message = `FINAL WARNING: You have attempted to leave the exam ${newCount} times. One more violation will result in automatic submission.`;
        } else {
          message = `Warning: You attempted to leave the exam window. This is violation ${newCount} of ${maxViolations}. Please remain in the exam.`;
        }
        onWarning?.(message);
      } else {
        onFinishExam?.();
      }
      setTimeout(() => {
        isHandlingViolation.current = false;
      }, 500);
    },
    [violations, maxViolations, onFinishExam, onWarning]
  );

  useEffect(() => {
    if (violations === -1) return;

    // --- DETECTION LOGIC (Fallback for stubborn browsers/methods) ---
    const handleVisibilityChange = () => {
      if (document.hidden) handleViolation("Switched tabs");
    };
    const handleBlur = () => {
      if (document.fullscreenElement) handleViolation("Left exam window");
    };
    const handleFullScreenChange = () => {
      if (!document.fullscreenElement) handleViolation("Exited fullscreen");
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullScreenChange);

    // --- NEW: PREVENTION LOGIC ---

    // 1. Block Keyboard Shortcuts
    const handleKeyDown = (e) => {
      // Block Ctrl+T (new tab), Ctrl+N (new window), Ctrl+W (close tab)
      if (e.ctrlKey && (e.key === "t" || e.key === "n" || e.key === "w")) {
        e.preventDefault();
        handleViolation("Tried to open or close a tab/window");
      }
      // Block Ctrl+Tab (switch tabs)
      if (e.ctrlKey && e.key === "Tab") {
        e.preventDefault();
        handleViolation("Tried to switch tabs");
      }
      // Block Alt+Tab (application switching) - This is harder to block but we can try.
      if (e.altKey && e.key === "Tab") {
        e.preventDefault();
        handleViolation("Tried to switch applications");
      }
    };

    // 2. Disable context menu (right-click)
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    // 3. Disable copy, paste, and cut
    const preventAction = (e) => {
      e.preventDefault();
      alert("This action is disabled during the exam.");
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", preventAction);
    document.addEventListener("paste", preventAction);
    document.addEventListener("cut", preventAction);

    // --- Cleanup all listeners ---
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullScreenChange);

      // Cleanup prevention listeners
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", preventAction);
      document.removeEventListener("paste", preventAction);
      document.removeEventListener("cut", preventAction);
    };
  }, [violations, handleViolation]);

  // Public function to start the exam and activate monitoring
  const startExam = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setViolations(0); // Start counting from zero
      return true;
    } catch (err) {
      alert(
        "Fullscreen mode is required to start the exam. Please allow it and try again."
      );
      return false;
    }
  };

  // Public function to re-enter fullscreen after a warning
  const reEnterFullScreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.error("Could not re-enter fullscreen:", err);
      onFinishExam?.();
    }
  };

  return { startExam, violations, reEnterFullScreen };
}