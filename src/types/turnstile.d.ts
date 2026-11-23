// API global Cloudflare Turnstile yang dipakai di formulir.
export {};
declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: { sitekey: string }) => string;
      remove: (id: string) => void;
      reset: () => void;
    };
  }
}
