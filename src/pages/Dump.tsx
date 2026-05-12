import { useEffect, useState } from "react";
import { Plus, Trash2, ExternalLink, Database, ChevronDown, ChevronRight } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { isAdmin, buildProxyUrl } from "@/lib/admin";

interface Dump {
  id: string;
  title: string;
  links: string[];
  createdAt: number;
}

const extractLinks = (text: string): string[] => {
  // Split by lines, commas, or whitespace; keep things that look like URLs or just keep raw lines
  const parts = text
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts;
};

const DumpPage = () => {
  const [dumps, setDumps] = useLocalStorage<Dump[]>("iv_dumps", []);
  const [admin, setAdminState] = useState(isAdmin());
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    const h = () => setAdminState(isAdmin());
    window.addEventListener("admin-changed", h);
    return () => window.removeEventListener("admin-changed", h);
  }, []);

  const submit = () => {
    if (!title.trim() || !text.trim()) return;
    const links = extractLinks(text);
    if (links.length === 0) return;
    const dump: Dump = {
      id: `dump-${Date.now()}`,
      title: title.trim(),
      links,
      createdAt: Date.now(),
    };
    setDumps((d) => [dump, ...d]);
    setTitle("");
    setText("");
    setOpen(dump.id);
  };

  const removeDump = (id: string) => {
    if (!confirm("Delete this dump?")) return;
    setDumps((d) => d.filter((x) => x.id !== id));
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-display tracking-widest text-primary">
          <Database size={12} /> BULK DROP
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-black text-gradient-gold mb-2">Dump</h1>
        <p className="text-muted-foreground text-sm">Drop hundreds of links at once. One per line or comma-separated.</p>
      </div>

      {admin ? (
        <div className="max-w-3xl mx-auto card-shine border border-border/60 rounded-2xl p-5 mb-10">
          <input
            placeholder="Dump title (e.g. Aug 2025 batch)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2.5 bg-background border border-border rounded-lg text-sm font-display font-semibold mb-3 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <textarea
            placeholder="Paste links here, one per line..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary resize-y"
          />
          <div className="flex justify-between items-center mt-3">
            <span className="text-xs text-muted-foreground">
              {text.trim() ? `${extractLinks(text).length} links detected` : "0 links"}
            </span>
            <button
              onClick={submit}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg text-sm font-display font-bold hover:opacity-90"
            >
              <Plus size={14} /> Save Dump
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto p-4 bg-secondary/40 border border-border/60 rounded-xl text-center text-sm text-muted-foreground mb-10">
          Admin access required to create dumps.
        </div>
      )}

      <div className="max-w-4xl mx-auto space-y-3">
        {dumps.length === 0 ? (
          <p className="text-center text-muted-foreground italic py-12">No dumps yet.</p>
        ) : (
          dumps.map((d) => {
            const isOpen = open === d.id;
            return (
              <div key={d.id} className="card-shine border border-border/60 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4">
                  <button
                    onClick={() => setOpen(isOpen ? null : d.id)}
                    className="flex items-center gap-3 text-left flex-1 min-w-0"
                  >
                    {isOpen ? <ChevronDown size={16} className="text-primary shrink-0" /> : <ChevronRight size={16} className="text-muted-foreground shrink-0" />}
                    <div className="min-w-0">
                      <div className="font-display font-bold truncate">{d.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {d.links.length} links · {new Date(d.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </button>
                  {admin && (
                    <button
                      onClick={() => removeDump(d.id)}
                      className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                {isOpen && (
                  <div className="border-t border-border/60 p-3 bg-background/40 max-h-96 overflow-y-auto space-y-1">
                    {d.links.map((url, i) => (
                      <div key={i} className="group flex items-center gap-2 p-2 rounded-lg hover:bg-secondary/60 transition">
                        <span className="text-[10px] font-mono text-muted-foreground w-8 shrink-0 text-right">{i + 1}</span>
                        <span className="font-mono text-xs truncate flex-1">{url}</span>
                        <button
                          onClick={() => window.open(url, "_blank", "noopener")}
                          className="p-1 rounded text-muted-foreground hover:text-primary"
                          title="Open"
                        >
                          <ExternalLink size={12} />
                        </button>
                        <button
                          onClick={() => window.open(buildProxyUrl(url), "_blank", "noopener")}
                          className="px-1.5 py-0.5 rounded text-[9px] font-display font-bold bg-accent/20 text-accent hover:bg-accent/30"
                        >
                          PROXY
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default DumpPage;
