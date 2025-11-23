
import { useState, useEffect } from 'react';
import { RefreshCw, Trophy } from 'lucide-react';
import PageTransition from '../../components/PageTransition';
import { motion } from 'motion/react';

export default function SlidingPuzzle() {
  const SIZE = 4;
  const [tiles, setTiles] = useState<number[]>([]);
  const [won, setWon] = useState(false);
  const [moves, setMoves] = useState(0);

  useEffect(() => {
    shuffle();
  }, []);

  const shuffle = () => {
    let newTiles = Array.from({ length: SIZE * SIZE }, (_, i) => i + 1);
    newTiles[SIZE * SIZE - 1] = 0; // 0 represents empty space
    
    // Shuffle until solvable
    do {
      for (let i = newTiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newTiles[i], newTiles[j]] = [newTiles[j], newTiles[i]];
      }
    } while (!isSolvable(newTiles) || isSolved(newTiles));

    setTiles(newTiles);
    setWon(false);
    setMoves(0);
  };

  // Check solvability for 15-puzzle
  const isSolvable = (arr: number[]) => {
    let invCount = 0;
    for (let i = 0; i < arr.length - 1; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[i] && arr[j] && arr[i] > arr[j]) invCount++;
      }
    }
    const emptyIdx = arr.indexOf(0);
    const emptyRowFromBottom = SIZE - Math.floor(emptyIdx / SIZE);
    
    if (SIZE % 2 !== 0) return invCount % 2 === 0;
    if (emptyRowFromBottom % 2 === 0) return invCount % 2 !== 0;
    return invCount % 2 === 0;
  };

  const isSolved = (arr: number[]) => {
    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] !== i + 1) return false;
    }
    return true;
  };

  const move = (index: number) => {
    if (won) return;
    
    const emptyIdx = tiles.indexOf(0);
    const row = Math.floor(index / SIZE);
    const col = index % SIZE;
    const emptyRow = Math.floor(emptyIdx / SIZE);
    const emptyCol = emptyIdx % SIZE;

    const isAdjacent = Math.abs(row - emptyRow) + Math.abs(col - emptyCol) === 1;

    if (isAdjacent) {
      const newTiles = [...tiles];
      [newTiles[index], newTiles[emptyIdx]] = [newTiles[emptyIdx], newTiles[index]];
      setTiles(newTiles);
      setMoves(m => m + 1);
      if (isSolved(newTiles)) setWon(true);
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col items-center py-8 min-h-[calc(100vh-100px)]">
        <div className="w-full max-w-md px-6">
          <div className="flex justify-between items-center mb-8">
             <div>
               <h1 className="text-3xl font-bold text-slate-800">15 Puzzle</h1>
               <p className="text-slate-500">Moves: {moves}</p>
             </div>
             <button onClick={shuffle} className="p-3 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
               <RefreshCw className="text-slate-600" />
             </button>
          </div>

          <div className="relative bg-amber-800 p-4 rounded-xl shadow-2xl aspect-square">
             <div className="bg-amber-900/50 w-full h-full rounded-lg grid grid-cols-4 grid-rows-4 gap-2 p-2">
                {tiles.map((num, index) => {
                  if (num === 0) return <div key="empty" />;
                  return (
                    <motion.button
                      layout
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      key={num}
                      onClick={() => move(index)}
                      className="w-full h-full bg-amber-100 rounded shadow-[0_4px_0_rgb(180,83,9)] hover:bg-white active:translate-y-1 active:shadow-none flex items-center justify-center text-2xl font-bold text-amber-900"
                    >
                      {num}
                    </motion.button>
                  );
                })}
             </div>
             
             {won && (
               <div className="absolute inset-0 z-10 bg-black/60 rounded-xl flex flex-col items-center justify-center text-white backdrop-blur-sm animate-in fade-in">
                  <Trophy size={64} className="text-yellow-400 mb-4" />
                  <h2 className="text-4xl font-bold">Solved!</h2>
                  <p className="mt-2 opacity-80">in {moves} moves</p>
                  <button onClick={shuffle} className="mt-6 px-6 py-2 bg-white text-amber-900 font-bold rounded-full">Play Again</button>
               </div>
             )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
