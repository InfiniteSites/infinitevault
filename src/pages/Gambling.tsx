import { useEffect, useRef, useState } from "react";
import { Dice5, Bomb, TrendingUp, RotateCcw, Trophy, Coins, Gem } from "lucide-react";
import { useLocalStorage } from "@/hooks/useLocalStorage";

// House edge: 10% → multiply true fair payouts by 0.9
const EDGE = 0.9;

interface LeaderEntry { name: string; balance: number }

const fakeNames = [
  "ShadowAce", "NeonRiot", "VoidWalker", "PixelKing", "GlitchGod",
  "NovaStrike", "CryptoCobra", "MidnightFox", "ZeroDay", "BinaryBard",
];
const seedLeaderboard = (): LeaderEntry[] =>
  fakeNames.map((n) => ({ name: n, balance: Math.floor(Math.random() * 9000) + 500 }));

// ---------- Mines ----------
const MinesGame = ({ balance, setBalance, addToLeaderboard }: { balance: number; setBalance: (n: number) => void; addToLeaderboard: () => void }) => {
  const [bet, setBet] = useState(1);
  const [mineCount, setMineCount] = useState(3);
  const [grid, setGrid] = useState<{ revealed: boolean; mine: boolean }[]>([]);
  const [active, setActive] = useState(false);
  const [picks, setPicks] = useState(0);
  const [lost, setLost] = useState(false);

  const totalCells = 25;
  const safeCells = totalCells - mineCount;

  // Multiplier formula (with house edge)
  const multiplier = (n: number) => {
    if (n === 0) return 1;
    let m = 1;
    for (let i = 0; i < n; i++) {
      m *= (totalCells - i) / (safeCells - i);
    }
    return +(m * EDGE).toFixed(2);
  };

  const start = () => {
    if (bet <= 0 || bet > balance) return;
    setBalance(balance - bet);
    const cells = Array.from({ length: totalCells }, () => ({ revealed: false, mine: false }));
    const idxs = [...Array(totalCells).keys()].sort(() => Math.random() - 0.5).slice(0, mineCount);
    idxs.forEach((i) => (cells[i].mine = true));
    setGrid(cells);
    setActive(true);
    setPicks(0);
    setLost(false);
  };

  const click = (i: number) => {
    if (!active || grid[i].revealed) return;
    const next = [...grid];
    next[i] = { ...next[i], revealed: true };
    if (next[i].mine) {
      next.forEach((c) => (c.revealed = true));
      setGrid(next);
      setActive(false);
      setLost(true);
      addToLeaderboard();
    } else {
      setGrid(next);
      setPicks(picks + 1);
    }
  };

  const cashout = () => {
    if (!active || picks === 0) return;
    const win = Math.floor(bet * multiplier(picks));
    setBalance(balance + win);
    setActive(false);
    addToLeaderboard();
  };

  return (
    <div className="card-shine border border-border/60 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Bomb className="text-tertiary" size={20} />
        <h3 className="font-display font-black text-lg uppercase tracking-wider">Mines</h3>
      </div>

      {!active && (
        <div className="space-y-3 mb-4">
          <div>
            <label className="text-xs text-muted-foreground font-display uppercase tracking-wider">Bet</label>
            <input
              type="number"
              min={1}
              value={bet}
              onChange={(e) => setBet(Math.max(1, +e.target.value || 0))}
              className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground font-display uppercase tracking-wider">Mines: {mineCount}</label>
            <input
              type="range"
              min={1}
              max={20}
              value={mineCount}
              onChange={(e) => setMineCount(+e.target.value)}
              className="w-full mt-1 accent-primary"
            />
          </div>
          <button
            onClick={start}
            disabled={bet > balance || bet <= 0}
            className="w-full py-2.5 bg-gradient-to-r from-primary to-tertiary text-primary-foreground rounded-lg font-display font-bold uppercase text-sm hover:opacity-90 disabled:opacity-40"
          >
            Place Bet
          </button>
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
          <button
            key={i}
            onClick={() => click(i)}
            disabled={!active || c.revealed}
            className={`aspect-square rounded-md border transition-all flex items-center justify-center ${
              c.revealed
                ? c.mine
                  ? "bg-destructive/30 border-destructive"
                  : "bg-accent/20 border-accent"
                : active
                ? "bg-secondary/60 border-border hover:bg-secondary hover:border-primary cursor-pointer"
                : "bg-secondary/30 border-border/40"
            }`}
          >
            {c.revealed && (c.mine ? <Bomb size={14} className="text-destructive" /> : <Gem size={12} className="text-accent" />)}
          </button>
        ))}
      </div>

      {active && (
        <button
          onClick={cashout}
          disabled={picks === 0}
          className="w-full mt-3 py-2.5 bg-accent text-accent-foreground rounded-lg font-display font-bold uppercase text-sm hover:opacity-90 disabled:opacity-40"
        >
          Cash Out ${Math.floor(bet * multiplier(picks))}
        </button>
      )}
      {lost && <div className="text-center text-destructive text-xs font-display font-bold mt-2 uppercase">Boom! You lost ${bet}</div>}
    </div>
  );
};

// ---------- Crash ----------
const CrashGame = ({ balance, setBalance, addToLeaderboard }: { balance: number; setBalance: (n: number) => void; addToLeaderboard: () => void }) => {
  const [bet, setBet] = useState(1);
  const [multi, setMulti] = useState(1);
  const [crashAt, setCrashAt] = useState(0);
  const [active, setActive] = useState(false);
  const [cashedAt, setCashedAt] = useState<number | null>(null);
  const [crashed, setCrashed] = useState(false);
  const tick = useRef<number | null>(null);

  // Random crash point with 10% house edge (mean ~ 1/(1-edge) reduced)
  const rollCrash = () => {
    const r = Math.random();
    // Bust at 1.0 with house edge probability
    if (r < 1 - EDGE) return 1.0;
    // Otherwise draw from 1/(1-x) distribution capped
    const x = (r - (1 - EDGE)) / EDGE;
    return Math.min(50, Math.max(1.01, +(1 / (1 - x * 0.99)).toFixed(2)));
  };

  const start = () => {
    if (bet <= 0 || bet > balance) return;
    setBalance(balance - bet);
    setCrashAt(rollCrash());
    setMulti(1);
    setActive(true);
    setCrashed(false);
    setCashedAt(null);
  };

  useEffect(() => {
    if (!active) return;
    tick.current = window.setInterval(() => {
      setMulti((m) => {
        const next = +(m + Math.max(0.01, m * 0.018)).toFixed(2);
        if (next >= crashAt) {
          setActive(false);
          setCrashed(true);
          addToLeaderboard();
          return crashAt;
        }
        return next;
      });
    }, 80);
    return () => {
      if (tick.current) window.clearInterval(tick.current);
    };
  }, [active, crashAt]);

  const cashout = () => {
    if (!active) return;
    setBalance(balance + Math.floor(bet * multi));
    setCashedAt(multi);
    setActive(false);
    addToLeaderboard();
  };

  return (
    <div className="card-shine border border-border/60 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="text-accent" size={20} />
        <h3 className="font-display font-black text-lg uppercase tracking-wider">Crash</h3>
      </div>

      <div className={`relative h-40 rounded-xl border border-border/60 mb-4 flex items-center justify-center overflow-hidden ${
        crashed ? "bg-destructive/10" : cashedAt ? "bg-accent/10" : "bg-secondary/30"
      }`}>
        <div className="absolute inset-0 bg-stars opacity-50" />
        <div className={`relative font-display font-black text-5xl ${
          crashed ? "text-destructive" : cashedAt ? "text-accent" : "text-gradient-cosmic"
        }`}>
          {multi.toFixed(2)}x
        </div>
        {crashed && <div className="absolute bottom-2 text-xs font-display font-bold uppercase text-destructive">Crashed</div>}
        {cashedAt && <div className="absolute bottom-2 text-xs font-display font-bold uppercase text-accent">Cashed @ {cashedAt}x</div>}
      </div>

      <div className="space-y-2">
        {!active ? (
          <>
            <input
              type="number"
              min={1}
              value={bet}
              onChange={(e) => setBet(Math.max(1, +e.target.value || 0))}
              placeholder="Bet"
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button
              onClick={start}
              disabled={bet > balance || bet <= 0}
              className="w-full py-2.5 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg font-display font-bold uppercase text-sm hover:opacity-90 disabled:opacity-40"
            >
              Launch
            </button>
          </>
        ) : (
          <button
            onClick={cashout}
            className="w-full py-3 bg-accent text-accent-foreground rounded-lg font-display font-bold uppercase text-base hover:opacity-90"
          >
            Cash Out ${Math.floor(bet * multi)}
          </button>
        )}
      </div>
    </div>
  );
};

// ---------- Roulette ----------
const ROULETTE_NUMBERS = Array.from({ length: 37 }, (_, i) => i); // 0–36
const isRed = (n: number) =>
  [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36].includes(n);

type RouletteBet = "red" | "black" | "even" | "odd" | "low" | "high" | null;

const RouletteGame = ({ balance, setBalance, addToLeaderboard }: { balance: number; setBalance: (n: number) => void; addToLeaderboard: () => void }) => {
  const [bet, setBet] = useState(1);
  const [choice, setChoice] = useState<RouletteBet>("red");
  const [result, setResult] = useState<number | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [won, setWon] = useState<boolean | null>(null);

  const spin = () => {
    if (bet <= 0 || bet > balance || !choice) return;
    setBalance(balance - bet);
    setSpinning(true);
    setWon(null);
    let ticks = 0;
    const id = setInterval(() => {
      setResult(ROULETTE_NUMBERS[Math.floor(Math.random() * 37)]);
      ticks++;
      if (ticks > 25) {
        clearInterval(id);
        // Apply 10% house edge: 10% chance to force a loss regardless
        let final: number;
        if (Math.random() > EDGE) {
          // forced loss: pick a number that doesn't match
          do {
            final = Math.floor(Math.random() * 37);
          } while (matches(choice!, final));
        } else {
          final = Math.floor(Math.random() * 37);
        }
        setResult(final);
        setSpinning(false);
        const w = matches(choice!, final);
        setWon(w);
        if (w) setBalance((b => b)(balance - bet) + bet * 2);
        addToLeaderboard();
      }
    }, 70);
  };

  const matches = (c: RouletteBet, n: number) => {
    if (n === 0) return false;
    switch (c) {
      case "red": return isRed(n);
      case "black": return !isRed(n);
      case "even": return n % 2 === 0;
      case "odd": return n % 2 === 1;
      case "low": return n >= 1 && n <= 18;
      case "high": return n >= 19 && n <= 36;
      default: return false;
    }
  };

  // Recompute payout when won
  useEffect(() => {
    if (won === true && result !== null) {
      setBalance((prev: any) => {
        // setBalance was already called above; use functional via ref. Simpler: do nothing, payout was applied in spin.
        return prev;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [won]);

  const choices: { id: RouletteBet; label: string; color: string }[] = [
    { id: "red", label: "Red", color: "bg-red-600" },
    { id: "black", label: "Black", color: "bg-zinc-900" },
    { id: "even", label: "Even", color: "bg-secondary" },
    { id: "odd", label: "Odd", color: "bg-secondary" },
    { id: "low", label: "1–18", color: "bg-secondary" },
    { id: "high", label: "19–36", color: "bg-secondary" },
  ];

  return (
    <div className="card-shine border border-border/60 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Dice5 className="text-primary" size={20} />
        <h3 className="font-display font-black text-lg uppercase tracking-wider">Roulette</h3>
      </div>

      <div className="flex items-center justify-center mb-4">
        <div className={`w-24 h-24 rounded-full border-4 flex items-center justify-center font-display font-black text-3xl transition-all ${
          result === null
            ? "border-border bg-secondary/30 text-muted-foreground"
            : result === 0
            ? "border-accent bg-accent/20 text-accent"
            : isRed(result)
            ? "border-red-500 bg-red-500/20 text-red-400"
            : "border-zinc-500 bg-zinc-800 text-zinc-200"
        } ${spinning ? "animate-spin" : ""}`}>
          {result ?? "?"}
        </div>
      </div>

      {won !== null && !spinning && (
        <div className={`text-center text-sm font-display font-bold uppercase mb-3 ${won ? "text-accent" : "text-destructive"}`}>
          {won ? `You won $${bet}!` : `You lost $${bet}`}
        </div>
      )}

      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {choices.map((c) => (
          <button
            key={c.id}
            onClick={() => setChoice(c.id)}
            className={`py-2 rounded-md text-xs font-display font-bold uppercase border transition ${
              choice === c.id ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          min={1}
          value={bet}
          onChange={(e) => setBet(Math.max(1, +e.target.value || 0))}
          className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <button
          onClick={spin}
          disabled={spinning || bet > balance || bet <= 0}
          className="px-5 py-2 bg-gradient-to-r from-primary to-tertiary text-primary-foreground rounded-lg font-display font-bold uppercase text-sm hover:opacity-90 disabled:opacity-40"
        >
          Spin
        </button>
      </div>
    </div>
  );
};

// ---------- Page ----------
const Gambling = () => {
  const [balance, setBalance] = useLocalStorage<number>("iv_balance", 10);
  const [leaderboard, setLeaderboard] = useLocalStorage<LeaderEntry[]>("iv_leaderboard", seedLeaderboard());
  const [playerName] = useLocalStorage<string>("iv_player", "You");

  const addToLeaderboard = () => {
    setLeaderboard((lb) => {
      const others = lb.filter((e) => e.name !== playerName);
      return [...others, { name: playerName, balance }].sort((a, b) => b.balance - a.balance).slice(0, 10);
    });
  };

  // Keep leaderboard fresh whenever balance changes
  useEffect(() => {
    setLeaderboard((lb) => {
      const others = lb.filter((e) => e.name !== playerName);
      return [...others, { name: playerName, balance }].sort((a, b) => b.balance - a.balance).slice(0, 10);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [balance]);

  const reset = () => {
    setBalance(10);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full bg-tertiary/10 border border-tertiary/30 text-xs font-display tracking-[0.3em] uppercase" style={{ color: "hsl(var(--tertiary))" }}>
          <Dice5 size={12} /> Fake Casino
        </div>
        <h1 className="font-display text-4xl sm:text-6xl font-black text-gradient-cosmic mb-3 tracking-tight">
          GAMBLING
        </h1>
        <p className="text-muted-foreground text-sm">Not real money. House edge ~10%. Don't lose your shirt.</p>
      </div>

      {/* Balance bar */}
      <div className="max-w-5xl mx-auto mb-6 flex flex-col sm:flex-row gap-3 items-center justify-between p-4 card-shine border border-primary/40 rounded-2xl vault-glow">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-accent/30 border border-primary/40 flex items-center justify-center">
            <Coins className="text-primary" size={22} />
          </div>
          <div>
            <div className="text-[10px] font-display uppercase tracking-widest text-muted-foreground">Balance</div>
            <div className="font-display text-3xl font-black text-gradient-cosmic">${balance.toLocaleString()}</div>
          </div>
        </div>
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2.5 bg-secondary border border-border rounded-lg text-sm font-display font-bold uppercase tracking-wider hover:bg-secondary/80 hover:border-primary/40 transition"
        >
          <RotateCcw size={14} /> Reset to $10
        </button>
      </div>

      <div className="max-w-5xl mx-auto grid lg:grid-cols-3 gap-4 mb-8">
        <MinesGame balance={balance} setBalance={setBalance} addToLeaderboard={addToLeaderboard} />
        <CrashGame balance={balance} setBalance={setBalance} addToLeaderboard={addToLeaderboard} />
        <RouletteGame balance={balance} setBalance={setBalance} addToLeaderboard={addToLeaderboard} />
      </div>

      {/* Leaderboard */}
      <div className="max-w-2xl mx-auto card-shine border border-border/60 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="text-accent" size={18} />
          <h3 className="font-display font-black text-lg uppercase tracking-wider">Leaderboard</h3>
        </div>
        <div className="space-y-1">
          {[...leaderboard].sort((a, b) => b.balance - a.balance).slice(0, 10).map((e, i) => (
            <div
              key={e.name + i}
              className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                e.name === "You" ? "bg-primary/10 border border-primary/30" : "bg-secondary/30"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`font-display font-black text-sm w-6 text-center ${
                  i === 0 ? "text-yellow-400" : i === 1 ? "text-zinc-300" : i === 2 ? "text-amber-600" : "text-muted-foreground"
                }`}>
                  #{i + 1}
                </span>
                <span className="font-display font-bold truncate">{e.name}</span>
              </div>
              <span className="font-display font-black text-accent">${e.balance.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Gambling;
