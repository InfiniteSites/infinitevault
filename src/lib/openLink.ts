// Shared link-opening utilities with optional about:blank cloaking & tab cloak.

type CloakOpts = { title?: string; favicon?: string };

const SETTINGS_KEY = "iv_settings_v1";

export type Settings = {
  aboutBlank: boolean;          // open external links inside an about:blank shell
  cloakTitle: string;           // tab title used when cloaking
  cloakFavicon: string;         // favicon URL used when cloaking
};

export const defaultSettings: Settings = {
  aboutBlank: false,
  cloakTitle: "",
  cloakFavicon: "",
};

export function getSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...defaultSettings };
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch { return { ...defaultSettings }; }
}

export function saveSettings(s: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  window.dispatchEvent(new Event("iv-settings"));
}

/** Apply tab cloak (title + favicon) to the current document. */
export function applyTabCloak(opts: CloakOpts) {
  if (opts.title) document.title = opts.title;
  if (opts.favicon) {
    let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = opts.favicon;
  }
}

/** Open url inside a fresh about:blank tab that iframes the destination. */
export function openInAboutBlank(url: string, cloak?: CloakOpts) {
  const w = window.open("about:blank", "_blank");
  if (!w) { window.open(url, "_blank"); return; }
  const title = cloak?.title || "New Tab";
  const favicon = cloak?.favicon || "";
  w.document.write(`<!doctype html><html><head><title>${title.replace(/</g, "&lt;")}</title>${
    favicon ? `<link rel="icon" href="${favicon}">` : ""
  }<style>html,body,iframe{margin:0;padding:0;border:0;width:100%;height:100%;}body{background:#000;}</style></head><body><iframe src="${url}" allow="fullscreen *; clipboard-write *" allowfullscreen></iframe></body></html>`);
  w.document.close();
}

/** Smart open that respects user settings. Use this everywhere a link opens. */
export function openLink(url: string) {
  const s = getSettings();
  if (s.aboutBlank) openInAboutBlank(url, { title: s.cloakTitle, favicon: s.cloakFavicon });
  else window.open(url, "_blank", "noopener,noreferrer");
}
