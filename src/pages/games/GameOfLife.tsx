
import { useState, useCallback, useRef } from 'react';
import { Play, Pause, Trash2, RefreshCw } from 'lucide-react';
import PageTransition from '../../components/PageTransition';
import { cn } from '../../lib/utils';

const ROWS = 30;
const COLS = 40;

export default function GameOfLife() {
  const [grid, setGrid] = useState(() => Array(ROWS).fill(Array(COLS).fill(false)));
  const [running, setRunning] = useState(false);
  const runningRef = useRef(running);
  runningRef.current = running;

  const runSimulation = useCallback(() => {
    if (!runningRef.current) return;

    setGrid((g) => {
      return g.map((row, i) => 
        row.map((col, j) => {
          let neighbors = 0;
          const directions = [[0, 1], [0, -1], [1, -1], [-1, 1], [1, 1], [-1, -1], [1, 0], [-1, 0]];
          directions.forEach(([x, y]) => {
            const newI = i + x;
            const newJ = j + y;
            if (newI >= 0 && newI < ROWS && newJ >= 0 && newJ < COLS) {
              neighbors += g[newI][newJ] ? 1 : 0;
            }
          });

          if (col && (neighbors < 2 || neighbors > 3)) return false;
          if (!col && neighbors === 3) return true;
          return col;
        })
      );
    });

    setTimeout(runSimulation, 100);
  }, []);

  const toggleRunning = () => {
    setRunning(!running);
    if (!running) {
      runningRef.current = true;
      runSimulation();
    }
  };

  const toggleCell = (i: number, j: number) => {
    const newGrid = grid.map(row => [...row]);
    newGrid[i][j] = !newGrid[i][j];
    setGrid(newGrid);
  };

  const randomize = () => {
    const newGrid = [];
    for (let i = 0; i < ROWS; i++) {
      newGrid.push(Array.from(Array(COLS), () => Math.random() > 0.7));
    }
    setGrid(newGrid);
  };

  return (
    <PageTransition>
      <div className="flex flex-col items-center py-6 min-h-[calc(100vh-100px)]">
        <h1 className="text-3xl font-bold mb-6 text-slate-800">Game of Life</h1>
        
        <div className="flex gap-4 mb-6">
          <button onClick={toggleRunning} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800">
             {running ? <><Pause size={18} /> Stop</> : <><Play size={18} /> Start</>}
          </button>
          <button onClick={randomize} className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300">
             <RefreshCw size={18} /> Random
          </button>
          <button onClick={() => setGrid(Array(ROWS).fill(Array(COLS).fill(false)))} className="flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200">
             <Trash2 size={18} /> Clear
          </button>
        </div>

        <div 
          className="grid gap-[1px] bg-slate-300 border border-slate-300 shadow-lg"
          style={{ gridTemplateColumns: `repeat(${COLS}, 20px)` }}
        >
          {grid.map((row, i) => 
            row.map((col, j) => (
              <div 
                key={`${i}-${j}`}
                onClick={() => toggleCell(i, j)}
                className={cn(
                  "w-5 h-5 cursor-pointer transition-colors duration-75",
                  col ? "bg-slate-900" : "bg-white hover:bg-slate-100"
                )}
              />
            ))
          )}
        </div>
      </div>
    </PageTransition>
  );
}
