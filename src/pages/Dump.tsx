import { useEffect, useState } from "react";
import { Plus, Trash2, ExternalLink, Database, ChevronDown, ChevronRight } from "lucide-react";
import { isAdmin, buildProxyUrl } from "@/lib/admin";
import { api, DumpRow, DumpLinkRow } from "@/lib/api";

const extractLinks = (text: string): string[] =>
  text.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);

const DumpPage = () => {
  const [dumps, setDumps] = useState<DumpRow[]>([]);
  const [dumpLinks, setDumpLinks] = useState<DumpLinkRow[]>([]);
  const [admin, setAdminState] = useState(isAdmin());
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const load = async () => {
    setDumps(await api.getDumps());
    setDumpLinks(await api.getDumpLinks());
  };
  useEffect(() => { load(); }, []);
  useEffect(() => {
    const h = () => setAdminState(isAdmin());
    window.addEventListener("admin-changed", h);
    return () => window.removeEventListener("admin-changed", h);
  }, []);

  const submit = async () => {
    if (!title.trim() || !text.trim()) return;
    const urls = extractLinks(text);
    if (!urls.length) return;
    await api.addDump(title.trim(), urls);
    setTitle(""); setText(""); load();
  };

  const removeDump = async (id: string) => {
    if (!confirm("Delete this dump?")) return;
    await api.deleteDump(id); load();
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-display tracking-widest text-primary">
          <Database size={12} /> BULK STASH
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-black text-gradient-gold mb-2">Dump</h1>
        <p className="text-muted-foreground text-sm">Thousands of links, organized into named drops.</p>
      </div>

      {admin && (
        <div className="max-w-3xl mx-auto card-shine border border-border/60 rounded-2xl p-5 mb-10">
          <input placeholder="Dump title (e.g. Aug 2025 batch)" value={title} onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm font-display font-semibold mb-3 focus:outline-none focus:ring-1 focus:ring-primary" />
          <textarea placeholder="Paste links here, one per line..." value={text} onChange={(e) => setText(e.target.value)} rows={10}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary resize-y" />
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-muted-foreground">{text.trim() ? `${extractLinks(text).length} links detected` : "0 links"}</span>
            <button onClick={submit} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg text-sm font-display font-bold hover:opacity-90">
              <Plus size={14} /> Save Dump
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-3">
        {dumps.length === 0 ? (
          <p className="text-center text-muted-foreground italic py-12">No dumps yet.</p>
        ) : dumps.map((d) => {
          const isOpen = open === d.id;
          const links = dumpLinks.filter((l) => l.dump_id === d.id);
          return (
            <div key={d.id} className="card-shine border border-border/60 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <button onClick={() => setOpen(isOpen ? null : d.id)} className="flex items-center gap-3 text-left flex-1 min-w-0">
                  {isOpen ? <ChevronDown size={16} className="text-primary shrink-0" /> : <ChevronRight size={16} className="text-muted-foreground shrink-0" />}
                  <div className="min-w-0">
                    <div className="font-display font-bold truncate">{d.title}</div>
                    <div className="text-xs text-muted-foreground">{links.length} links · {new Date(d.created_at).toLocaleDateString()}</div>
                  </div>
                </button>
                {admin && (
                  <button onClick={() => removeDump(d.id)} className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              {isOpen && (
                <div className="border-t border-border/60 p-3 bg-background/40 max-h-96 overflow-y-auto space-y-1">
                  {links.map((l, i) => (
                    <div key={l.id} className="group flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/60 transition">
                      <span className="text-[10px] font-mono text-muted-foreground w-8 shrink-0 text-right">{i + 1}</span>
                      <span className="font-mono text-xs truncate flex-1">{l.url}</span>
                      <button onClick={() => { api.bumpLink("dump_links", l.id); window.open(l.url, "_blank", "noopener"); }} className="p-1 rounded text-muted-foreground hover:text-primary" title="Open">
                        <ExternalLink size={12} />
                      </button>
                      <button onClick={() => { api.bumpLink("dump_links", l.id); window.open(buildProxyUrl(l.url), "_blank", "noopener"); }} className="px-1.5 py-0.5 rounded text-[9px] font-display font-bold bg-accent/20 text-accent hover:bg-accent/30">PROXY</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DumpPage;
