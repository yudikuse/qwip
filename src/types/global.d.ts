export {};

declare global {
  interface Window {
    qwipOpenCookieBanner?: () => void;
  }
}
