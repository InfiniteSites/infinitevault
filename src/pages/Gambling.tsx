import { useEffect, useRef, useState } from "react";
import { Dice5, Bomb, TrendingUp, RotateCcw, Trophy, Coins, Gem, Drumstick, Circle } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { api, LeaderEntry } from "@/lib/api";

const EDGE = 0.9;

// ---------- Mines ----------
const MinesGame = ({ balance, setBalance }: { balance: number; setBalance: (n: number) => void }) => {
  const [bet, setBet] = useState(1);
  const [mineCount, setMineCount] = useState(3);
  const [grid, setGrid] = useState<{ revealed: boolean; mine: boolean }[]>([]);
  const [active, setActive] = useState(false);
  const [picks, setPicks] = useState(0);
  const [lost, setLost] = useState(false);

  const totalCells = 25;
  const safeCells = totalCells - mineCount;
  const multiplier = (n: number) => {
    if (n === 0) return 1;
    let m = 1;
    for (let i = 0; i < n; i++) m *= (totalCells - i) / (safeCells - i);
    return +(m * EDGE).toFixed(2);
  };

  const start = () => {
    if (bet <= 0 || bet > balance) return;
    setBalance(balance - bet);
    const cells = Array.from({ length: totalCells }, () => ({ revealed: false, mine: false }));
    const idxs = [...Array(totalCells).keys()].sort(() => Math.random() - 0.5).slice(0, mineCount);
    idxs.forEach((i) => (cells[i].mine = true));
    setGrid(cells); setActive(true); setPicks(0); setLost(false);
  };
  const click = (i: number) => {
    if (!active || grid[i].revealed) return;
    const next = [...grid];
    next[i] = { ...next[i], revealed: true };
    if (next[i].mine) { next.forEach((c) => (c.revealed = true)); setGrid(next); setActive(false); setLost(true); }
    else { setGrid(next); setPicks(picks + 1); }
  };
  const cashout = () => {
    if (!active || picks === 0) return;
    setBalance(balance + Math.floor(bet * multiplier(picks)));
    setActive(false);
  };

  return (
    <div className="card-shine border border-border/60 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4"><Bomb className="text-tertiary" size={20} /><h3 className="font-display font-black text-lg uppercase tracking-wider">Mines</h3></div>
      {!active && (
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs text-muted-foreground font-display uppercase tracking-wider">Bet</label>
            <input type="number" min={1} value={bet} onChange={(e) => setBet(Math.max(1, +e.target.value || 0))} className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-display uppercase tracking-wider">Mines: {mineCount}</label>
            <input type="range" min={1} max={20} value={mineCount} onChange={(e) => setMineCount(+e.target.value)} className="w-full mt-1 accent-primary" />
          </div>
          <button onClick={start} disabled={bet > balance || bet <= 0} className="w-full py-2.5 bg-gradient-to-r from-primary to-tertiary text-primary-foreground rounded-lg font-display font-bold uppercase text-sm hover:opacity-90 disabled:opacity-40">Place Bet</button>
        </div>
      )}
      {active && (
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="text-muted-foreground">Multi: <span className="text-accent font-bold">{multiplier(picks)}x</span></span>
          <span className="text-muted-foreground">Win: <span className="text-primary font-bold">${Math.floor(bet * multiplier(picks))}</span></span>
        </div>
      )}
      <div className="grid grid-cols-5 gap-1.5">
        {(grid.length ? grid : Array.from({ length: 25 }, () => ({ revealed: false, mine: false }))).map((c, i) => (
          <button key={i} onClick={() => click(i)} disabled={!active || c.revealed}
            className={`aspect-square rounded-md border transition-all flex items-center justify-center ${
              c.revealed ? c.mine ? "bg-destructive/30 border-destructive" : "bg-accent/20 border-accent"
              : active ? "bg-secondary/60 border-border hover:bg-secondary hover:border-primary cursor-pointer" : "bg-secondary/30 border-border/40"
            }`}>
            {c.revealed && (c.mine ? <Bomb size={14} className="text-destructive" /> : <Gem size={12} className="text-accent" />)}
          </button>
        ))}
      </div>
      {active && <button onClick={cashout} disabled={picks === 0} className="w-full mt-3 py-2.5 bg-accent text-accent-foreground rounded-lg font-display font-bold uppercase text-sm hover:opacity-90 disabled:opacity-40">Cash Out ${Math.floor(bet * multiplier(picks))}</button>}
      {lost && <div className="text-center text-destructive text-xs font-display font-bold mt-2 uppercase">Boom! You lost ${bet}</div>}
    </div>
  );
};

// ---------- Crash ----------
const CrashGame = ({ balance, setBalance }: { balance: number; setBalance: (n: number) => void }) => {
  const [bet, setBet] = useState(1);
  const [multi, setMulti] = useState(1);
  const [crashAt, setCrashAt] = useState(0);
  const [active, setActive] = useState(false);
  const [cashedAt, setCashedAt] = useState<number | null>(null);
  const [crashed, setCrashed] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [pastRounds, setPastRounds] = useState<number[]>([]);
  const tick = useRef<number | null>(null);

  const rollCrash = () => {
    const r = Math.random();
    if (r < 1 - EDGE) return 1.0;
    const x = (r - (1 - EDGE)) / EDGE;
    return Math.min(50, Math.max(1.01, +(1 / (1 - x * 0.99)).toFixed(2)));
  };
  const start = () => {
    if (bet <= 0 || bet > balance) return;
    setBalance(balance - bet);
    setCrashAt(rollCrash()); setMulti(1); setActive(true); setCrashed(false); setCashedAt(null); setHistory([1]);
  };
  useEffect(() => {
    if (!active) return;
    tick.current = window.setInterval(() => {
      setMulti((m) => {
        const next = +(m + Math.max(0.01, m * 0.022)).toFixed(2);
        if (next >= crashAt) {
          setActive(false); setCrashed(true);
          setPastRounds((p) => [crashAt, ...p].slice(0, 10));
          return crashAt;
        }
        setHistory((h) => [...h, next].slice(-80));
        return next;
      });
    }, 80);
    return () => { if (tick.current) window.clearInterval(tick.current); };
  }, [active, crashAt]);
  const cashout = () => {
    if (!active) return;
    setBalance(balance + Math.floor(bet * multi));
    setCashedAt(multi); setActive(false);
    setPastRounds((p) => [crashAt, ...p].slice(0, 10));
  };

  // Build SVG path of the multiplier curve
  const W = 280, H = 110;
  const maxY = Math.max(2, ...history);
  const points = history.map((v, i) => {
    const x = (i / Math.max(1, history.length - 1)) * W;
    const y = H - ((v - 1) / (maxY - 1 || 1)) * (H - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");

  return (
    <div className="card-shine border border-border/60 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4"><TrendingUp className="text-accent" size={20} /><h3 className="font-display font-black text-lg uppercase tracking-wider">Crash</h3></div>
      <div className={`relative rounded-xl border border-border/60 mb-3 overflow-hidden ${crashed ? "bg-destructive/10" : cashedAt ? "bg-accent/10" : "bg-zinc-950/60"}`}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-32">
          <defs>
            <linearGradient id="crashFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={crashed ? "hsl(0 80% 60%)" : "hsl(var(--accent))"} stopOpacity="0.45" />
              <stop offset="100%" stopColor={crashed ? "hsl(0 80% 60%)" : "hsl(var(--accent))"} stopOpacity="0" />
            </linearGradient>
          </defs>
          {history.length > 1 && (
            <>
              <polygon points={`0,${H} ${points} ${W},${H}`} fill="url(#crashFill)" />
              <polyline points={points} fill="none" stroke={crashed ? "hsl(0 80% 60%)" : "hsl(var(--accent))"} strokeWidth="2" />
            </>
          )}
        </svg>
        <div className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none font-display font-black text-4xl ${crashed ? "text-destructive" : cashedAt ? "text-accent" : "text-gradient-cosmic"}`}>
          {multi.toFixed(2)}x
          {crashed && <span className="text-[10px] uppercase mt-1 text-destructive">Crashed</span>}
          {cashedAt && <span className="text-[10px] uppercase mt-1 text-accent">Cashed @ {cashedAt}x</span>}
        </div>
      </div>
      {pastRounds.length > 0 && (
        <div className="flex gap-1 mb-3 overflow-hidden">
          {pastRounds.map((p, i) => (
            <span key={i} className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${p < 2 ? "bg-destructive/20 text-destructive" : p < 5 ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"}`}>{p}x</span>
          ))}
        </div>
      )}
      <div className="space-y-2">
        {!active ? (
          <>
            <input type="number" min={1} value={bet} onChange={(e) => setBet(Math.max(1, +e.target.value || 0))} placeholder="Bet"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            <button onClick={start} disabled={bet > balance || bet <= 0} className="w-full py-2.5 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg font-display font-bold uppercase text-sm hover:opacity-90 disabled:opacity-40">Launch</button>
          </>
        ) : (
          <button onClick={cashout} className="w-full py-3 bg-accent text-accent-foreground rounded-lg font-display font-bold uppercase text-base hover:opacity-90">Cash Out ${Math.floor(bet * multi)}</button>
        )}
      </div>
    </div>
  );
};

// ---------- Plinko ----------
const PlinkoGame = ({ balance, setBalance }: { balance: number; setBalance: (n: number) => void }) => {
  const ROWS = 10;
  const SLOTS = ROWS + 1;
  // Multipliers, slightly rigged via EDGE (0.9)
  const baseMults = [8, 3, 1.5, 1.1, 0.7, 0.4, 0.7, 1.1, 1.5, 3, 8];
  const mults = baseMults.map((m) => +(m * EDGE).toFixed(2));
  const [bet, setBet] = useState(1);
  const [pos, setPos] = useState<number | null>(null);
  const [path, setPath] = useState<number[]>([]); // row -> column 0..row
  const [slot, setSlot] = useState<number | null>(null);
  const [dropping, setDropping] = useState(false);

  const drop = () => {
    if (bet <= 0 || bet > balance || dropping) return;
    setBalance(balance - bet);
    setDropping(true); setSlot(null);
    const p: number[] = [0];
    let col = 0;
    for (let r = 1; r <= ROWS; r++) {
      // Bias slightly to center to make extremes rare
      const goRight = Math.random() < 0.5;
      col += goRight ? 1 : 0;
      p.push(col);
    }
    setPath(p);
    let step = 0;
    const id = setInterval(() => {
      setPos(step);
      if (step >= ROWS) {
        clearInterval(id);
        const finalSlot = p[ROWS];
        setSlot(finalSlot);
        setBalance(balance - bet + Math.floor(bet * mults[finalSlot]));
        setTimeout(() => { setDropping(false); setPos(null); }, 1200);
      }
      step++;
    }, 110);
  };

  // ball position in pixels for current row
  const W = 260, H = 200;
  const ballRow = pos ?? 0;
  const ballCol = path[Math.min(ballRow, path.length - 1)] ?? 0;
  const ballX = ((ballCol - ballRow / 2) / (ROWS / 2)) * (W / 2 - 12) + W / 2;
  const ballY = (ballRow / ROWS) * (H - 24) + 8;

  return (
    <div className="card-shine border border-border/60 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4"><Circle className="text-primary" size={20} /><h3 className="font-display font-black text-lg uppercase tracking-wider">Plinko</h3></div>
      <div className="relative rounded-xl border border-border/60 bg-zinc-950/60 mb-3 overflow-hidden" style={{ height: H }}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full">
          {Array.from({ length: ROWS }).map((_, r) =>
            Array.from({ length: r + 1 }).map((_, c) => {
              const x = ((c - r / 2) / (ROWS / 2)) * (W / 2 - 12) + W / 2;
              const y = (r / ROWS) * (H - 24) + 8;
              return <circle key={`${r}-${c}`} cx={x} cy={y} r="2" fill="hsl(var(--muted-foreground))" opacity="0.5" />;
            })
          )}
          {pos !== null && (
            <circle cx={ballX} cy={ballY} r="6" fill="hsl(var(--accent))" style={{ transition: "all 0.1s linear" }} />
          )}
        </svg>
      </div>
      <div className="grid grid-cols-11 gap-0.5 mb-3">
        {mults.map((m, i) => (
          <div key={i} className={`text-center py-1 rounded text-[9px] font-mono font-bold ${slot === i ? "bg-accent text-accent-foreground" : m >= 2 ? "bg-primary/20 text-primary" : m >= 1 ? "bg-secondary/60 text-muted-foreground" : "bg-destructive/20 text-destructive"}`}>{m}x</div>
        ))}
      </div>
      <div className="flex gap-2">
        <input type="number" min={1} value={bet} onChange={(e) => setBet(Math.max(1, +e.target.value || 0))}
          className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
        <button onClick={drop} disabled={dropping || bet > balance || bet <= 0} className="px-5 py-2 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg font-display font-bold uppercase text-sm hover:opacity-90 disabled:opacity-40">Drop</button>
      </div>
      {slot !== null && !dropping && (
        <div className="text-center text-xs font-display font-bold uppercase mt-2 text-accent">Landed {mults[slot]}x · won ${Math.floor(bet * mults[slot])}</div>
      )}
    </div>
  );
};

// ---------- Roulette ----------
const isRed = (n: number) => [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(n);
type RouletteBet = "red" | "black" | "even" | "odd" | "low" | "high" | null;
const matches = (c: RouletteBet, n: number) => {
  if (n === 0) return false;
  switch (c) {
    case "red": return isRed(n); case "black": return !isRed(n);
    case "even": return n % 2 === 0; case "odd": return n % 2 === 1;
    case "low": return n >= 1 && n <= 18; case "high": return n >= 19 && n <= 36;
    default: return false;
  }
};

const RouletteGame = ({ balance, setBalance }: { balance: number; setBalance: (n: number) => void }) => {
  const [bet, setBet] = useState(1);
  const [choice, setChoice] = useState<RouletteBet>("red");
  const [result, setResult] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState<boolean | null>(null);

  const spin = () => {
    if (bet <= 0 || bet > balance || !choice) return;
    setBalance(balance - bet);
    setSpinning(true); setWon(null);
    let ticks = 0;
    const id = setInterval(() => {
      setResult(Math.floor(Math.random() * 37));
      if (++ticks > 25) {
        clearInterval(id);
        let final: number;
        if (Math.random() > EDGE) {
          do { final = Math.floor(Math.random() * 37); } while (matches(choice!, final));
        } else final = Math.floor(Math.random() * 37);
        setResult(final); setSpinning(false);
        const w = matches(choice!, final);
        setWon(w);
        if (w) setBalance(balance + bet * 2 - bet); // pay back bet + winnings
      }
    }, 70);
  };

  const choices: { id: RouletteBet; label: string }[] = [
    { id: "red", label: "Red" }, { id: "black", label: "Black" },
    { id: "even", label: "Even" }, { id: "odd", label: "Odd" },
    { id: "low", label: "1–18" }, { id: "high", label: "19–36" },
  ];

  return (
    <div className="card-shine border border-border/60 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4"><Dice5 className="text-primary" size={20} /><h3 className="font-display font-black text-lg uppercase tracking-wider">Roulette</h3></div>
      <div className="flex items-center justify-center mb-4">
        <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center font-display font-black text-3xl transition-all ${
          result === null ? "border-border bg-secondary/30 text-muted-foreground"
          : result === 0 ? "border-accent bg-accent/20 text-accent"
          : isRed(result) ? "border-red-500 bg-red-500/20 text-red-400"
          : "border-zinc-500 bg-zinc-800 text-zinc-200"
        } ${spinning ? "animate-spin" : ""}`}>{result ?? "?"}</div>
      </div>
      {won !== null && !spinning && (
        <div className={`text-center text-sm font-display font-bold uppercase mb-3 ${won ? "text-accent" : "text-destructive"}`}>
          {won ? `You won $${bet}!` : `You lost $${bet}`}
        </div>
      )}
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {choices.map((c) => (
          <button key={c.id} onClick={() => setChoice(c.id)}
            className={`py-2 rounded-md text-xs font-display font-bold uppercase border transition ${
              choice === c.id ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"
            }`}>{c.label}</button>
        ))}
      </div>
      <div className="flex gap-2">
        <input type="number" min={1} value={bet} onChange={(e) => setBet(Math.max(1, +e.target.value || 0))}
          className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
        <button onClick={spin} disabled={spinning || bet > balance || bet <= 0} className="px-5 py-2 bg-gradient-to-r from-primary to-tertiary text-primary-foreground rounded-lg font-display font-bold uppercase text-sm hover:opacity-90 disabled:opacity-40">Spin</button>
      </div>
    </div>
  );
};

// ---------- Chicken Road ----------
const ChickenRoad = ({ balance, setBalance }: { balance: number; setBalance: (n: number) => void }) => {
  const [bet, setBet] = useState(1);
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [dead, setDead] = useState(false);
  const lanes = 12;

  // Each lane: increasing risk, multiplier up
  const multAt = (s: number) => +(EDGE * (1 + s * 0.35 + Math.pow(s, 1.4) * 0.06)).toFixed(2);
  const deathChance = (s: number) => Math.min(0.7, 0.05 + s * 0.05); // 5% then up

  const start = () => {
    if (bet <= 0 || bet > balance) return;
    setBalance(balance - bet);
    setActive(true); setStep(0); setDead(false);
  };
  const cross = () => {
    if (!active) return;
    if (Math.random() < deathChance(step + 1)) {
      setDead(true); setActive(false); setStep(step + 1);
    } else setStep(step + 1);
  };
  const cashout = () => {
    if (!active || step === 0) return;
    setBalance(balance + Math.floor(bet * multAt(step)));
    setActive(false);
  };

  return (
    <div className="card-shine border border-border/60 rounded-2xl p-5 lg:col-span-3">
      <div className="flex items-center gap-2 mb-4"><Drumstick className="text-yellow-400" size={20} /><h3 className="font-display font-black text-lg uppercase tracking-wider">Chicken Road</h3></div>

      <div className="relative h-24 rounded-xl bg-zinc-900/60 border border-border/60 mb-4 overflow-hidden">
        <div className="absolute inset-0 flex">
          {Array.from({ length: lanes }).map((_, i) => (
            <div key={i} className={`flex-1 border-r border-dashed border-yellow-500/20 flex items-center justify-center text-[10px] font-display font-bold ${
              i < step ? "bg-accent/10" : ""
            }`}>
              <span className={`${i < step ? "text-accent" : "text-muted-foreground/40"}`}>{multAt(i + 1)}x</span>
            </div>
          ))}
        </div>
        {/* Chicken */}
        <div className="absolute top-1/2 -translate-y-1/2 transition-all duration-300 text-3xl"
          style={{ left: `calc(${(step / lanes) * 100}% + 4px)` }}>
          {dead ? "💀" : "🐔"}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs mb-3">
        <span className="text-muted-foreground">Step {step}/{lanes}</span>
        <span className="text-muted-foreground">Multi: <span className="text-accent font-bold">{step > 0 ? multAt(step) : 1}x</span></span>
        <span className="text-muted-foreground">Win: <span className="text-primary font-bold">${step > 0 ? Math.floor(bet * multAt(step)) : 0}</span></span>
      </div>

      {!active && !dead && step === 0 && (
        <div className="flex gap-2">
          <input type="number" min={1} value={bet} onChange={(e) => setBet(Math.max(1, +e.target.value || 0))}
            className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
          <button onClick={start} disabled={bet > balance} className="px-5 py-2 bg-gradient-to-r from-yellow-500 to-accent text-primary-foreground rounded-lg font-display font-bold uppercase text-sm hover:opacity-90 disabled:opacity-40">Start</button>
        </div>
      )}

      {active && (
        <div className="grid grid-cols-2 gap-2">
          <button onClick={cross} className="py-3 bg-yellow-500 text-zinc-900 rounded-lg font-display font-black uppercase text-sm hover:opacity-90">Cross 🐔</button>
          <button onClick={cashout} disabled={step === 0} className="py-3 bg-accent text-accent-foreground rounded-lg font-display font-bold uppercase text-sm hover:opacity-90 disabled:opacity-40">Cash Out ${Math.floor(bet * multAt(step))}</button>
        </div>
      )}

      {dead && (
        <div className="space-y-2">
          <div className="text-center text-destructive text-xs font-display font-bold uppercase">Splat! You lost ${bet}</div>
          <button onClick={() => { setStep(0); setDead(false); }} className="w-full py-2 bg-secondary border border-border rounded-lg text-xs font-display font-bold uppercase">Reset</button>
        </div>
      )}
      {!active && !dead && step > 0 && (
        <button onClick={() => { setStep(0); }} className="w-full py-2 bg-secondary border border-border rounded-lg text-xs font-display font-bold uppercase">New round</button>
      )}
    </div>
  );
};

// ---------- Page ----------
const Gambling = () => {
  const [balance, setBalance] = useLocalStorage<number>("iv_balance", 10);
  const [playerName, setPlayerName] = useLocalStorage<string>("iv_player_name", "");
  const [askName, setAskName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [leaderboard, setLeaderboard] = useState<LeaderEntry[]>([]);

  useEffect(() => { if (!playerName) setAskName(true); }, [playerName]);

  const loadLb = async () => setLeaderboard(await api.getLeaderboard());
  useEffect(() => { loadLb(); }, []);

  // Sync to backend whenever balance changes (debounced)
  useEffect(() => {
    if (!playerName) return;
    const t = setTimeout(() => { api.upsertScore(playerName, balance).then(loadLb); }, 700);
    return () => clearTimeout(t);
  }, [balance, playerName]);

  const submitName = () => {
    const n = tempName.trim().slice(0, 20);
    if (!n) return;
    setPlayerName(n); setAskName(false);
  };

  const reset = () => setBalance(10);

  return (
    <div className="container mx-auto px-4 py-12">
      {askName && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-sm card-shine border border-primary/40 rounded-2xl p-6 vault-glow">
            <h3 className="font-display font-black text-lg text-gradient-cosmic mb-2">Pick a leaderboard name</h3>
            <p className="text-xs text-muted-foreground mb-4">Everyone playing will see your score on the global leaderboard.</p>
            <input autoFocus value={tempName} onChange={(e) => setTempName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && submitName()} maxLength={20} placeholder="Your name"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary" />
            <button onClick={submitName} className="mt-3 w-full py-2.5 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg font-display font-bold uppercase text-sm">Save</button>
          </div>
        </div>
      )}

      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-tertiary/10 border border-tertiary/30 text-xs font-display tracking-[0.3em] uppercase" style={{ color: "hsl(var(--tertiary))" }}>
          <Dice5 size={12} /> Fake Casino
        </div>
        <h1 className="font-display text-4xl sm:text-6xl font-black text-gradient-cosmic mb-3 tracking-tight">GAMBLING</h1>
        <p className="text-muted-foreground text-sm">Not real money. House edge ~10%. Don't lose your shirt.</p>
      </div>

      <div className="max-w-5xl mx-auto mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between p-4 card-shine border border-primary/40 rounded-2xl vault-glow">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 border border-primary/40 flex items-center justify-center"><Coins className="text-primary" size={22} /></div>
          <div>
            <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">{playerName || "You"} · Balance</div>
            <div className="font-display text-3xl font-black text-gradient-cosmic">${balance.toLocaleString()}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setTempName(playerName); setAskName(true); }} className="px-3 py-2.5 bg-secondary border border-border rounded-lg text-xs font-display font-bold uppercase tracking-wider hover:bg-secondary/80">Rename</button>
          <button onClick={reset} className="flex items-center gap-2 px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm font-display font-bold uppercase tracking-wider hover:bg-secondary/80 hover:border-primary/40 transition">
            <RotateCcw size={14} /> Reset to $10
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto grid lg:grid-cols-3 gap-4 mb-8">
        <MinesGame balance={balance} setBalance={setBalance} />
        <CrashGame balance={balance} setBalance={setBalance} />
        <RouletteGame balance={balance} setBalance={setBalance} />
        <ChickenRoad balance={balance} setBalance={setBalance} />
      </div>

      <div className="max-w-2xl mx-auto card-shine border border-border/60 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><Trophy className="text-accent" size={18} /><h3 className="font-display font-black text-lg uppercase tracking-wider">Global Leaderboard</h3></div>
          <button onClick={loadLb} className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary">Refresh</button>
        </div>
        <div className="space-y-1">
          {leaderboard.length === 0 ? (
            <p className="text-center text-muted-foreground italic text-sm py-4">No scores yet. Be the first!</p>
          ) : leaderboard.slice(0, 15).map((e, i) => (
            <div key={e.id} className={`flex items-center justify-between px-3 py-2 rounded-lg ${e.name === playerName ? "bg-primary/10 border border-primary/30" : "bg-secondary/30"}`}>
              <div className="flex items-center gap-3 min-w-0">
                <span className={`font-display font-black text-sm w-6 text-center ${i === 0 ? "text-yellow-400" : i === 1 ? "text-zinc-300" : i === 2 ? "text-amber-600" : "text-muted-foreground"}`}>#{i + 1}</span>
                <span className="font-display font-bold truncate">{e.name}</span>
              </div>
              <span className="font-display font-black text-accent">${Number(e.balance).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Gambling;
