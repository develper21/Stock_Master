"use client";

import clsx from "clsx";
import { PASSWORD_REQUIREMENTS } from "@/lib/constants";

const validators = [
  {
    label: PASSWORD_REQUIREMENTS[0],
    check: (value) => value.length >= 8,
  },
  {
    label: PASSWORD_REQUIREMENTS[1],
    check: (value) => /[a-z]/.test(value),
  },
  {
    label: PASSWORD_REQUIREMENTS[2],
    check: (value) => /[A-Z]/.test(value),
  },
  {
    label: PASSWORD_REQUIREMENTS[3],
    check: (value) => /\d/.test(value),
  },
  {
    label: PASSWORD_REQUIREMENTS[4],
    check: (value) => /[@$!%*?&#^_-]/.test(value),
  },
];

export default function PasswordChecklist({ value = "" }) {
  return (
    <ul className="mt-4 space-y-2 text-xs text-slate-300">
      {validators.map((item) => {
        const passed = item.check(value);
        return (
          <li key={item.label} className="flex items-center gap-2">
            <span
              className={clsx(
                "inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold",
                passed ? "bg-emerald-500/80 text-slate-900" : "bg-slate-700 text-slate-300"
              )}
            >
              {passed ? "✓" : "•"}
            </span>
            {item.label}
          </li>
        );
      })}
    </ul>
  );
}
