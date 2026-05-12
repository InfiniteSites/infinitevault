import { useEffect, useState } from "react";
import { Plus, Trash2, ExternalLink, Globe } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { isAdmin, buildProxyUrl } from "@/lib/admin";

interface ProxyLink {
  name: string;
  url: string;
}

const Proxies = () => {
  const [links, setLinks] = useLocalStorage<ProxyLink[]>("iv_proxies", []);
  const [admin, setAdminState] = useState(isAdmin());
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", url: "" });
  const [q, setQ] = useState("");

  useEffect(() => {
    const h = () => setAdminState(isAdmin());
    window.addEventListener("admin-changed", h);
    return () => window.removeEventListener("admin-changed", h);
  }, []);

  const add = () => {
    if (!form.name.trim() || !form.url.trim()) return;
    setLinks((l) => [{ ...form }, ...l]);
    setForm({ name: "", url: "" });
    setAdding(false);
  };

  const filtered = links.filter(
    (l) => l.name.toLowerCase().includes(q.toLowerCase()) || l.url.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-xs font-display tracking-widest text-accent">
          <Globe size={12} /> COLLECTION
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-black text-gradient-gold mb-2">More Proxies</h1>
        <p className="text-muted-foreground text-sm">A growing list of working proxies.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6 max-w-3xl mx-auto">
        <input
          placeholder="Search proxies..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-secondary/60 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        {admin && (
          <button
            onClick={() => setAdding(!adding)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-display font-semibold hover:opacity-90"
          >
            <Plus size={14} /> Add Proxy
          </button>
        )}
      </div>

      {admin && adding && (
        <div className="max-w-3xl mx-auto mb-6 p-4 bg-secondary/40 border border-border/60 rounded-xl flex flex-col sm:flex-row gap-2">
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <input
            placeholder="https://..."
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            className="flex-[2] px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button onClick={add} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-display font-semibold">
            Save
          </button>
        </div>
      )}

      <div className="max-w-4xl mx-auto grid gap-2 sm:grid-cols-2">
        {filtered.length === 0 ? (
          <p className="col-span-full text-center text-muted-foreground italic py-12">
            {links.length === 0 ? "No proxies yet." : "No matches."}
          </p>
        ) : (
          filtered.map((l, i) => (
            <div
              key={i}
              className="group flex items-center justify-between gap-2 p-3 card-shine border border-border/60 rounded-lg hover:border-primary/50 hover:vault-glow transition-all"
            >
              <div className="min-w-0 flex-1">
                <div className="font-display text-sm font-semibold truncate">{l.name}</div>
                <div className="text-[10px] text-muted-foreground truncate font-mono">{l.url}</div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => window.open(l.url, "_blank", "noopener")}
                  className="p-1.5 rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary transition"
                  title="Open"
                >
                  <ExternalLink size={13} />
                </button>
                <button
                  onClick={() => window.open(buildProxyUrl(l.url), "_blank", "noopener")}
                  className="px-2 py-1.5 rounded-md text-[10px] font-display font-bold bg-accent/20 text-accent hover:bg-accent/30 transition"
                  title="Open through proxy"
                >
                  PROXY
                </button>
                {admin && (
                  <button
                    onClick={() => setLinks((arr) => arr.filter((_, j) => j !== links.indexOf(l)))}
                    className="p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Proxies;
