export const ADMIN_PASSWORD = "brown321";
export const ADMIN_KEY = "iv_admin_unlocked";

export function isAdmin(): boolean {
  return localStorage.getItem(ADMIN_KEY) === "1";
}
export function setAdmin(v: boolean) {
  if (v) localStorage.setItem(ADMIN_KEY, "1");
  else localStorage.removeItem(ADMIN_KEY);
  window.dispatchEvent(new Event("admin-changed"));
}

export function buildProxyUrl(url: string): string {
  // Use CroxyProxy - a public web proxy that renders sites in-browser
  return `https://www.croxyproxy.com/_public/servlet/direct?url=${encodeURIComponent(url)}`;
}
