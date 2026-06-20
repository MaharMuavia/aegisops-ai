// Light-theme palette helpers for the authenticated SOC app.
// Each helper returns Tailwind classes that sit on the warm-paper background
// defined in globals.css (--paper / --card / --line).

export function severityBadge(severity: string): string {
  switch (severity.toLowerCase()) {
    case "critical": return "text-red-800 bg-red-100 border-red-300";
    case "high":     return "text-orange-800 bg-orange-100 border-orange-300";
    case "medium":   return "text-amber-800 bg-amber-100 border-amber-300";
    case "low":      return "text-emerald-800 bg-emerald-100 border-emerald-300";
    default:         return "text-emerald-800 bg-emerald-100 border-emerald-300";
  }
}

export function statusBadge(status: string): string {
  switch (status.toLowerCase()) {
    case "waiting_approval": return "text-amber-800 bg-amber-100 border-amber-300";
    case "remediating":      return "text-sky-800 bg-sky-100 border-sky-300 animate-pulse";
    case "investigating":    return "text-violet-800 bg-violet-100 border-violet-300";
    case "resolved":         return "text-emerald-800 bg-emerald-100 border-emerald-300";
    case "closed":           return "text-stone-700 bg-stone-100 border-stone-300";
    case "open":             return "text-blue-800 bg-blue-100 border-blue-300";
    default:                 return "text-stone-700 bg-stone-100 border-stone-300";
  }
}

export function auditSeverityBadge(severity: string): string {
  switch (severity.toLowerCase()) {
    case "critical": return "text-red-800 bg-red-100 border-red-300";
    case "error":    return "text-red-800 bg-red-50 border-red-200";
    case "warning":  return "text-amber-800 bg-amber-100 border-amber-300";
    default:         return "text-sky-800 bg-sky-100 border-sky-300";
  }
}

// Standard card surface — used everywhere to keep visual rhythm consistent.
export const CARD = "bg-[var(--card)] border border-[var(--line-strong)] rounded-xl";
export const SUBCARD = "bg-[var(--paper-2)] border border-[var(--line)] rounded-lg";
