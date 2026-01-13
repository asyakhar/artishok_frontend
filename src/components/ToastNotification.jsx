import React, { useState, useEffect } from "react";
import "./ToastNotification.css";

const ToastNotification = ({
  message,
  type = "info",
  duration = 5000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  if (!isVisible) return null;

  const icons = {
    success: "✅",
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  };

  const typeStyles = {
    success: {
      background: "linear-gradient(135deg, #d4edda, #c3e6cb)",
      border: "2px solid #28a745",
      color: "#155724",
    },
    error: {
      background: "linear-gradient(135deg, #f8d7da, #f5c6cb)",
      border: "2px solid #dc3545",
      color: "#721c24",
    },
    warning: {
      background: "linear-gradient(135deg, #fff3cd, #ffeaa7)",
      border: "2px solid #ffc107",
      color: "#856404",
    },
    info: {
      background: "linear-gradient(135deg, #d1ecf1, #bee5eb)",
      border: "2px solid #17a2b8",
      color: "#0c5460",
    },
  };

  return (
    <div
      className={`toast-notification ${isExiting ? "toast-exit" : ""}`}
      style={typeStyles[type]}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "20px" }}>{icons[type]}</span>
          <span style={{ fontSize: "14px", fontWeight: "500" }}>{message}</span>
        </div>
        <button
          onClick={handleClose}
          style={{
            background: "none",
            border: "none",
            fontSize: "20px",
            cursor: "pointer",
            color: "inherit",
            opacity: 0.7,
            padding: "0",
            width: "24px",
            height: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "4px",
          }}
          onMouseOver={(e) => (e.target.style.opacity = 1)}
          onMouseOut={(e) => (e.target.style.opacity = 0.7)}
        >
          ×
        </button>
      </div>
      <div
        className="toast-progress-bar"
        style={{
          backgroundColor:
            type === "success"
              ? "#28a745"
              : type === "error"
              ? "#dc3545"
              : type === "warning"
              ? "#ffc107"
              : "#17a2b8",
        }}
      />
    </div>
  );
};

export default ToastNotification;
