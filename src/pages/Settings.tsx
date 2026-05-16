import { useEffect, useState } from "react";
import { Settings as SettingsIcon, ExternalLink, Eye, Save } from "lucide-react";
import { getSettings, saveSettings, openInAboutBlank, applyTabCloak } from "@/lib/openLink";

const Settings = () => {
  const [s, setS] = useState(getSettings());

  const update = (patch: Partial<typeof s>) => setS({ ...s, ...patch });
  const save = () => { saveSettings(s); if (s.cloakTitle || s.cloakFavicon) applyTabCloak({ title: s.cloakTitle, favicon: s.cloakFavicon }); };

  const launchHere = () => openInAboutBlank(window.location.origin, { title: s.cloakTitle, favicon: s.cloakFavicon });

  // Live-apply cloak preview
  useEffect(() => {
    const cur = getSettings();
    if (cur.cloakTitle || cur.cloakFavicon) applyTabCloak({ title: cur.cloakTitle, favicon: cur.cloakFavicon });
  }, []);

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-display tracking-[0.3em] text-primary uppercase">
          <SettingsIcon size={12} /> Preferences
        </div>
        <h1 className="font-display text-4xl sm:text-6xl font-black text-gradient-cosmic mb-3 tracking-tight">SETTINGS</h1>
      </div>

      <div className="space-y-4">
        <div className="card-shine border border-border/60 rounded-2xl p-5">
          <h3 className="font-display font-black uppercase tracking-wider mb-2 text-sm flex items-center gap-2"><Eye size={14} className="text-accent" /> Open this site in about:blank</h3>
          <p className="text-xs text-muted-foreground mb-3">Launch the site inside a blank tab using the cloak below. Helpful when school history watchers peek at tabs.</p>
          <button onClick={launchHere} className="px-4 py-2 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg text-sm font-display font-bold uppercase tracking-wider">Launch in about:blank</button>
        </div>

        <div className="card-shine border border-border/60 rounded-2xl p-5">
          <h3 className="font-display font-black uppercase tracking-wider mb-2 text-sm flex items-center gap-2"><ExternalLink size={14} className="text-primary" /> Auto-open links in about:blank</h3>
          <p className="text-xs text-muted-foreground mb-3">Every link you click from this site opens in a cloaked about:blank tab.</p>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={s.aboutBlank} onChange={(e) => update({ aboutBlank: e.target.checked })} className="w-4 h-4 accent-primary" />
            <span className="text-sm">Enabled</span>
          </label>
        </div>

        <div className="card-shine border border-border/60 rounded-2xl p-5 space-y-3">
          <h3 className="font-display font-black uppercase tracking-wider mb-1 text-sm">Tab Cloak</h3>
          <p className="text-xs text-muted-foreground">Used for this tab and any about:blank tabs opened from this site.</p>
          <div>
            <label className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">Tab title</label>
            <input value={s.cloakTitle} onChange={(e) => update({ cloakTitle: e.target.value })} placeholder="Google Classroom"
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">Favicon URL</label>
            <input value={s.cloakFavicon} onChange={(e) => update({ cloakFavicon: e.target.value })} placeholder="https://classroom.google.com/favicon.ico"
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {[
              { t: "Google Classroom", f: "https://ssl.gstatic.com/classroom/favicon.png" },
              { t: "Google Docs", f: "https://ssl.gstatic.com/docs/documents/images/kix-favicon7.ico" },
              { t: "Khan Academy", f: "https://cdn.kastatic.org/images/favicon.ico" },
              { t: "New Tab", f: "" },
            ].map((p) => (
              <button key={p.t} onClick={() => update({ cloakTitle: p.t, cloakFavicon: p.f })}
                className="px-2 py-1.5 bg-secondary/60 border border-border/60 rounded text-[11px] font-display font-bold uppercase hover:border-primary/40">{p.t}</button>
            ))}
          </div>
        </div>

        <button onClick={save} className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg font-display font-black uppercase tracking-wider"><Save size={14} /> Save</button>
      </div>
    </div>
  );
};

export default Settings;
