import { useEffect, useState } from "react";
import { Plus, Trash2, ExternalLink, Globe } from "lucide-react";
import { isAdmin } from "@/lib/admin";
import { api, ProxyRow } from "@/lib/api";
import { BLOCKERS } from "@/lib/blockers";

const StatusDot = ({ s }: { s: string | null }) => (
  <span title={s ?? "unknown"} className={`inline-block w-2 h-2 rounded-full ${s === "working" ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" : s === "down" ? "bg-rose-500" : "bg-muted-foreground/40"}`} />
);

const BlockerPicker = ({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) => {
  const toggle = (b: string) => onChange(value.includes(b) ? value.filter((x) => x !== b) : [...value, b]);
  return (
    <div className="flex flex-wrap gap-1">
      {BLOCKERS.map((b) => {
        const on = value.includes(b);
        return (
          <button key={b} type="button" onClick={() => toggle(b)}
            className={`px-2 py-1 rounded text-[10px] font-display font-bold uppercase border ${on ? "bg-primary text-primary-foreground border-transparent" : "bg-secondary/60 border-border/60 text-muted-foreground hover:text-foreground"}`}>{b}</button>
        );
      })}
    </div>
  );
};

const Proxies = () => {
  const [admin, setAdminState] = useState(isAdmin());
  const [links, setLinks] = useState<ProxyRow[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState<{ name: string; url: string; blockers: string[] }>({ name: "", url: "", blockers: [] });
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  const load = async () => setLinks(await api.getProxies());
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const h = () => setAdminState(isAdmin());
    window.addEventListener("admin-changed", h);
    return () => window.removeEventListener("admin-changed", h);
  }, []);

  const add = async () => {
    if (!form.name.trim() || !form.url.trim()) return;
    await api.addProxy(form.name.trim(), form.url.trim(), form.blockers);
    setForm({ name: "", url: "", blockers: [] }); setAdding(false); load();
  };
  const remove = async (id: string) => { await api.deleteProxy(id); load(); };
  const open = (l: ProxyRow) => { api.bumpLink("proxies", l.id).catch(() => {}); window.open(l.url, "_blank", "noopener"); };
  const saveBlockers = async (id: string, blockers: string[]) => { await api.updateProxyBlockers(id, blockers); setEditing(null); load(); };

  const filtered = links.filter((l) => l.name.toLowerCase().includes(q.toLowerCase()) || l.url.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-xs font-display tracking-widest text-accent">
          <Globe size={12} /> COLLECTION
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-black text-gradient-gold mb-2">More Proxies</h1>
        <p className="text-muted-foreground text-sm">Hundreds of proxies, all in one place.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6 max-w-3xl mx-auto">
        <input placeholder="Search proxies..." value={q} onChange={(e) => setQ(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-secondary/60 border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
        {admin && (
          <button onClick={() => setAdding(!adding)} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-display font-semibold hover:opacity-90">
            <Plus size={14} /> Add Proxy
          </button>
        )}
      </div>

      {admin && adding && (
        <div className="max-w-3xl mx-auto mb-6 p-4 bg-secondary/40 border border-border/60 rounded-xl space-y-2">
          <div className="flex flex-col sm:flex-row gap-2">
            <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            <input placeholder="https://..." value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="flex-[2] px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            <button onClick={add} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-display font-semibold">Save</button>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Bypasses</div>
            <BlockerPicker value={form.blockers} onChange={(v) => setForm({ ...form, blockers: v })} />
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto grid gap-2 sm:grid-cols-2">
        {filtered.length === 0 ? (
          <p className="col-span-full text-center text-muted-foreground italic py-12">{links.length === 0 ? "No proxies yet." : "No matches."}</p>
        ) : filtered.map((l) => (
          <div key={l.id} className="group flex flex-col gap-1 p-3 card-shine border border-border/60 rounded-lg hover:border-primary/50 transition-all">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1 flex items-center gap-2">
                <StatusDot s={l.last_status} />
                <div className="min-w-0">
                  <div className="font-display text-sm font-semibold truncate">{l.name}</div>
                  <div className="text-[10px] text-muted-foreground truncate font-mono">{l.url}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => open(l)} className="p-1.5 rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary transition" title="Open">
                  <ExternalLink size={13} />
                </button>
                {admin && (
                  <>
                    <button onClick={() => setEditing(editing === l.id ? null : l.id)} className="px-1.5 py-0.5 rounded text-[9px] font-display font-bold bg-secondary text-muted-foreground hover:text-foreground">TAGS</button>
                    <button onClick={() => remove(l.id)} className="p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition opacity-0 group-hover:opacity-100">
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </div>
            </div>
            {admin && editing === l.id && (
              <div className="mt-2 pt-2 border-t border-border/40">
                <BlockerPicker value={l.blockers ?? []} onChange={(v) => saveBlockers(l.id, v)} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Proxies;
