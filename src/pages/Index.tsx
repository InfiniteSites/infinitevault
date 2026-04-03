import { useState, useMemo } from "react";
import { Search, Gamepad2, Sparkles } from "lucide-react";
import { games, Game } from "@/data/games";
import GameCard from "@/components/GameCard";
import GamePlayer from "@/components/GamePlayer";

const Index = () => {
  const [search, setSearch] = useState("");
  const [activeGame, setActiveGame] = useState<Game | null>(null);

  const filteredGames = useMemo(() => {
    if (!search.trim()) return games;
    const q = search.toLowerCase();
    return games.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.desc.toLowerCase().includes(q)
    );
  }, [search]);

  if (activeGame) {
    return <GamePlayer game={activeGame} onClose={() => setActiveGame(null)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center vault-glow">
              <Sparkles size={18} className="text-primary" />
            </div>
            <h1 className="font-display text-lg md:text-xl font-bold text-gradient-gold tracking-wide">
              Infinite's Vault
            </h1>
          </div>

          <div className="relative max-w-md w-full">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search games..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
          </div>

          <div className="hidden md:flex items-center gap-2 text-muted-foreground text-sm shrink-0">
            <Gamepad2 size={16} />
            <span>{games.length} games</span>
          </div>
        </div>
      </header>

      {/* Games Grid */}
      <main className="container mx-auto px-4 py-8">
        {filteredGames.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
            <Gamepad2 size={48} className="mb-4 opacity-40" />
            <p className="font-display text-sm">No games found</p>
            <p className="text-xs mt-1">Try a different search term</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredGames.map((game, i) => (
              <GameCard key={`${game.title}-${i}`} game={game} onPlay={setActiveGame} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
