import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function dash(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '-';
  if (value == null) return '-';
  const text = String(value).trim();
  return text || '-';
}

export function formatINR(val) {
  if (typeof val === 'number' && Number.isFinite(val)) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  }
  return dash(val);
}

