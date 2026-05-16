import { useEffect, useState } from "react";
import { Megaphone, Send, Trash2, ShieldCheck } from "lucide-react";
import { api, Announcement } from "@/lib/api";
import { isAdmin } from "@/lib/admin";
import { supabase } from "@/integrations/supabase/client";

const Announcements = () => {
  const [items, setItems] = useState<Announcement[]>([]);
  const [admin, setAdminState] = useState(isAdmin());
  const [author, setAuthor] = useState(() => localStorage.getItem("iv_announce_author") || "Admin");
  const [text, setText] = useState("");

  const load = async () => setItems(await api.getAnnouncements());

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const h = () => setAdminState(isAdmin());
    window.addEventListener("admin-changed", h);
    return () => window.removeEventListener("admin-changed", h);
  }, []);

  // Realtime updates
  useEffect(() => {
    const ch = supabase.channel("announcements-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "announcements" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const send = async () => {
    if (!text.trim() || !admin) return;
    const a = author.trim() || "Admin";
    localStorage.setItem("iv_announce_author", a);
    await api.addAnnouncement(a, text.trim());
    setText("");
  };

  const del = async (id: string) => {
    if (!admin) return;
    if (!confirm("Delete this announcement?")) return;
    await api.deleteAnnouncement(id);
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-xs font-display tracking-[0.3em] text-accent uppercase">
          <Megaphone size={12} /> Live feed
        </div>
        <h1 className="font-display text-4xl sm:text-6xl font-black text-gradient-cosmic mb-3 tracking-tight">ANNOUNCEMENTS</h1>
        <p className="text-muted-foreground text-sm">Only admins post. Everyone reads in real time.</p>
      </div>

      {admin && (
        <div className="card-shine border border-primary/40 rounded-2xl p-4 mb-6 vault-glow">
          <div className="flex items-center gap-2 mb-3 text-xs font-display uppercase tracking-widest text-primary"><ShieldCheck size={12} /> Posting as admin</div>
          <input value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="Display name"
            className="w-full mb-2 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          <div className="flex gap-2">
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Write an announcement..." rows={2}
              className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
            <button onClick={send} disabled={!text.trim()} className="px-4 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg font-display font-bold disabled:opacity-40">
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-center text-muted-foreground italic py-12">No announcements yet.</p>
        ) : items.map((a) => (
          <div key={a.id} className="card-shine border border-border/60 rounded-xl p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-display font-black text-sm text-gradient-cosmic">{a.author}</span>
                <span className="text-[10px] text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
              </div>
              {admin && (
                <button onClick={() => del(a.id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={12} /></button>
              )}
            </div>
            <p className="text-sm whitespace-pre-wrap break-words">{a.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Announcements;
