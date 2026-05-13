import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, ExternalLink, FolderPlus, ShieldCheck } from "lucide-react";
import { isAdmin, buildProxyUrl } from "@/lib/admin";
import { api, Category, LinkRow } from "@/lib/api";
import PasswordModal from "@/components/PasswordModal";

const Home = () => {
  const [admin, setAdminState] = useState(isAdmin());
  const [pwOpen, setPwOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [newLink, setNewLink] = useState({ name: "", url: "" });
  const [newCat, setNewCat] = useState("");
  const [showNewCat, setShowNewCat] = useState(false);

  const sequence = useRef<number[]>([]);

  const load = async () => {
    setCategories(await api.getCategories());
    setLinks(await api.getLinks());
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const h = () => setAdminState(isAdmin());
    window.addEventListener("admin-changed", h);
    return () => window.removeEventListener("admin-changed", h);
  }, []);

  // 8 four times → password
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key !== "8") return;
      sequence.current.push(Date.now());
      const recent = sequence.current.filter((x) => Date.now() - x < 2000);
      sequence.current = recent;
      if (recent.length >= 4) {
        sequence.current = [];
        setPwOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const addLink = async (catId: string) => {
    if (!newLink.name.trim() || !newLink.url.trim()) return;
    await api.addLink(newLink.name.trim(), newLink.url.trim(), catId);
    setNewLink({ name: "", url: "" });
    setAddingTo(null);
    load();
  };
  const removeLink = async (id: string) => { await api.deleteLink(id); load(); };
  const addCategory = async () => {
    if (!newCat.trim()) return;
    await api.addCategory(newCat.trim());
    setNewCat(""); setShowNewCat(false); load();
  };
  const removeCategory = async (id: string) => {
    if (!confirm("Delete this category and all its links?")) return;
    await api.deleteCategory(id); load();
  };
  const open = async (l: LinkRow, proxy: boolean) => {
    api.bumpLink("links", l.id).catch(() => {});
    window.open(proxy ? buildProxyUrl(l.url) : l.url, "_blank", "noopener");
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <PasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />

      <section className="text-center py-20 mb-12 relative">
        <div className="inline-block mb-6 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/30 text-xs font-display tracking-[0.3em] text-primary uppercase">
          Unrestricted Access
        </div>
        <h1 className="font-display text-5xl sm:text-7xl md:text-8xl font-black text-gradient-cosmic mb-6 leading-[0.95] tracking-tight drop-shadow-[0_0_40px_hsl(var(--primary)/0.5)]">
          INFINITE<br className="sm:hidden" /> UNBLOCKER
        </h1>
        <div className="inline-flex items-center gap-3">
          <span className="h-px w-12 bg-gradient-to-r from-transparent to-accent" />
          <p className="font-display text-xl text-accent tracking-[0.5em] font-bold">V4</p>
          <span className="h-px w-12 bg-gradient-to-l from-transparent to-accent" />
        </div>
        {admin && (
          <div className="mt-8 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/40 text-xs font-display text-primary">
            <ShieldCheck size={12} /> Admin mode active
          </div>
        )}
      </section>

      <div className="space-y-8">
        {categories.map((cat) => {
          const catLinks = links.filter((l) => l.category_id === cat.id);
          return (
            <section key={cat.id} className="card-shine border border-border/60 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-5 pb-4 border-b border-border/50">
                <h2 className="font-display text-2xl font-bold text-gradient-gold">{cat.name}</h2>
                {admin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setAddingTo(addingTo === cat.id ? null : cat.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-display font-semibold rounded-lg bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition"
                    >
                      <Plus size={12} /> Add Link
                    </button>
                    <button
                      onClick={() => removeCategory(cat.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              {admin && addingTo === cat.id && (
                <div className="mb-4 p-4 bg-secondary/40 border border-border/60 rounded-xl flex flex-col sm:flex-row gap-2">
                  <input placeholder="Name" value={newLink.name} onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                  <input placeholder="https://..." value={newLink.url} onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                    className="flex-[2] px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                  <button onClick={() => addLink(cat.id)} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-display font-semibold">Save</button>
                </div>
              )}

              {catLinks.length === 0 ? (
                <p className="text-sm text-muted-foreground italic py-6 text-center">No links yet.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {catLinks.map((l) => (
                    <div key={l.id} className="group flex items-center justify-between gap-2 p-3 bg-secondary/40 border border-border/60 rounded-lg hover:border-primary/50 hover:bg-secondary transition-all">
                      <div className="min-w-0 flex-1">
                        <div className="font-display text-sm font-semibold truncate">{l.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate font-mono">{l.url}</div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => open(l, false)} title="Open direct" className="p-1.5 rounded-md text-muted-foreground hover:bg-primary/10 hover:text-primary transition">
                          <ExternalLink size={13} />
                        </button>
                        <button onClick={() => open(l, true)} title="Proxy" className="px-2 py-1.5 rounded-md text-[10px] font-display font-bold bg-accent/20 text-accent hover:bg-accent/30 transition">PROXY</button>
                        {admin && (
                          <button onClick={() => removeLink(l.id)} className="p-1.5 rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition opacity-0 group-hover:opacity-100">
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          );
        })}

        {admin && (
          <section className="card-shine border border-dashed border-primary/40 rounded-2xl p-6">
            {showNewCat ? (
              <div className="flex gap-2">
                <input autoFocus placeholder="Category name" value={newCat} onChange={(e) => setNewCat(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCategory()}
                  className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
                <button onClick={addCategory} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-display font-semibold">Create</button>
                <button onClick={() => setShowNewCat(false)} className="px-3 py-2 text-muted-foreground hover:text-foreground text-sm">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setShowNewCat(true)} className="w-full flex items-center justify-center gap-2 py-3 text-primary font-display font-semibold hover:bg-primary/5 rounded-lg transition">
                <FolderPlus size={16} /> Add Category
              </button>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default Home;
