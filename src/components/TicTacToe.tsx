import { useState, useCallback } from "react";

type Difficulty = "easy" | "medium" | "hard";
type Mode = "ai" | "friend";
type Player = "X" | "O";
type Cell = Player | null;

const winPatterns = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

function checkWinner(board: Cell[]): Player | "draw" | null {
  for (const [a,b,c] of winPatterns) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  }
  if (board.every(c => c !== null)) return "draw";
  return null;
}

function minimax(board: Cell[], isMax: boolean, depth: number, maxDepth: number): number {
  const winner = checkWinner(board);
  if (winner === "O") return 10 - depth;
  if (winner === "X") return depth - 10;
  if (winner === "draw") return 0;
  if (depth >= maxDepth) return 0;

  const scores: number[] = [];
  for (let i = 0; i < 9; i++) {
    if (board[i]) continue;
    board[i] = isMax ? "O" : "X";
    scores.push(minimax(board, !isMax, depth + 1, maxDepth));
    board[i] = null;
  }
  return isMax ? Math.max(...scores) : Math.min(...scores);
}

function getAiMove(board: Cell[], difficulty: Difficulty): number {
  const empty = board.map((c, i) => c === null ? i : -1).filter(i => i >= 0);
  if (empty.length === 0) return -1;

  // Easy: 60% random, Medium: 30% random, Hard: 0% random
  const randomChance = difficulty === "easy" ? 0.6 : difficulty === "medium" ? 0.3 : 0;
  if (Math.random() < randomChance) {
    return empty[Math.floor(Math.random() * empty.length)];
  }

  const maxDepth = difficulty === "easy" ? 2 : difficulty === "medium" ? 4 : 9;
  let bestScore = -Infinity;
  let bestMove = empty[0];
  for (const i of empty) {
    board[i] = "O";
    const score = minimax(board, false, 0, maxDepth);
    board[i] = null;
    if (score > bestScore) { bestScore = score; bestMove = i; }
  }
  return bestMove;
}

const TicTacToe = () => {
  const [mode, setMode] = useState<Mode | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [turn, setTurn] = useState<Player>("X");
  const [result, setResult] = useState<string | null>(null);

  const reset = () => {
    setBoard(Array(9).fill(null));
    setTurn("X");
    setResult(null);
  };

  const goBack = () => {
    setMode(null);
    setDifficulty(null);
    reset();
  };

  const handleClick = useCallback((i: number) => {
    if (board[i] || result) return;

    const newBoard = [...board];
    newBoard[i] = turn;

    const winner = checkWinner(newBoard);
    if (winner) {
      setBoard(newBoard);
      setResult(winner === "draw" ? "It's a draw!" : `${winner} wins!`);
      return;
    }

    if (mode === "ai" && turn === "X") {
      // Player just moved, now AI moves
      const aiMove = getAiMove(newBoard, difficulty!);
      if (aiMove >= 0) {
        newBoard[aiMove] = "O";
        const aiWinner = checkWinner(newBoard);
        if (aiWinner) {
          setBoard(newBoard);
          setResult(aiWinner === "draw" ? "It's a draw!" : `${aiWinner} wins!`);
          return;
        }
      }
      setBoard(newBoard);
      setTurn("X");
    } else {
      setBoard(newBoard);
      setTurn(turn === "X" ? "O" : "X");
    }
  }, [board, turn, result, mode, difficulty]);

  // Mode selection
  if (!mode) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        <h2 className="text-3xl font-bold text-primary font-display">Tic Tac Toe</h2>
        <p className="text-muted-foreground">Choose game mode</p>
        <div className="flex gap-4">
          <button onClick={() => setMode("ai")} className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-display font-semibold hover:opacity-90 transition-opacity">
            vs AI
          </button>
          <button onClick={() => setMode("friend")} className="px-6 py-3 bg-secondary text-foreground border border-border rounded-lg font-display font-semibold hover:bg-secondary/80 transition-colors">
            vs Friend
          </button>
        </div>
      </div>
    );
  }

  // Difficulty selection for AI mode
  if (mode === "ai" && !difficulty) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
        <h2 className="text-3xl font-bold text-primary font-display">Tic Tac Toe</h2>
        <p className="text-muted-foreground">Select difficulty</p>
        <div className="flex gap-4">
          {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
            <button key={d} onClick={() => setDifficulty(d)} className="px-6 py-3 bg-secondary text-foreground border border-border rounded-lg font-display font-semibold capitalize hover:border-primary/50 transition-colors">
              {d}
            </button>
          ))}
        </div>
        <button onClick={goBack} className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
      <h2 className="text-2xl font-bold text-primary font-display">Tic Tac Toe</h2>
      <p className="text-sm text-muted-foreground">
        {mode === "ai" ? `vs AI (${difficulty})` : "vs Friend"} {!result && `— ${turn}'s turn`}
      </p>

      <div className="grid grid-cols-3 gap-2">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            className="w-20 h-20 bg-secondary border border-border rounded-lg flex items-center justify-center text-3xl font-bold font-display transition-all hover:border-primary/50 hover:bg-secondary/80"
            style={{ color: cell === "X" ? "hsl(var(--primary))" : cell === "O" ? "hsl(var(--destructive, 0 84% 60%))" : undefined }}
          >
            {cell}
          </button>
        ))}
      </div>

      {result && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-lg font-display font-bold text-foreground">{result}</p>
          <div className="flex gap-3">
            <button onClick={reset} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
              Play Again
            </button>
            <button onClick={goBack} className="px-4 py-2 bg-secondary text-foreground border border-border rounded-lg text-sm font-semibold hover:bg-secondary/80 transition-colors">
              Change Mode
            </button>
          </div>
        </div>
      )}

      {!result && (
        <button onClick={goBack} className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back</button>
      )}
    </div>
  );
};

export default TicTacToe;
