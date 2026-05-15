import { useRef, useState } from "react";
import { Send, Sparkles, Bot, User } from "lucide-react";

type Msg = { role: "user" | "assistant"; content: string };

const Chat = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: next }),
      });
      if (!resp.ok || !resp.body) {
        const t = await resp.text();
        setMessages((m) => [...m, { role: "assistant", content: `Error: ${t}` }]);
        setLoading(false); return;
      }
      const reader = resp.body.getReader();
      const dec = new TextDecoder();
      let buf = ""; let acc = ""; let started = false;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let idx;
        while ((idx = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, idx); buf = buf.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data:")) continue;
          const json = line.slice(5).trim();
          if (!json || json === "[DONE]") continue;
          try {
            const obj = JSON.parse(json);
            if (obj.text) {
              acc += obj.text;
              if (!started) { started = true; setMessages((m) => [...m, { role: "assistant", content: acc }]); }
              else setMessages((m) => m.map((mm, i) => i === m.length - 1 ? { ...mm, content: acc } : mm));
              scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
            }
          } catch {}
        }
      }
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", content: `Error: ${e.message}` }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl flex flex-col" style={{ minHeight: "calc(100vh - 80px)" }}>
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-xs font-display tracking-[0.3em] text-accent uppercase">
          <Sparkles size={12} /> Gemini 2.0 Flash
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-black text-gradient-cosmic tracking-tight">AI</h1>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto card-shine border border-border/60 rounded-2xl p-4 mb-3 space-y-3 min-h-[400px]">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
            Ask anything. Powered by your Gemini API key.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${m.role === "user" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"}`}>
              {m.role === "user" ? <User size={14} /> : <Bot size={14} />}
            </div>
            <div className={`px-3 py-2 rounded-xl text-sm whitespace-pre-wrap max-w-[80%] ${m.role === "user" ? "bg-primary/15 border border-primary/30" : "bg-secondary/60 border border-border/60"}`}>
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Message..." className="flex-1 px-4 py-3 bg-secondary/60 border border-border/60 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
        <button onClick={send} disabled={loading || !input.trim()}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-primary to-accent text-primary-foreground font-display font-bold disabled:opacity-50 flex items-center gap-2">
          <Send size={14} /> Send
        </button>
      </div>
    </div>
  );
};

export default Chat;
