"use client";

export function Card({ className = "", children }) {
  return (
    <div className={`rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-lg ${className}`}>
      {children}
    </div>
  );
}
