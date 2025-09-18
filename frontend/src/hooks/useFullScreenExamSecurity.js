import { useState, useEffect, useCallback, useRef } from "react";

/**
 * An enhanced, robust exam security hook with granular controls.
 */
export function useFullScreenExamSecurity(
  onFinishExam,
  maxViolations = 3,
  onWarning,
  securityConfig, // Changed from isSecurityEnabled to an object
  isFinalSubmission
) {
  const [violations, setViolations] = useState(-1);
  const isHandlingViolation = useRef(false);
  const devToolsCheckInterval = useRef(null);

  // Destructure config with default values to prevent errors if it's null
  const {
    copy = false,
    paste = false,
    select = false,
    cut = false,
    fullscreen = false,
    tabswitchwarning = false,
  } = securityConfig || {};

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
    // Only run security checks if the exam has started and is not submitted
    if (violations === -1 || isFinalSubmission) {
      if (devToolsCheckInterval.current) {
        clearInterval(devToolsCheckInterval.current);
      }
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) handleViolation("switched tabs");
    };

    // --- THIS IS THE FIX ---
    // The `blur` event signifies the window has lost focus.
    // The `document.hasFocus()` check was preventing this from ever firing correctly.
    const handleBlur = () => {
      // We only trigger a violation if the exam is supposed to be in fullscreen.
      // This prevents false positives if the user interacts with browser UI that isn't a tab switch (rare, but possible).
      if (document.fullscreenElement) {
        // A short timeout helps differentiate between a real focus loss
        // and a temporary one (like clicking a browser alert).
        setTimeout(() => {
            if (!document.hasFocus()) {
                handleViolation("switched window or application");
            }
        }, 100);
      }
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

    // --- CONDITIONAL EVENT LISTENERS ---
    if (tabswitchwarning) {
        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);
        document.addEventListener("keydown", handleKeyDown); // Shortcuts are part of tab switching prevention
        devToolsCheckInterval.current = setInterval(checkDevTools, 1000);
    }
    if (fullscreen) {
        document.addEventListener("fullscreenchange", handleFullScreenChange);
    }
    if (select) {
        document.addEventListener("selectstart", preventDefault);
    }
    if (copy) {
        document.addEventListener("copy", preventClipboardAction);
    }
    if (paste) {
        document.addEventListener("paste", preventClipboardAction);
    }
    if (cut) {
        document.addEventListener("cut", preventClipboardAction);
    }
    // Context menu and dragstart are general purpose, let's keep them with tab switching
    if (tabswitchwarning || fullscreen) {
        document.addEventListener("contextmenu", preventDefault);
        document.addEventListener("dragstart", preventDefault);
    }


    return () => {
      // --- ALWAYS REMOVE ALL LISTENERS on cleanup ---
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
  }, [violations, handleViolation, securityConfig, isFinalSubmission]);

  const startExam = () => {
    setViolations(0); // Activate the security listeners
  };

  const reEnterFullScreen = async () => {
    if (fullscreen && !document.fullscreenElement) {
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
