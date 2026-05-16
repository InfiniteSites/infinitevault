import { useEffect, useState } from "react";
import { Shuffle, ExternalLink, Sparkles, Plus, Trash2, Wand2, Copy } from "lucide-react";
import { isAdmin } from "@/lib/admin";
import { api, applyWildcard, Wildcard } from "@/lib/api";

interface PoolPick { name: string; url: string; source: string; type: string; status?: "working" | "down" | "checking" }

const Generator = () => {
  const [admin, setAdminState] = useState(isAdmin());
  const [pool, setPool] = useState<PoolPick[]>([]);
  const [pick, setPick] = useState<PoolPick | null>(null);
  const [spinning, setSpinning] = useState(false);

  const [wildcards, setWildcards] = useState<Wildcard[]>([]);
  const [newPattern, setNewPattern] = useState("");
  const [count, setCount] = useState(10);
  const [generated, setGenerated] = useState<string[]>([]);

  useEffect(() => {
    const h = () => setAdminState(isAdmin());
    window.addEventListener("admin-changed", h);
    return () => window.removeEventListener("admin-changed", h);
  }, []);

  const loadPool = async () => {
    // Fast first paint: get the small tables
    const [cats, links, prox, dumps, wcs] = await Promise.all([
      api.getCategories(), api.getLinks(), api.getProxies(), api.getDumps(), api.getWildcards(),
    ]);
    const catMap = new Map(cats.map((c) => [c.id, c.name]));
    const dumpMap = new Map(dumps.map((d) => [d.id, d.title]));
    const initial: PoolPick[] = [];
    links.forEach((l) => initial.push({ name: l.name, url: l.url, source: catMap.get(l.category_id ?? "") ?? "Misc", type: "category" }));
    prox.forEach((l) => initial.push({ name: l.name, url: l.url, source: "More Proxies", type: "proxy" }));
    setPool(initial);
    setWildcards(wcs);
    // Slow: dump links in background, then merge
    api.getDumpLinks().then((dumpLinks) => {
      const more: PoolPick[] = dumpLinks.map((l) => ({ name: l.url, url: l.url, source: dumpMap.get(l.dump_id) ?? "Dump", type: "dump" }));
      setPool((cur) => [...cur, ...more]);
    });
  };
  useEffect(() => { loadPool(); }, []);

  const roll = () => {
    if (pool.length === 0) { setPick(null); return; }
    setSpinning(true);
    let ticks = 0;
    const id = setInterval(() => {
      setPick(pool[Math.floor(Math.random() * pool.length)]);
      if (++ticks > 18) {
        clearInterval(id);
        const final = { ...pool[Math.floor(Math.random() * pool.length)], status: "checking" as const };
        setPick(final);
        setSpinning(false);
        api.checkOne(final.url).then((status) => {
          setPick((p) => (p && p.url === final.url ? { ...p, status } : p));
        });
      }
    }, 60);
  };

  const generateNew = () => {
    if (wildcards.length === 0) return;
    const n = Math.max(1, Math.min(20000, count));
    const out: string[] = [];
    for (let i = 0; i < n; i++) {
      const w = wildcards[Math.floor(Math.random() * wildcards.length)];
      out.push(applyWildcard(w.pattern));
    }
    setGenerated(out);
  };

  const addWildcard = async () => {
    if (!newPattern.trim()) return;
    await api.addWildcard(newPattern.trim());
    setNewPattern(""); loadPool();
  };
  const delWildcard = async (id: string) => { await api.deleteWildcard(id); loadPool(); };

  const copyAll = () => {
    navigator.clipboard.writeText(generated.join("\n"));
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-xs font-display tracking-[0.3em] text-accent uppercase">
          <Sparkles size={12} /> Random
        </div>
        <h1 className="font-display text-4xl sm:text-6xl font-black text-gradient-cosmic mb-3 tracking-tight">GENERATOR</h1>
        <p className="text-muted-foreground text-sm">Roll a random link, or generate fresh subdomains from wildcards.</p>
      </div>

      <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-4 mb-10">
        {/* Roll random */}
        <div className="card-shine border border-border/60 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Shuffle size={16} className="text-primary" />
            <h3 className="font-display font-black text-sm uppercase tracking-wider">Random Pool</h3>
          </div>
          <button onClick={roll} disabled={spinning}
            className="py-4 rounded-xl bg-gradient-to-r from-primary via-tertiary to-accent text-primary-foreground font-display font-black uppercase tracking-wider shadow-xl shadow-primary/40 hover:scale-[1.02] transition disabled:opacity-80">
            <span className="flex items-center justify-center gap-2">
              <Shuffle size={18} className={spinning ? "animate-spin" : ""} />
              {spinning ? "Rolling..." : "Generate"}
            </span>
          </button>
          <p className="text-center text-[10px] text-muted-foreground mt-2 uppercase tracking-widest">Pool: {pool.length}</p>

          <div className="mt-4 flex-1">
            {pick ? (
              <div className={`border border-primary/40 rounded-xl p-4 ${spinning ? "animate-pulse" : ""}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-display font-bold uppercase tracking-widest bg-accent/20 text-accent">{pick.type}</span>
                  <span className="text-xs text-muted-foreground truncate flex-1">{pick.source}</span>
                  {pick.status === "checking" && <span className="text-[10px] text-muted-foreground">checking...</span>}
                  {pick.status === "working" && <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-display font-bold uppercase"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Working</span>}
                  {pick.status === "down" && <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-display font-bold uppercase"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Down</span>}
                </div>
                <div className="font-display text-lg font-bold text-gradient-cosmic mb-1 break-words">{pick.name}</div>
                <div className="text-[10px] text-muted-foreground font-mono break-all mb-3">{pick.url}</div>
                <button onClick={() => window.open(pick.url, "_blank", "noopener")} className="w-full flex items-center justify-center gap-1 py-2 bg-primary text-primary-foreground rounded text-xs font-display font-bold uppercase">
                  <ExternalLink size={12} /> Open
                </button>
              </div>
            ) : (
              <p className="text-center text-xs text-muted-foreground italic py-8">Click Generate to roll.</p>
            )}
          </div>
        </div>

        {/* New link from wildcards */}
        <div className="card-shine border border-border/60 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Wand2 size={16} className="text-accent" />
            <h3 className="font-display font-black text-sm uppercase tracking-wider">Wildcard Forge</h3>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Count</label>
            <input type="number" min={1} max={20000} value={count} onChange={(e) => setCount(Math.max(1, Math.min(20000, +e.target.value || 1)))}
              className="w-24 px-2 py-1 bg-background border border-border rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <button onClick={generateNew} disabled={wildcards.length === 0}
            className="py-4 rounded-xl bg-gradient-to-r from-accent via-primary to-tertiary text-primary-foreground font-display font-black uppercase tracking-wider shadow-xl shadow-accent/40 hover:scale-[1.02] transition disabled:opacity-50">
            <span className="flex items-center justify-center gap-2">
              <Wand2 size={18} /> Generate New Link
            </span>
          </button>
          {wildcards.length === 0 && (
            <p className="text-center text-[10px] text-muted-foreground mt-2">Admin: add a wildcard pattern below.</p>
          )}

          {generated.length > 0 && (
            <div className="mt-4 flex-1 min-h-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{generated.length} generated</span>
                <button onClick={copyAll} className="flex items-center gap-1 text-[10px] uppercase font-display font-bold text-accent hover:text-primary">
                  <Copy size={10} /> Copy all
                </button>
              </div>
              <div className="border border-border/60 rounded-lg bg-background/40 max-h-64 overflow-y-auto p-2 space-y-0.5">
                {generated.slice(0, 500).map((u, i) => (
                  <a key={i} href={u} target="_blank" rel="noopener noreferrer" className="block px-2 py-1 rounded text-[11px] font-mono text-muted-foreground hover:bg-secondary/60 hover:text-primary truncate">
                    {u}
                  </a>
                ))}
                {generated.length > 500 && (
                  <div className="px-2 py-1 text-[10px] italic text-muted-foreground">+{generated.length - 500} more (use Copy all)</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Wildcards admin */}
      {admin && (
        <div className="max-w-3xl mx-auto card-shine border border-primary/40 rounded-2xl p-5">
          <h3 className="font-display font-black text-sm uppercase tracking-wider mb-3 text-gradient-gold">Wildcard Domains (Admin)</h3>
          <div className="flex gap-2 mb-3">
            <input placeholder="*.deltacareers.mytunnel.org" value={newPattern} onChange={(e) => setNewPattern(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addWildcard()}
              className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary" />
            <button onClick={addWildcard} className="flex items-center gap-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-display font-bold">
              <Plus size={14} /> Add
            </button>
          </div>
          {wildcards.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No wildcards yet.</p>
          ) : (
            <div className="space-y-1">
              {wildcards.map((w) => (
                <div key={w.id} className="flex items-center justify-between px-3 py-2 bg-secondary/40 border border-border/60 rounded-lg">
                  <span className="font-mono text-xs truncate">{w.pattern}</span>
                  <button onClick={() => delWildcard(w.id)} className="p-1 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Generator;
