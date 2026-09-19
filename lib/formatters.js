const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export function formatDateTime(value) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return dateTimeFormatter.format(date);
}

export function formatDate(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatCurrency(amount, currency = "USD") {
  if (amount === undefined || amount === null || Number.isNaN(Number(amount))) return "";
  const num = Number(amount);
  const isNegative = num < 0;
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Math.abs(num));
  return isNegative ? `-${formatted}` : formatted;
}

export function formatQuantity(quantity) {
  if (quantity === undefined || quantity === null || Number.isNaN(Number(quantity))) return "0";
  const num = Number(quantity);
  if (Number.isInteger(num)) {
    return new Intl.NumberFormat("en-US").format(num);
  }
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}
