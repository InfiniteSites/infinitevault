import { Game } from "@/data/games";
import { X, Maximize, Minimize, ArrowLeft, Globe } from "lucide-react";
import { buildProxyUrl } from "@/lib/admin";
import { useState, useEffect } from "react";
import TicTacToe from "@/components/TicTacToe";

interface GameTab {
  game: Game;
  id: string;
  htmlContent: string | null;
  loading: boolean;
  error: boolean;
  isBuiltIn?: boolean;
}

interface GamePlayerProps {
  tabs: GameTab[];
  activeTabId: string;
  onCloseTab: (tabId: string) => void;
  onSelectTab: (tabId: string) => void;
  onCloseAll: () => void;
  onBackToLibrary: () => void;
}

const GamePlayer = ({ tabs, activeTabId, onCloseTab, onSelectTab, onCloseAll, onBackToLibrary }: GamePlayerProps) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Tab bar */}
      <div className="flex items-center border-b border-border bg-card overflow-x-auto shrink-0">
        <button
          onClick={onBackToLibrary}
          className="p-2 mx-1 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-primary shrink-0"
          title="Back to library"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex items-center flex-1 min-w-0 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`group flex items-center gap-2 px-4 py-2 cursor-pointer border-r border-border text-sm shrink-0 max-w-[200px] transition-colors ${
                tab.id === activeTabId
                  ? "bg-background text-primary border-b-2 border-b-primary"
                  : "bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <span className="truncate font-display text-xs font-semibold">{tab.game.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className="p-0.5 rounded hover:bg-destructive/20 hover:text-destructive transition-colors shrink-0"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1 px-2 shrink-0">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>
          <button
            onClick={onCloseAll}
            className="p-2 rounded-md hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Game panels */}
      <div className="flex-1 relative">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className="absolute inset-0"
            style={{ display: tab.id === activeTabId ? "block" : "none" }}
          >
            {tab.isBuiltIn ? (
              <TicTacToe />
            ) : tab.loading ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="font-display text-sm">Loading {tab.game.title}...</p>
                </div>
              </div>
            ) : tab.htmlContent ? (
              <iframe
                srcDoc={tab.htmlContent}
                title={tab.game.title}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals allow-pointer-lock"
                allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope"
              />
            ) : (
              <iframe
                src={tab.game.url}
                title={tab.game.title}
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals allow-pointer-lock"
                allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GamePlayer;
