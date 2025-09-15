import React from "react";

/**
 * A modal popup to warn the user about an exam violation.
 * Displays a countdown timer.
 */
const WarningPopup = ({ isVisible, countdown }) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        color: "white",
        textAlign: "center",
        fontFamily: "sans-serif",
      }}
    >
      <div>
        <h1 style={{ fontSize: "3rem", color: "#ffc107" }}>⚠️ Warning! ⚠️</h1>
        <p style={{ fontSize: "1.5rem", marginTop: "1rem" }}>
          You have left the exam window.
        </p>
        <p style={{ fontSize: "1.2rem", marginTop: "0.5rem" }}>
          Return to the exam immediately. The exam will auto-submit in:
        </p>
        <div
          style={{
            fontSize: "4rem",
            fontWeight: "bold",
            marginTop: "2rem",
            color: "#dc3545",
          }}
        >
          {countdown}
        </div>
      </div>
    </div>
  );
};

export default WarningPopup;
