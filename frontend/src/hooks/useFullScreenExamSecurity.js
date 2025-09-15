import { useState, useEffect, useCallback, useRef } from "react";

/**
 * An enhanced, robust exam security hook.
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
  const devToolsCheckInterval = useRef(null);

  const handleViolation = useCallback(
    (reason) => {
      if (isHandlingViolation.current) return;
      isHandlingViolation.current = true;
      const newCount = violations + 1;
      setViolations(newCount);

      if (newCount <= maxViolations) {
        let message =
          newCount === maxViolations
            ? `FINAL WARNING: You have attempted to leave the exam (${reason}). One more violation will result in automatic submission.`
            : `Warning: You attempted to leave the exam window (${reason}). This is violation ${newCount} of ${maxViolations}.`;
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
    if (!isSecurityEnabled || violations === -1 || isFinalSubmission) {
      if (devToolsCheckInterval.current) {
        clearInterval(devToolsCheckInterval.current);
      }
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) handleViolation("switched tabs");
    };
    const handleBlur = () => {
      if (document.fullscreenElement) handleViolation("switched window");
    };
    const handleFullScreenChange = () => {
      if (!document.fullscreenElement) handleViolation("exited fullscreen");
    };
    const preventDefault = (e) => e.preventDefault();
    const preventClipboardAction = (e) => {
      e.preventDefault();
      alert(`The "${e.type}" action is disabled during the exam.`);
    };
    const handleKeyDown = (e) => {
      if (
        e.ctrlKey &&
        ["t", "n", "w", "p", "s", "o", "u"].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        handleViolation("used a restricted shortcut");
      }
      if ((e.ctrlKey || e.altKey) && e.key === "Tab") {
        e.preventDefault();
        handleViolation("tried to switch tabs/windows");
      }
      if (
        e.key === "F12" ||
        (e.ctrlKey &&
          e.shiftKey &&
          ["i", "j", "c"].includes(e.key.toLowerCase()))
      ) {
        e.preventDefault();
        handleViolation("tried to open developer tools");
      }
    };
    const threshold = 160;
    const checkDevTools = () => {
      if (
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold
      ) {
        if (!isHandlingViolation.current) {
          handleViolation("developer tools opened");
        }
      }
    };
    devToolsCheckInterval.current = setInterval(checkDevTools, 1000);

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullScreenChange);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", preventDefault);
    document.addEventListener("dragstart", preventDefault);
    document.addEventListener("selectstart", preventDefault);
    document.addEventListener("copy", preventClipboardAction);
    document.addEventListener("paste", preventClipboardAction);
    document.addEventListener("cut", preventClipboardAction);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullScreenChange);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", preventDefault);
      document.removeEventListener("dragstart", preventDefault);
      document.removeEventListener("selectstart", preventDefault);
      document.removeEventListener("copy", preventClipboardAction);
      document.removeEventListener("paste", preventClipboardAction);
      document.removeEventListener("cut", preventClipboardAction);
      if (devToolsCheckInterval.current) {
        clearInterval(devToolsCheckInterval.current);
      }
    };
  }, [violations, handleViolation, isSecurityEnabled, isFinalSubmission]);

  // --- THIS IS THE FIX ---
  // The hook is now only responsible for setting the state to "active".
  // The component is responsible for the fullscreen action itself.
  const startExam = () => {
    setViolations(0); // Activate the security listeners
  };

  const reEnterFullScreen = async () => {
    if (isSecurityEnabled && !document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen();
      } catch (err) {
        console.error("Could not re-enter fullscreen:", err);
        onFinishExam?.();
      }
    }
  };

  return { startExam, violations, reEnterFullScreen };
}
