import React, { useState, useCallback, useEffect } from "react";
import ToastNotification from "./ToastNotification";

let addToastFunction = null;

export const ToastContainer = () => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message, type = "info", duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  useEffect(() => {
    addToastFunction = addToast;

    window.toast = {
      success: (message, duration = 5000) =>
        addToastFunction?.(message, "success", duration),
      error: (message, duration = 5000) =>
        addToastFunction?.(message, "error", duration),
      warning: (message, duration = 5000) =>
        addToastFunction?.(message, "warning", duration),
      info: (message, duration = 5000) =>
        addToastFunction?.(message, "info", duration),
    };

    return () => {
      addToastFunction = null;
      delete window.toast;
    };
  }, [addToast]);

  return (
    <div
      style={{
        position: "fixed",
        top: "80px",
        right: "20px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        maxWidth: "400px",
      }}
    >
      {toasts.map((toastItem) => (
        <ToastNotification
          key={toastItem.id}
          message={toastItem.message}
          type={toastItem.type}
          duration={toastItem.duration}
          onClose={() => removeToast(toastItem.id)}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
