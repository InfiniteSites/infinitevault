import { Game } from "@/data/games";
import { X, Maximize, Minimize } from "lucide-react";
import { useState } from "react";

interface GamePlayerProps {
  game: Game;
  onClose: () => void;
}

const GamePlayer = ({ game, onClose }: GamePlayerProps) => {
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

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <h2 className="font-display text-sm font-semibold text-primary truncate">
          {game.title}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-destructive/20 transition-colors text-muted-foreground hover:text-destructive"
          >
            <X size={16} />
          </button>
        </div>
      </div>
      <div className="flex-1 relative">
        <iframe
          src={game.url}
          title={game.title}
          className="absolute inset-0 w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals allow-pointer-lock"
          allow="autoplay; fullscreen; gamepad; accelerometer; gyroscope"
        />
      </div>
    </div>
  );
};

export default GamePlayer;
