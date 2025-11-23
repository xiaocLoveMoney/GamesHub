
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw, Trophy } from 'lucide-react';
import PageTransition from '../../components/PageTransition';
import { cn } from '../../lib/utils';

type Player = 'X' | 'O';
type SquareValue = Player | null;

export default function TicTacToe() {
  const [squares, setSquares] = useState<SquareValue[]>(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [winner, setWinner] = useState<Player | null>(null);
  const [winningLine, setWinningLine] = useState<number[] | null>(null);

  const calculateWinner = (squares: SquareValue[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // 横向
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // 纵向
      [0, 4, 8], [2, 4, 6]             // 斜向
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: lines[i] };
      }
    }
    return null;
  };

  const handleClick = (i: number) => {
    if (squares[i] || winner) return;
    
    const nextSquares = squares.slice();
    nextSquares[i] = xIsNext ? 'X' : 'O';
    setSquares(nextSquares);
    setXIsNext(!xIsNext);

    const result = calculateWinner(nextSquares);
    if (result) {
      setWinner(result.winner as Player);
      setWinningLine(result.line);
    } else if (!nextSquares.includes(null)) {
      // 平局逻辑可在此扩展
    }
  };

  const resetGame = () => {
    setSquares(Array(9).fill(null));
    setXIsNext(true);
    setWinner(null);
    setWinningLine(null);
  };

  const status = winner 
    ? `获胜者: ${winner}` 
    : squares.every(Boolean) 
      ? '平局' 
      : `下一步: ${xIsNext ? 'X' : 'O'}`;

  return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 max-w-md w-full text-center">
          
          <div className="flex items-center justify-between mb-8">
             <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
               <span className="bg-indigo-100 text-indigo-600 p-2 rounded-lg">#</span> 井字棋
             </h2>
             <div className="text-sm font-medium px-4 py-1.5 bg-slate-100 rounded-full text-slate-600">
               {status}
             </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-8 mx-auto w-fit">
            {squares.map((square, i) => (
              <Square 
                key={i} 
                value={square} 
                onClick={() => handleClick(i)} 
                isWinningSquare={winningLine?.includes(i)}
              />
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={resetGame}
            className="flex items-center justify-center gap-2 w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors"
          >
            <RefreshCw size={18} /> 重新开始
          </motion.button>

          {winner && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-yellow-50 text-yellow-700 rounded-xl flex items-center justify-center gap-2"
            >
              <Trophy size={20} /> 恭喜 {winner} 赢得胜利！
            </motion.div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

function Square({ value, onClick, isWinningSquare }: { value: SquareValue, onClick: () => void, isWinningSquare?: boolean }) {
  return (
    <motion.button
      className={cn(
        "w-20 h-20 sm:w-24 sm:h-24 text-4xl sm:text-5xl font-bold rounded-2xl flex items-center justify-center transition-colors",
        isWinningSquare ? "bg-green-400 text-white shadow-lg shadow-green-200" : "bg-slate-50 hover:bg-slate-100 text-slate-700"
      )}
      onClick={onClick}
      whileHover={{ scale: !value ? 0.98 : 1 }}
      whileTap={{ scale: 0.95 }}
    >
      <AnimatePresence>
        {value && (
          <motion.span
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            className={value === 'X' ? 'text-indigo-500' : isWinningSquare ? 'text-white' : 'text-rose-500'}
          >
            {value}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
