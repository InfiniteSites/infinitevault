import { Game } from "@/data/games";

interface GameCardProps {
  game: Game;
  onPlay: (game: Game) => void;
}

const GameCard = ({ game, onPlay }: GameCardProps) => {
  return (
    <button
      onClick={() => onPlay(game)}
      className="group relative rounded-lg overflow-hidden card-shine border border-border hover:border-primary/50 transition-all duration-300 hover:vault-glow-hover text-left w-full"
    >
      <div className="aspect-video w-full overflow-hidden">
        <img
          src={game.image}
          alt={game.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/placeholder.svg";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <h3 className="font-display text-sm font-semibold text-foreground truncate">
          {game.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
          {game.desc}
        </p>
      </div>
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-background/60 backdrop-blur-sm">
        <span className="font-display text-sm font-bold text-primary tracking-wider uppercase">
          Play Now
        </span>
      </div>
    </button>
  );
};

export default GameCard;
