import { useState, useEffect, useCallback, useRef } from "react";

/**
 * A comprehensive exam security hook that can be toggled on or off.
 *
 * @param {Function} onFinishExam - Callback to auto-submit the exam.
 * @param {number} maxViolations - The violation number that triggers the final warning.
 * @param {Function} onWarning - Callback to show a popup for any violation.
 * @param {boolean} isSecurityEnabled - Master switch from the backend to enable or disable all security features.
 * @param {boolean} isFinalSubmission - A flag to temporarily disable the hook during the final submission process.
 */
export function useFullScreenExamSecurity(
  onFinishExam,
  maxViolations = 3,
  onWarning,
  isSecurityEnabled,
  isFinalSubmission
) {
  const [violations, setViolations] = useState(-1);
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
    // If security is globally disabled, or the exam hasn't started, or we are in the final submission phase, do nothing.
    if (!isSecurityEnabled || violations === -1 || isFinalSubmission) {
      return;
    }

    // --- DETECTION LOGIC (Fallback) ---
    const handleVisibilityChange = () => {
      if (document.hidden) handleViolation("Switched tabs");
    };
    const handleBlur = () => {
      // Only trigger blur violation if the exam is in fullscreen, otherwise it's too sensitive
      if (document.fullscreenElement) handleViolation("Left exam window");
    };
    const handleFullScreenChange = () => {
      if (!document.fullscreenElement) handleViolation("Exited fullscreen");
    };

    // --- PREVENTION LOGIC ---
    const handleKeyDown = (e) => {
      if ((e.ctrlKey && (e.key === "t" || e.key === "n" || e.key === "w" || e.key === "Tab")) || (e.altKey && e.key === "Tab")) {
        e.preventDefault();
        handleViolation("Tried a restricted keyboard shortcut");
      }
    };
    const handleContextMenu = (e) => e.preventDefault();
    const preventAction = (e) => {
      e.preventDefault();
      alert("This action is disabled during the exam.");
    };

    // Attach all event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", preventAction);
    document.addEventListener("paste", preventAction);
    document.addEventListener("cut", preventAction);

    // Cleanup function to remove all listeners
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", preventAction);
      document.removeEventListener("paste", preventAction);
      document.removeEventListener("cut", preventAction);
    };
  }, [violations, handleViolation, isSecurityEnabled, isFinalSubmission]);

  // Public function to start the exam
  const startExam = async () => {
    // If security is enabled, request fullscreen. Otherwise, just start the exam state.
    if (isSecurityEnabled) {
      try {
        await document.documentElement.requestFullscreen();
        setViolations(0); // Start counting violations
        return true;
      } catch (err) {
        alert("Fullscreen mode is required for this exam. Please allow it and try again.");
        return false;
      }
    } else {
      console.warn("EXAM SECURITY IS DISABLED. Starting exam without fullscreen.");
      setViolations(0); // Set to 0 to indicate the exam has officially started
      return true;
    }
  };

  // Public function to re-enter fullscreen after a warning
  const reEnterFullScreen = async () => {
    // Only try to re-enter if security was enabled in the first place
    if (isSecurityEnabled) {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch (err) {
        console.error("Could not re-enter fullscreen:", err);
        onFinishExam?.(); // If re-entry fails, submit the exam
      }
    }
  };

  return { startExam, violations, reEnterFullScreen };
}