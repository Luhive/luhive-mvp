import { useEffect } from 'react';

/**
 * Custom hook to initialize Google Analytics
 */
export function useGoogleAnalytics(measurementId: string) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Prevent duplicate initialization
    if (
      document.querySelector(
        `script[src*="googletagmanager.com/gtag/js?id=${measurementId}"]`
      )
    ) {
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.setAttribute('data-cfasync', 'false');
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', measurementId);

    return () => {
      script.remove();
    };
  }, [measurementId]);
}

/**
 * Custom hook to initialize Microsoft Clarity
 */
export function useMicrosoftClarity(projectId: string) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Prevent duplicate initialization - check if script already exists
    if (document.querySelector(`script[src*="clarity.ms/tag/${projectId}"]`)) {
      return;
    }

    window.clarity = Object.assign(
      function (...args: unknown[]) {
        (window.clarity.q = window.clarity.q || []).push(args);
      },
      { q: [] as unknown[] }
    );

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${projectId}`;
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [projectId]);
}

/**
 * Custom hook to initialize Tawk.to chat widget
 */
export function useTawkTo(propertyId: string, widgetId: string) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Prevent duplicate initialization
    if (window.Tawk_API && Object.keys(window.Tawk_API).length > 0) return;

    window.Tawk_API = {};
    window.Tawk_LoadStart = new Date();
    window.Tawk_API.onLoad = () => {
      window.Tawk_API?.minimize?.();
    };

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [propertyId, widgetId]);
}

