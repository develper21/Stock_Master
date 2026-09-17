"use client";

import { useState, useEffect } from "react";
import clsx from "clsx";

export default function LineItemsEditor({
  products = [],
  value = [],
  onChange,
  fields = [
    { key: "quantity", label: "Quantity", type: "number", min: 0 },
    { key: "unit_price", label: "Unit Price", type: "number", min: 0 },
  ],
  emptyItem,
}) {
  const makeBlankItem = () => ({
    product_id: products[0]?.id || "",
    ...fields.reduce((acc, field) => {
      if (field.key === "quantity") return { ...acc, [field.key]: 1 };
      return {
        ...acc,
        [field.key]: field.type === "number" ? 0 : "",
      };
    }, {}),
    ...(emptyItem || {}),
  });

  const [internalValue, setInternalValue] = useState(() => (value.length > 0 ? value : [makeBlankItem()]));

  useEffect(() => {
    if (value && value.length) {
      setInternalValue(value);
    }
  }, [value]);

  function sync(next) {
    setInternalValue(next);
    onChange?.(next);
  }

  function handleProductChange(index, productId) {
    const next = internalValue.map((item, i) => (i === index ? { ...item, product_id: productId } : item));
    sync(next);
  }

  function handleFieldChange(index, key, value) {
    const next = internalValue.map((item, i) => (i === index ? { ...item, [key]: value } : item));
    sync(next);
  }

  function addRow() {
    sync([...internalValue, makeBlankItem()]);
  }

  function removeRow(index) {
    const next = internalValue.filter((_, i) => i !== index);
    sync(next.length > 0 ? next : [makeBlankItem()]);
  }

  return (
    <div className="space-y-4">
      {internalValue.map((item, index) => (
        <div key={index} className="rounded-2xl border border-white/10 bg-slate-900/40 p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white">Line {index + 1}</p>
            {internalValue.length > 1 && (
              <button
                type="button"
                className="text-xs text-rose-300 hover:text-rose-200"
                onClick={() => removeRow(index)}
              >
                Remove
              </button>
            )}
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Product</label>
              <select
                className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white"
                value={item.product_id}
                onChange={(e) => handleProductChange(index, e.target.value)}
              >
                {products.map((product) => (
                  <option key={product.id} value={product.id} className="bg-slate-900">
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>
            {fields.map((field) => (
              <div key={field.key} className="space-y-1">
                <label className="text-xs uppercase tracking-[0.3em] text-slate-500">{field.label}</label>
                {field.type === "select" ? (
                  <select
                    className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white"
                    value={item[field.key] || ""}
                    onChange={(e) => handleFieldChange(index, field.key, e.target.value)}
                  >
                    <option value="">Select</option>
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value} className="bg-slate-900">
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    min={field.min}
                    step={field.step || (field.type === "number" ? "0.01" : undefined)}
                    className={clsx(
                      "w-full rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-2 text-sm text-white",
                      field.type === "number" && "text-right"
                    )}
                    value={item[field.key] ?? ""}
                    onChange={(e) => handleFieldChange(index, field.key, e.target.value)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addRow}
        className="w-full rounded-2xl border border-dashed border-white/15 py-3 text-sm font-semibold text-slate-300 hover:border-white/30"
      >
        + Add Item
      </button>
    </div>
  );
}
