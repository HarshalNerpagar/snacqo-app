const SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
      on: (event: string, handler: (response: unknown) => void) => void;
    };
  }
}

let scriptLoaded: Promise<void> | null = null;

export function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Razorpay runs only in browser'));
  if (window.Razorpay) return Promise.resolve();
  if (scriptLoaded) return scriptLoaded;
  scriptLoaded = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => {
      if (window.Razorpay) {
        resolve();
      } else {
        scriptLoaded = null;
        script.remove();
        reject(new Error('Payment system failed to initialize. Please refresh and try again.'));
      }
    };
    script.onerror = () => {
      scriptLoaded = null;
      script.remove();
      reject(new Error('Failed to load payment system. Please check your internet connection and try again.'));
    };
    document.head.appendChild(script);
  });
  return scriptLoaded;
}
