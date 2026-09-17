"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const ToastContext = createContext(null);

let toastCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const pushToast = useCallback(
    ({ title, description, variant = "default", duration = 3200 }) => {
      const id = ++toastCounter;
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      const timer = setTimeout(() => removeToast(id), duration);
      timers.current.set(id, timer);
    },
    [removeToast]
  );

  const value = useMemo(() => ({ pushToast, removeToast }), [pushToast, removeToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-6 top-6 z-[100] flex max-w-sm flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto overflow-hidden rounded-2xl border border-white/10 bg-slate-900/90 px-4 py-3 shadow-lg backdrop-blur transition hover:border-white/20 ${
              toast.variant === "success"
                ? "border-emerald-400/40"
                : toast.variant === "error"
                ? "border-rose-400/40"
                : "border-white/10"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                {toast.title && <p className="text-sm font-semibold text-white">{toast.title}</p>}
                {toast.description && <p className="text-xs text-slate-300">{toast.description}</p>}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-xs text-slate-400 hover:text-slate-200"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
