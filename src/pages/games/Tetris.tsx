import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, ArrowDown, RotateCw, RefreshCw, Play, Pause, Keyboard, Command } from 'lucide-react';
import PageTransition from '../../components/PageTransition';
import { cn } from '../../lib/utils';

// --- 常量定义 ---
const ROWS = 20;
const COLS = 10;
const CELL_SIZE = 24; // px
const ANIMATION_DELAY = 300; // 消除等待时间 ms

const TETROMINOS = {
  I: { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], color: 'bg-cyan-400' },
  J: { shape: [[1,0,0],[1,1,1],[0,0,0]], color: 'bg-blue-500' },
  L: { shape: [[0,0,1],[1,1,1],[0,0,0]], color: 'bg-orange-500' },
  O: { shape: [[1,1],[1,1]], color: 'bg-yellow-400' },
  S: { shape: [[0,1,1],[1,1,0],[0,0,0]], color: 'bg-green-500' },
  T: { shape: [[0,1,0],[1,1,1],[0,0,0]], color: 'bg-purple-500' },
  Z: { shape: [[1,1,0],[0,1,1],[0,0,0]], color: 'bg-red-500' }
};

type TetrominoKey = keyof typeof TETROMINOS;

// 粒子类型
type Particle = {
  id: string;
  x: number;
  y: number;
  color: string;
  vx: number;
  vy: number;
};

// 网格单元类型 (增加 ID 以支持 layout 动画)
type GridCell = {
  id: string; // 唯一 ID，这是实现下落动画的关键
  color: string;
} | null;

export default function Tetris() {
  const [grid, setGrid] = useState<GridCell[][]>(createGrid());
  const [activePiece, setActivePiece] = useState<any>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isClearing, setIsClearing] = useState(false); // 是否正在播放消除动画
  const [particles, setParticles] = useState<Particle[]>([]);

  // 用于生成唯一ID
  const cellIdCounter = useRef(0);
  const getNextId = () => {
    cellIdCounter.current += 1;
    return `cell-${cellIdCounter.current}`;
  };
  
  function createGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  const spawnPiece = useCallback(() => {
    const keys = Object.keys(TETROMINOS) as TetrominoKey[];
    const randKey = keys[Math.floor(Math.random() * keys.length)];
    const piece = TETROMINOS[randKey];
    setActivePiece({ ...piece, type: randKey });
    setPos({ x: Math.floor(COLS / 2) - Math.floor(piece.shape[0].length / 2), y: 0 });
    
    // 生成时碰撞检测
    if (checkCollision(piece.shape, Math.floor(COLS / 2) - Math.floor(piece.shape[0].length / 2), 0, grid)) {
       setGameOver(true);
    }
  }, [grid]); // 注意这里依赖 grid

  useEffect(() => {
    if (!activePiece && !gameOver && !isClearing) spawnPiece();
  }, [activePiece, gameOver, isClearing, spawnPiece]);

  const checkCollision = (shape: number[][], x: number, y: number, currentGrid: GridCell[][]) => {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c] !== 0) {
          const newX = x + c;
          const newY = y + r;
          if (newX < 0 || newX >= COLS || newY >= ROWS || (newY >= 0 && currentGrid[newY][newX])) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const move = (dx: number, dy: number) => {
    if (gameOver || isPaused || !activePiece || isClearing) return;
    if (!checkCollision(activePiece.shape, pos.x + dx, pos.y + dy, grid)) {
      setPos(p => ({ x: p.x + dx, y: p.y + dy }));
      return true;
    } else if (dy > 0) {
      lockPiece();
      return false;
    }
    return false;
  };

  const rotate = () => {
    if (gameOver || isPaused || !activePiece || isClearing) return;
    const rotated = activePiece.shape[0].map((_: any, idx: number) => 
      activePiece.shape.map((row: any) => row[idx]).reverse()
    );
    if (!checkCollision(rotated, pos.x, pos.y, grid)) {
      setActivePiece({ ...activePiece, shape: rotated });
    }
  };

  // 生成爆炸粒子
  const createExplosion = (rowIdx: number, colorMap: string[]) => {
    const newParticles: Particle[] = [];
    for (let c = 0; c < COLS; c++) {
      // 每个格子生成 2-3 个碎片
      const count = 2 + Math.floor(Math.random() * 2);
      for(let i=0; i<count; i++) {
        newParticles.push({
          id: Math.random().toString(36),
          x: c * CELL_SIZE + Math.random() * CELL_SIZE, // 像素坐标 X
          y: rowIdx * CELL_SIZE + Math.random() * CELL_SIZE, // 像素坐标 Y
          color: colorMap[c] || 'bg-white',
          vx: (Math.random() - 0.5) * 10, // 随机横向速度
          vy: (Math.random() - 1) * 10 - 5, // 向上喷射的速度
        });
      }
    }
    setParticles(prev => [...prev, ...newParticles]);
    
    // 自动清理粒子
    setTimeout(() => {
      setParticles([]);
    }, 1000);
  };

  const lockPiece = () => {
    // 1. 将当前活动的 Piece 写入临时 Grid
    const newGrid = grid.map(r => [...r]);
    activePiece.shape.forEach((row: any, r: number) => {
      row.forEach((val: number, c: number) => {
        if (val !== 0) {
          const ny = pos.y + r;
          const nx = pos.x + c;
          if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS) {
            // 重要：这里赋予每个固定的方块一个唯一的 ID
            newGrid[ny][nx] = { 
              color: activePiece.color, 
              id: getNextId() 
            };
          }
        }
      });
    });

    // 2. 检测满行
    const fullRowsIndices: number[] = [];
    const fullRowsColors: string[][] = []; // 记录颜色用于粒子
    
    newGrid.forEach((row, r) => {
      if (row.every(cell => cell !== null)) {
        fullRowsIndices.push(r);
        fullRowsColors.push(row.map(cell => cell!.color));
      }
    });

    if (fullRowsIndices.length > 0) {
      // --- 有消除发生 ---
      setIsClearing(true);
      setGrid(newGrid); // 先更新显示锁定的方块
      setActivePiece(null); // 隐藏当前活动方块

      // 生成粒子效果
      fullRowsIndices.forEach((rowIndex, i) => {
         createExplosion(rowIndex, fullRowsColors[i]);
      });

      // 延迟后执行实际的消除和下落
      setTimeout(() => {
        const cleanedGrid = newGrid.filter((_, index) => !fullRowsIndices.includes(index));
        // 补齐顶部的空行
        const emptyRows = Array.from({ length: fullRowsIndices.length }, () => 
          Array(COLS).fill(null)
        );
        
        setScore(s => s + fullRowsIndices.length * 100 * (fullRowsIndices.length === 4 ? 2 : 1));
        setGrid([...emptyRows, ...cleanedGrid]);
        setIsClearing(false);
      }, ANIMATION_DELAY); // 等待动画

    } else {
      // --- 无消除，正常继续 ---
      setGrid(newGrid);
      setActivePiece(null);
    }
  };

  // Game Loop
  useEffect(() => {
    if (gameOver || isPaused || isClearing) return;
    const interval = setInterval(() => {
      move(0, 1);
    }, 800);
    return () => clearInterval(interval);
  }, [pos, activePiece, gameOver, isPaused, isClearing]);

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
       if(gameOver || isClearing) return;
       // 阻止默认的方向键滚动行为
       if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
         e.preventDefault();
       }

       if(e.key === 'ArrowLeft') move(-1, 0);
       if(e.key === 'ArrowRight') move(1, 0);
       if(e.key === 'ArrowDown') move(0, 1);
       if(e.key === 'ArrowUp') rotate();
       if(e.key === ' ') isPaused ? setIsPaused(false) : setIsPaused(true);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [pos, activePiece, gameOver, isPaused, isClearing]);

  const restart = () => {
    setGrid(createGrid());
    setScore(0);
    setGameOver(false);
    setIsPaused(false);
    setActivePiece(null);
    setParticles([]);
  };

  return (
    <PageTransition>
      <div className="flex flex-col items-center py-8 min-h-[calc(100vh-100px)] bg-slate-50 select-none">
        
        <h1 className="text-4xl font-black text-slate-800 mb-8 tracking-tight">TETRIS <span className="text-blue-500">REMIX</span></h1>

        <div className="flex flex-col md:flex-row gap-8 items-start">
           
           {/* Left Column: Game Board */}
           <div className="relative bg-slate-900 p-3 rounded-xl border-4 border-slate-700 shadow-2xl">
              
              {/* Main Grid Container */}
              <div 
                 className="relative grid bg-slate-800/50"
                 style={{ 
                   gridTemplateColumns: `repeat(${COLS}, ${CELL_SIZE}px)`, 
                   gridTemplateRows: `repeat(${ROWS}, ${CELL_SIZE}px)`,
                   gap: '1px' 
                 }}
              >
                 {/* 1. 渲染固定的网格 (使用 AnimatePresence 实现下落动画) */}
                 {/* 我们不直接用 map index 渲染，而是把 grid 打平成列表，为了给每个块唯一的 layoutId */}
                 {grid.flatMap((row, r) => 
                    row.map((cell, c) => {
                      if (!cell) return <div key={`empty-${r}-${c}`} className="w-full h-full bg-slate-900/30" />;
                      
                      return (
                        <motion.div
                          layout // 开启布局动画：这就实现了“消除后其余方块平滑下落”的效果！
                          layoutId={cell.id} // 必须有唯一 ID
                          key={cell.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          className={cn("w-full h-full rounded-sm shadow-inner", cell.color)}
                        />
                      );
                    })
                 )}

                 {/* 2. 渲染当前活动的方块 (覆盖在网格之上) */}
                 {activePiece && !isClearing && activePiece.shape.map((row: any, r: number) => 
                    row.map((val: number, c: number) => {
                      if (val === 0) return null;
                      const absX = (pos.x + c) * (CELL_SIZE + 1); // +1 是因为有 gap
                      const absY = (pos.y + r) * (CELL_SIZE + 1);
                      return (
                         <div 
                           key={`active-${r}-${c}`}
                           className={cn("absolute w-[24px] h-[24px] rounded-sm shadow-lg border border-white/20 z-10", activePiece.color)}
                           style={{ left: absX, top: absY }}
                         />
                      )
                    })
                 )}

                 {/* 3. 粒子特效层 */}
                 <AnimatePresence>
                   {particles.map((p) => (
                     <motion.div
                       key={p.id}
                       initial={{ x: p.x, y: p.y, opacity: 1, scale: 1, rotate: 0 }}
                       animate={{ 
                         x: p.x + p.vx * 20, 
                         y: p.y + p.vy * 20 + 200, // 加上重力掉落
                         opacity: 0, 
                         scale: 0, 
                         rotate: Math.random() * 360 
                       }}
                       transition={{ duration: 0.8, ease: "easeOut" }}
                       className={cn("absolute w-3 h-3 rounded-full z-50 pointer-events-none", p.color)}
                     />
                   ))}
                 </AnimatePresence>
              </div>

              {/* Overlays */}
              {gameOver && (
                 <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center text-white rounded-lg z-50">
                    <h2 className="text-4xl font-bold mb-2">GAME OVER</h2>
                    <p className="mb-6 text-slate-400">Final Score: <span className="text-white font-mono text-xl">{score}</span></p>
                    <button onClick={restart} className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-blue-500/30">
                      <RefreshCw size={20} /> Try Again
                    </button>
                 </div>
              )}
              {isPaused && !gameOver && (
                 <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center text-white z-50">
                    <div className="bg-slate-800 p-6 rounded-2xl shadow-2xl border border-slate-700 flex flex-col items-center">
                        <Pause size={48} className="text-blue-400 mb-2" />
                        <h2 className="text-2xl font-bold">PAUSED</h2>
                        <p className="text-sm text-slate-400 mt-2">Press SPACE to resume</p>
                    </div>
                 </div>
              )}
           </div>

           {/* Right Column: Info & Controls */}
           <div className="flex flex-col gap-6 w-full max-w-[280px]">
              
              {/* Score Card */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                 <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Score</span>
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                 </div>
                 <div className="text-4xl font-mono font-bold text-slate-800">{score.toLocaleString()}</div>
              </div>

              {/* Controls Hint Panel (新增部分) */}
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                 <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                    <Keyboard size={16} /> Controls
                 </h3>
                 <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm text-slate-600">
                       <span className="flex items-center gap-2"><ArrowLeft size={16} className="text-slate-400"/> Move Left</span>
                       <kbd className="px-2 py-1 bg-slate-100 rounded border border-slate-300 font-mono text-xs text-slate-500">←</kbd>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-600">
                       <span className="flex items-center gap-2"><ArrowRight size={16} className="text-slate-400"/> Move Right</span>
                       <kbd className="px-2 py-1 bg-slate-100 rounded border border-slate-300 font-mono text-xs text-slate-500">→</kbd>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-600">
                       <span className="flex items-center gap-2"><RotateCw size={16} className="text-slate-400"/> Rotate</span>
                       <kbd className="px-2 py-1 bg-slate-100 rounded border border-slate-300 font-mono text-xs text-slate-500">↑</kbd>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-600">
                       <span className="flex items-center gap-2"><ArrowDown size={16} className="text-slate-400"/> Soft Drop</span>
                       <kbd className="px-2 py-1 bg-slate-100 rounded border border-slate-300 font-mono text-xs text-slate-500">↓</kbd>
                    </div>
                    <div className="flex items-center justify-between text-sm text-slate-600 border-t pt-2 mt-2">
                       <span className="flex items-center gap-2"><Pause size={16} className="text-slate-400"/> Pause / Resume</span>
                       <kbd className="px-2 py-1 bg-slate-100 rounded border border-slate-300 font-mono text-xs text-slate-500">Space</kbd>
                    </div>
                 </div>
              </div>

              {/* Game Actions */}
              <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => setIsPaused(!isPaused)} className="p-4 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 font-semibold">
                    {isPaused ? <Play size={20} /> : <Pause size={20} />}
                    {isPaused ? "Resume" : "Pause"}
                 </button>
                 <button onClick={restart} className="p-4 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 font-semibold">
                    <RefreshCw size={20} /> Reset
                 </button>
              </div>

              {/* Mobile Virtual Keys (Visible only on small screens) */}
              <div className="grid grid-cols-3 gap-2 mt-4 sm:hidden">
                 <div />
                 <button onClick={rotate} className="p-4 bg-slate-200 rounded-xl active:bg-slate-300 flex justify-center shadow-sm"><RotateCw size={24}/></button>
                 <div />
                 <button onClick={() => move(-1,0)} className="p-4 bg-slate-200 rounded-xl active:bg-slate-300 flex justify-center shadow-sm"><ArrowLeft size={24}/></button>
                 <button onClick={() => move(0,1)} className="p-4 bg-slate-200 rounded-xl active:bg-slate-300 flex justify-center shadow-sm"><ArrowDown size={24}/></button>
                 <button onClick={() => move(1,0)} className="p-4 bg-slate-200 rounded-xl active:bg-slate-300 flex justify-center shadow-sm"><ArrowRight size={24}/></button>
              </div>
           </div>
        </div>
      </div>
    </PageTransition>
  );
}