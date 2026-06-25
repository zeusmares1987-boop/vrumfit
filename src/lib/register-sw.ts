// Registro guardado do Service Worker — só roda no app publicado.
export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;

  const isDev = !import.meta.env.PROD;
  const inIframe = window.self !== window.top;
  const host = window.location.hostname;
  const isPreview =
    host.startsWith("id-preview--") ||
    host.startsWith("preview--") ||
    host.includes("project-dev") ||
    host.includes("project-preview");
  const killed = new URL(window.location.href).searchParams.get("sw") === "off";

  if (isDev || inIframe || isPreview || killed) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((r) => {
        if (r.active?.scriptURL.endsWith("/sw.js")) r.unregister();
      });
    });
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
