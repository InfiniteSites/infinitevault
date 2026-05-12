import { useState } from "react";
import { Shuffle, ExternalLink, Globe, Sparkles } from "lucide-react";
import { getAllLinks, AnyLink } from "@/lib/allLinks";
import { buildProxyUrl } from "@/lib/admin";

const Generator = () => {
  const [pick, setPick] = useState<AnyLink | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [count, setCount] = useState(getAllLinks().length);

  const roll = () => {
    const all = getAllLinks();
    setCount(all.length);
    if (all.length === 0) {
      setPick(null);
      return;
    }
    setSpinning(true);
    let ticks = 0;
    const id = setInterval(() => {
      setPick(all[Math.floor(Math.random() * all.length)]);
      ticks++;
      if (ticks > 18) {
        clearInterval(id);
        setPick(all[Math.floor(Math.random() * all.length)]);
        setSpinning(false);
      }
    }, 60);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-accent/10 border border-accent/30 text-xs font-display tracking-[0.3em] text-accent uppercase">
          <Sparkles size={12} /> Random
        </div>
        <h1 className="font-display text-4xl sm:text-6xl font-black text-gradient-cosmic mb-3 tracking-tight">
          GENERATOR
        </h1>
        <p className="text-muted-foreground text-sm">Pulls a random link from your categories, proxies, and dumps.</p>
      </div>

      <div className="max-w-2xl mx-auto">
        <button
          onClick={roll}
          disabled={spinning}
          className="w-full group relative overflow-hidden py-6 rounded-2xl bg-gradient-to-r from-primary via-tertiary to-accent text-primary-foreground font-display font-black text-2xl tracking-wider uppercase shadow-2xl shadow-primary/40 hover:shadow-primary/60 transition-all hover:scale-[1.02] disabled:scale-100 disabled:opacity-80"
          style={{ background: "linear-gradient(90deg, hsl(270 90% 60%), hsl(320 95% 60%), hsl(190 95% 55%))" }}
        >
          <span className="relative z-10 flex items-center justify-center gap-3">
            <Shuffle size={28} className={spinning ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
            {spinning ? "Rolling..." : "Generate"}
          </span>
        </button>

        <div className="mt-8 min-h-[200px]">
          {pick ? (
            <div className={`card-shine border border-primary/40 rounded-2xl p-6 vault-glow ${spinning ? "animate-pulse" : ""}`}>
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-display font-bold uppercase tracking-widest bg-accent/20 text-accent">
                  {pick.type}
                </span>
                <span className="text-xs text-muted-foreground truncate">from {pick.source}</span>
              </div>
              <div className="font-display text-2xl font-bold text-gradient-cosmic mb-2 break-words">
                {pick.name}
              </div>
              <div className="text-xs text-muted-foreground font-mono break-all mb-5">{pick.url}</div>
              <div className="flex gap-2">
                <button
                  onClick={() => window.open(pick.url, "_blank", "noopener")}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-lg font-display font-bold uppercase text-sm hover:opacity-90"
                >
                  <ExternalLink size={14} /> Open
                </button>
                <button
                  onClick={() => window.open(buildProxyUrl(pick.url), "_blank", "noopener")}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-accent text-accent-foreground rounded-lg font-display font-bold uppercase text-sm hover:opacity-90"
                >
                  <Globe size={14} /> Proxy
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground italic py-12">
              {count === 0 ? "Add some links first to generate from." : "Click Generate to roll a random link."}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Pool: <span className="text-primary font-bold">{count}</span> links
        </p>
      </div>
    </div>
  );
};

export default Generator;
