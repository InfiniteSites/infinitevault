import { useState, useMemo, useCallback } from "react";
import { Search, Gamepad2, Sparkles } from "lucide-react";
import { games, Game } from "@/data/games";
import GameCard from "@/components/GameCard";
import GamePlayer from "@/components/GamePlayer";

interface GameTab {
  game: Game;
  id: string;
  htmlContent: string | null;
  loading: boolean;
  error: boolean;
}

let tabCounter = 0;

const Index = () => {
  const [search, setSearch] = useState("");
  const [openTabs, setOpenTabs] = useState<GameTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>("");

  const filteredGames = useMemo(() => {
    if (!search.trim()) return games;
    const q = search.toLowerCase();
    return games.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.desc.toLowerCase().includes(q)
    );
  }, [search]);

  const openGame = useCallback((game: Game) => {
    const id = `tab-${++tabCounter}`;
    const isHtmlFile = game.url.endsWith(".html");

    const newTab: GameTab = {
      game,
      id,
      htmlContent: null,
      loading: isHtmlFile,
      error: false,
    };

    setOpenTabs((prev) => [...prev, newTab]);
    setActiveTabId(id);

    if (isHtmlFile) {
      fetch(game.url)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch");
          return res.text();
        })
        .then((html) => {
          // Inject a <base> tag so relative resources resolve correctly
          const baseUrl = game.url.substring(0, game.url.lastIndexOf("/") + 1);
          let processedHtml = html;
          if (!html.includes("<base")) {
            processedHtml = html.replace(
              /<head([^>]*)>/i,
              `<head$1><base href="${baseUrl}">`
            );
            // If no <head> tag, prepend base
            if (!processedHtml.includes("<base")) {
              processedHtml = `<base href="${baseUrl}">` + processedHtml;
            }
          }
          setOpenTabs((prev) =>
            prev.map((t) =>
              t.id === id ? { ...t, htmlContent: processedHtml, loading: false } : t
            )
          );
        })
        .catch(() => {
          // On error, fall back to direct iframe src
          setOpenTabs((prev) =>
            prev.map((t) =>
              t.id === id ? { ...t, loading: false, error: true } : t
            )
          );
        });
    }
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setOpenTabs((prev) => {
      const newTabs = prev.filter((t) => t.id !== tabId);
      if (newTabs.length === 0) {
        setActiveTabId("");
      } else {
        setActiveTabId((currentActive) => {
          if (currentActive === tabId) {
            const closedIndex = prev.findIndex((t) => t.id === tabId);
            const newIndex = Math.min(closedIndex, newTabs.length - 1);
            return newTabs[newIndex].id;
          }
          return currentActive;
        });
      }
      return newTabs;
    });
  }, []);

  const closeAll = useCallback(() => {
    setOpenTabs([]);
    setActiveTabId("");
  }, []);

  if (openTabs.length > 0 && activeTabId) {
    return (
      <GamePlayer
        tabs={openTabs}
        activeTabId={activeTabId}
        onCloseTab={closeTab}
        onSelectTab={setActiveTabId}
        onCloseAll={closeAll}
      />
    );
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
              <GameCard key={`${game.title}-${i}`} game={game} onPlay={openGame} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
