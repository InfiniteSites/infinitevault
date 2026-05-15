import { useEffect, useState } from "react";
import { ShieldCheck, ExternalLink } from "lucide-react";
import { api, LinkRow, ProxyRow } from "@/lib/api";
import { BLOCKERS } from "@/lib/blockers";

const StatusDot = ({ s }: { s: string | null }) => (
  <span title={s ?? "unknown"} className={`inline-block w-2 h-2 rounded-full ${s === "working" ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" : s === "down" ? "bg-rose-500" : "bg-muted-foreground/40"}`} />
);

const Chooser = () => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [proxies, setProxies] = useState<ProxyRow[]>([]);

  useEffect(() => {
    (async () => {
      setLinks(await api.getLinks());
      setProxies(await api.getProxies());
    })();
  }, []);

  const toggle = (b: string) => {
    const n = new Set(selected);
    n.has(b) ? n.delete(b) : n.add(b);
    setSelected(n);
  };

  const matches = (blockers: string[] | null | undefined) => {
    if (selected.size === 0) return false;
    const set = new Set(blockers ?? []);
    for (const s of selected) if (set.has(s)) return true;
    return false;
  };

  const matchedLinks = links.filter((l) => matches(l.blockers));
  const matchedProxies = proxies.filter((p) => matches(p.blockers));
  const total = matchedLinks.length + matchedProxies.length;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-display tracking-[0.3em] text-primary uppercase">
          <ShieldCheck size={12} /> Bypass Picker
        </div>
        <h1 className="font-display text-4xl sm:text-6xl font-black text-gradient-cosmic mb-3 tracking-tight">CHOOSER</h1>
        <p className="text-muted-foreground text-sm">What blocker(s) do you have?</p>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-10">
        {BLOCKERS.map((b) => {
          const on = selected.has(b);
          return (
            <button key={b} onClick={() => toggle(b)}
              className={`px-3 py-2.5 rounded-lg text-xs font-display font-bold uppercase tracking-wider border transition ${
                on ? "bg-gradient-to-r from-primary to-accent text-primary-foreground border-transparent shadow-lg shadow-primary/40"
                   : "bg-secondary/40 border-border/60 text-muted-foreground hover:text-foreground hover:border-primary/40"
              }`}>
              {b}
            </button>
          );
        })}
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-4 text-xs uppercase tracking-widest text-muted-foreground font-display">
          {selected.size === 0 ? "Pick one or more blockers" : `${total} link${total === 1 ? "" : "s"} known to bypass`}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {[...matchedLinks.map((l) => ({ ...l, kind: "link" as const })), ...matchedProxies.map((p) => ({ ...p, kind: "proxy" as const }))].map((l) => (
            <a key={l.kind + l.id} href={l.url} target="_blank" rel="noopener noreferrer"
               className="group flex items-center gap-2 p-3 card-shine border border-border/60 rounded-lg hover:border-primary/50 transition">
              <StatusDot s={l.last_status} />
              <div className="min-w-0 flex-1">
                <div className="font-display text-sm font-semibold truncate">{l.name}</div>
                <div className="text-[10px] text-muted-foreground truncate font-mono">{l.url}</div>
              </div>
              <ExternalLink size={13} className="text-muted-foreground group-hover:text-primary shrink-0" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Chooser;
