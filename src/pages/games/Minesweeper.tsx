
import { useState, useEffect, useCallback } from 'react';
import { Bomb, Flag, RefreshCw, Smile, Frown, Meh } from 'lucide-react';
import PageTransition from '../../components/PageTransition';
import { cn } from '../../lib/utils';

type Cell = {
  x: number;
  y: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
};

export default function Minesweeper() {
  const ROWS = 10;
  const COLS = 10;
  const MINES = 15;

  const [grid, setGrid] = useState<Cell[][]>([]);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [mineCount, setMineCount] = useState(MINES);
  const [time, setTime] = useState(0);

  const initGame = useCallback(() => {
    // 1. Initialize empty grid
    let newGrid: Cell[][] = [];
    for (let y = 0; y < ROWS; y++) {
      let row: Cell[] = [];
      for (let x = 0; x < COLS; x++) {
        row.push({ x, y, isMine: false, isRevealed: false, isFlagged: false, neighborMines: 0 });
      }
      newGrid.push(row);
    }

    // 2. Place Mines
    let minesPlaced = 0;
    while (minesPlaced < MINES) {
      const ry = Math.floor(Math.random() * ROWS);
      const rx = Math.floor(Math.random() * COLS);
      if (!newGrid[ry][rx].isMine) {
        newGrid[ry][rx].isMine = true;
        minesPlaced++;
      }
    }

    // 3. Calculate Neighbors
    const directions = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
    for(let y=0; y<ROWS; y++){
      for(let x=0; x<COLS; x++){
        if(newGrid[y][x].isMine) continue;
        let count = 0;
        directions.forEach(([dy, dx]) => {
           const ny = y + dy, nx = x + dx;
           if(ny>=0 && ny<ROWS && nx>=0 && nx<COLS && newGrid[ny][nx].isMine) count++;
        });
        newGrid[y][x].neighborMines = count;
      }
    }

    setGrid(newGrid);
    setGameState('playing');
    setMineCount(MINES);
    setTime(0);
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    let timer: any;
    if (gameState === 'playing') {
      timer = setInterval(() => setTime(t => t + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [gameState]);

  const reveal = (y: number, x: number) => {
    if (gameState !== 'playing' || grid[y][x].isRevealed || grid[y][x].isFlagged) return;

    const newGrid = [...grid];
    const cell = newGrid[y][x];

    if (cell.isMine) {
      cell.isRevealed = true;
      setGameState('lost');
      // Reveal all mines
      newGrid.forEach(row => row.forEach(c => {
        if (c.isMine) c.isRevealed = true;
      }));
    } else {
      floodFill(newGrid, y, x);
      checkWin(newGrid);
    }
    setGrid(newGrid);
  };

  const floodFill = (currentGrid: Cell[][], y: number, x: number) => {
    if (y < 0 || y >= ROWS || x < 0 || x >= COLS) return;
    if (currentGrid[y][x].isRevealed || currentGrid[y][x].isFlagged) return;

    currentGrid[y][x].isRevealed = true;

    if (currentGrid[y][x].neighborMines === 0) {
      const directions = [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];
      directions.forEach(([dy, dx]) => {
        floodFill(currentGrid, y + dy, x + dx);
      });
    }
  };

  const toggleFlag = (e: React.MouseEvent, y: number, x: number) => {
    e.preventDefault();
    if (gameState !== 'playing' || grid[y][x].isRevealed) return;

    const newGrid = [...grid];
    const cell = newGrid[y][x];
    
    if (!cell.isFlagged && mineCount > 0) {
       cell.isFlagged = true;
       setMineCount(c => c - 1);
    } else if (cell.isFlagged) {
       cell.isFlagged = false;
       setMineCount(c => c + 1);
    }
    setGrid(newGrid);
  };

  const checkWin = (currentGrid: Cell[][]) => {
    let unrevealedSafeCells = 0;
    currentGrid.forEach(row => row.forEach(c => {
      if (!c.isMine && !c.isRevealed) unrevealedSafeCells++;
    }));
    if (unrevealedSafeCells === 0) {
      setGameState('won');
    }
  };

  const getCellContent = (cell: Cell) => {
    if (cell.isFlagged) return <Flag size={16} className="text-rose-500 fill-rose-500" />;
    if (!cell.isRevealed) return null;
    if (cell.isMine) return <Bomb size={18} className="text-slate-800 fill-slate-800" />;
    if (cell.neighborMines > 0) return <span className={cn("font-bold", getNumberColor(cell.neighborMines))}>{cell.neighborMines}</span>;
    return null;
  };

  const getNumberColor = (num: number) => {
    const colors = [
      '', 'text-blue-500', 'text-green-500', 'text-red-500', 'text-purple-500', 
      'text-orange-500', 'text-teal-500', 'text-slate-900', 'text-slate-400'
    ];
    return colors[num];
  };

  return (
    <PageTransition>
      <div className="flex flex-col items-center py-8 min-h-[calc(100vh-100px)]">
        <div className="bg-slate-200 p-4 rounded-xl shadow-xl border-b-4 border-r-4 border-slate-300 select-none">
          
          {/* Header */}
          <div className="bg-slate-100 border-b-4 border-r-4 border-white border-t-4 border-l-4 border-slate-300 p-2 flex justify-between items-center mb-4">
            <div className="bg-black text-red-500 font-mono text-2xl px-2 py-1 min-w-[60px] text-right">
              {mineCount.toString().padStart(3, '0')}
            </div>
            
            <button onClick={initGame} className="w-10 h-10 bg-slate-200 border-t-4 border-l-4 border-white border-b-4 border-r-4 border-slate-400 active:border-t-slate-400 active:border-l-slate-400 flex items-center justify-center">
              {gameState === 'playing' ? <Smile className="text-yellow-500 fill-black" /> : 
               gameState === 'won' ? <Smile className="text-yellow-500 fill-black" /> : 
               <Frown className="text-yellow-500 fill-black" />}
            </button>

            <div className="bg-black text-red-500 font-mono text-2xl px-2 py-1 min-w-[60px] text-right">
              {Math.min(999, time).toString().padStart(3, '0')}
            </div>
          </div>

          {/* Grid */}
          <div 
            className="grid gap-0.5 bg-slate-400 border-b-4 border-r-4 border-white border-t-4 border-l-4 border-slate-300"
            style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
            onContextMenu={(e) => e.preventDefault()}
          >
            {grid.map((row, y) => (
              row.map((cell, x) => (
                <div
                  key={`${y}-${x}`}
                  onClick={() => reveal(y, x)}
                  onContextMenu={(e) => toggleFlag(e, y, x)}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center text-lg cursor-default",
                    cell.isRevealed 
                      ? "bg-slate-100 border border-slate-200" 
                      : "bg-slate-200 border-t-4 border-l-4 border-white border-b-4 border-r-4 border-slate-400 hover:bg-slate-100 active:border-none"
                  )}
                >
                  {getCellContent(cell)}
                </div>
              ))
            ))}
          </div>
          
        </div>
        <p className="mt-6 text-slate-500 text-sm">左键点击翻开，右键标记地雷</p>
      </div>
    </PageTransition>
  );
}
