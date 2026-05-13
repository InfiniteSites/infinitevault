import { useEffect, useState } from "react";
import { Eye, BarChart3, Link as LinkIcon, RefreshCw } from "lucide-react";
import { isAdmin } from "@/lib/admin";
import { api, LinkRow, ProxyRow, DumpLinkRow } from "@/lib/api";
import { Navigate } from "react-router-dom";

interface Top { url: string; name: string; visits: number; type: string }

const AdminPanel = () => {
  const [admin] = useState(isAdmin());
  const [visits, setVisits] = useState(0);
  const [top, setTop] = useState<Top[]>([]);
  const [counts, setCounts] = useState({ links: 0, proxies: 0, dumps: 0 });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const [stats, links, prox, dl] = await Promise.all([
      api.getStats(), api.getLinks(), api.getProxies(), api.getDumpLinks(),
    ]);
    setVisits(stats.total_visits);
    setCounts({ links: links.length, proxies: prox.length, dumps: dl.length });
    const all: Top[] = [
      ...links.map((l: LinkRow) => ({ url: l.url, name: l.name, visits: l.visits, type: "link" })),
      ...prox.map((l: ProxyRow) => ({ url: l.url, name: l.name, visits: l.visits, type: "proxy" })),
      ...dl.map((l: DumpLinkRow) => ({ url: l.url, name: l.url, visits: l.visits, type: "dump" })),
    ].sort((a, b) => b.visits - a.visits).slice(0, 25);
    setTop(all);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  if (!admin) return <Navigate to="/" replace />;

  const Stat = ({ label, value, icon: Icon }: any) => (
    <div className="card-shine border border-primary/40 rounded-2xl p-5 flex items-center gap-4 vault-glow">
      <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/40 flex items-center justify-center">
        <Icon className="text-primary" size={22} />
      </div>
      <div>
        <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="font-display text-3xl font-black text-gradient-cosmic">{value.toLocaleString()}</div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-display tracking-[0.3em] text-primary uppercase">
          <BarChart3 size={12} /> Admin
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-black text-gradient-cosmic mb-2">CONTROL ROOM</h1>
        <p className="text-muted-foreground text-sm">Live stats across the entire site (synced for every visitor).</p>
      </div>

      <div className="max-w-5xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <Stat label="Total Visits" value={visits} icon={Eye} />
        <Stat label="Home Links" value={counts.links} icon={LinkIcon} />
        <Stat label="Proxies" value={counts.proxies} icon={LinkIcon} />
        <Stat label="Dump Links" value={counts.dumps} icon={LinkIcon} />
      </div>

      <div className="max-w-5xl mx-auto card-shine border border-border/60 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-black text-lg uppercase tracking-wider text-gradient-gold">Most Visited Links</h3>
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-display font-bold uppercase rounded-lg bg-secondary/60 hover:bg-secondary border border-border">
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
        {top.length === 0 ? (
          <p className="text-center text-muted-foreground italic py-6">No clicks yet.</p>
        ) : (
          <div className="space-y-1">
            {top.map((t, i) => (
              <div key={i} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-secondary/30 hover:bg-secondary/60 transition">
                <span className="font-display font-black text-xs w-8 text-muted-foreground">#{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-sm font-semibold truncate">{t.name}</div>
                  <div className="text-[10px] font-mono text-muted-foreground truncate">{t.url}</div>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-display font-bold uppercase bg-accent/20 text-accent">{t.type}</span>
                <span className="font-display font-black text-accent text-sm w-16 text-right">{t.visits}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
