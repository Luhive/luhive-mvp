declare module '*.lottie';

declare global {
  interface Window {
    // Google Analytics
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;

    // Microsoft Clarity
    clarity: ((...args: unknown[]) => void) & { q?: unknown[] };

    // Tawk.to
    Tawk_API?: {
      minimize?: () => void;
      maximize?: () => void;
      toggle?: () => void;
      popup?: () => void;
      showWidget?: () => void;
      hideWidget?: () => void;
      onLoad?: () => void;
    };
    Tawk_LoadStart?: Date;
  }
}

export {};