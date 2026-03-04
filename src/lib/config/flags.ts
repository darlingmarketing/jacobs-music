export const FLAGS = {
  // Must be false unless explicitly enabled.
  enableEssentiaEngine:
    (import.meta as any).env?.VITE_ENABLE_ESSENTIA_ENGINE === "true" ||
    (typeof process !== "undefined" && (process as any).env?.NEXT_PUBLIC_ENABLE_ESSENTIA_ENGINE === "true"),
} as const;
