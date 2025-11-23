import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Play, Keyboard } from 'lucide-react';
import PageTransition from '../../components/PageTransition';

export default function PacMan() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [win, setWin] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const CELL = 30;
  const COLS = 19;
  const ROWS = 15;
  
  // 1: Wall, 0: Dot, 2: Empty
  const MAP_TEMPLATE = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
    [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
    [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,0,1,1,1,2,1,2,1,1,1,0,1,1,1,1],
    [1,0,0,0,0,1,2,2,2,2,2,2,2,1,0,0,0,0,1], 
    [1,1,1,1,0,1,2,1,1,2,1,1,2,1,0,1,1,1,1],
    [1,0,0,0,0,0,0,1,2,2,2,1,0,0,0,0,0,0,1],
    [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
    [1,0,0,1,0,1,0,0,0,1,0,0,0,1,0,1,0,0,1],
    [1,1,0,1,0,0,0,1,0,1,0,1,0,0,0,1,0,1,1],
    [1,0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,0,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ];

  const state = useRef({
    map: [] as number[][],
    pacman: { x: 1, y: 1, dir: {x:1, y:0}, nextDir: {x:1,y:0} },
    ghosts: [
      { x: 9, y: 7, color: '#ef4444', dir: {x:0, y:0}, type: 'chase' },
      { x: 9, y: 8, color: '#f472b6', dir: {x:0, y:0}, type: 'random' }
    ],
    dotsLeft: 0,
    mouthOpen: 0,
    // 新增：幽灵移动计数器，用于控制幽灵速度低于玩家
    ghostMoveTick: -200
  });

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
       if(!isPlaying) return;
       if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
       const keyMap: any = { 'ArrowUp':{x:0,y:-1}, 'ArrowDown':{x:0,y:1}, 'ArrowLeft':{x:-1,y:0}, 'ArrowRight':{x:1,y:0} };
       if(keyMap[e.key]) state.current.pacman.nextDir = keyMap[e.key];
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isPlaying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if(!ctx) return;
    
    canvas.width = COLS * CELL;
    canvas.height = ROWS * CELL;

    let animId: number;
    let moveCounter = 0;

    const gameLoop = () => {
      if(!isPlaying) return;
      
      if (countdown === 0 && !gameOver && !win) {
          moveCounter++;
          // 修改点1：全局降速
          // 之前是 % 8，现在改为 % 12，数字越大游戏整体越慢
          if(moveCounter % 12 === 0) { 
             updateGame();
          }
      }
      draw(ctx);
      animId = requestAnimationFrame(gameLoop);
    };

    const updateGame = () => {
      const { pacman, map, ghosts } = state.current;
      state.current.ghostMoveTick++;
      
      // --- 1. Pacman (玩家) 移动逻辑 ---
      // 玩家每次 tick 都移动
      const nextNx = pacman.x + pacman.nextDir.x;
      const nextNy = pacman.y + pacman.nextDir.y;
      
      if(map[nextNy][nextNx] !== 1) {
          pacman.dir = pacman.nextDir;
      }
      
      const nx = pacman.x + pacman.dir.x;
      const ny = pacman.y + pacman.dir.y;
      
      if(map[ny][nx] !== 1) {
         pacman.x = nx;
         pacman.y = ny;
         if(map[ny][nx] === 0) {
            map[ny][nx] = 2;
            setScore(s => s + 10);
            state.current.dotsLeft--;
            if(state.current.dotsLeft <= 0) {
               setWin(true); setIsPlaying(false);
            }
         }
      }

      // --- 2. Ghost (幽灵) 移动逻辑 ---
      // 修改点2：幽灵速度控制
      // 逻辑：如果 tick 能够被 5 整除，幽灵就不动。
      // 这意味着玩家走 5 步，幽灵只走 4 步。玩家速度 > 幽灵速度。
      const shouldGhostsMove = state.current.ghostMoveTick % 5 !== 0;

      if (shouldGhostsMove) {
          ghosts.forEach(g => {
            const dirs = [{x:0,y:1}, {x:0,y:-1}, {x:1,y:0}, {x:-1,y:0}];
            let validDirs = dirs.filter(d => map[g.y + d.y][g.x + d.x] !== 1);
            
            // 禁止立即掉头
            if (validDirs.length > 1 && (g.dir.x !== 0 || g.dir.y !== 0)) {
                validDirs = validDirs.filter(d => !(d.x === -g.dir.x && d.y === -g.dir.y));
            }

            if (validDirs.length > 0) {
               let chosenDir = validDirs[0];

               if (g.type === 'chase') {
                   validDirs.sort((a, b) => {
                       const distA = Math.pow((g.x+a.x)-pacman.x, 2) + Math.pow((g.y+a.y)-pacman.y, 2);
                       const distB = Math.pow((g.x+b.x)-pacman.x, 2) + Math.pow((g.y+b.y)-pacman.y, 2);
                       return distA - distB;
                   });
                   chosenDir = validDirs[0];
               } else {
                   if (Math.random() > 0.3) {
                       chosenDir = validDirs[Math.floor(Math.random() * validDirs.length)];
                   } else {
                        validDirs.sort((a, b) => {
                           const distA = Math.pow((g.x+a.x)-pacman.x, 2) + Math.pow((g.y+a.y)-pacman.y, 2);
                           const distB = Math.pow((g.x+b.x)-pacman.x, 2) + Math.pow((g.y+b.y)-pacman.y, 2);
                           return distA - distB;
                       });
                       chosenDir = validDirs[0];
                   }
               }
               g.dir = chosenDir;
               g.x += g.dir.x;
               g.y += g.dir.y;
            }
          });
      }

      // 碰撞检测 (不管幽灵动不动，撞上就是死)
      ghosts.forEach(g => {
        if(g.x === pacman.x && g.y === pacman.y) {
            setGameOver(true); setIsPlaying(false);
         }
      });
    };

    const draw = (c: CanvasRenderingContext2D) => {
      c.fillStyle = '#000';
      c.fillRect(0, 0, canvas.width, canvas.height);

      // Map Drawing
      state.current.map.forEach((row, y) => {
        row.forEach((cell, x) => {
           if(cell === 1) {
             c.shadowBlur = 0;
             c.fillStyle = '#172554';
             c.fillRect(x*CELL, y*CELL, CELL, CELL);
             c.strokeStyle = '#3b82f6';
             c.lineWidth = 2;
             c.strokeRect(x*CELL + 4, y*CELL + 4, CELL - 8, CELL - 8);
           } else if(cell === 0) {
             c.fillStyle = '#fcd34d';
             c.beginPath(); c.arc(x*CELL + CELL/2, y*CELL + CELL/2, 3, 0, Math.PI*2); c.fill();
           }
        });
      });

      // Pacman
      const p = state.current.pacman;
      const cx = p.x*CELL + CELL/2;
      const cy = p.y*CELL + CELL/2;
      let rotation = 0;
      if (p.dir.x !== 0 || p.dir.y !== 0) {
          rotation = Math.atan2(p.dir.y, p.dir.x);
      }
      state.current.mouthOpen = Math.abs(Math.sin(Date.now() / 150)) * 0.25 * Math.PI; // 嘴巴动慢一点

      c.save();
      c.translate(cx, cy);
      c.rotate(rotation);
      c.fillStyle = '#fbbf24';
      c.beginPath(); 
      c.arc(0, 0, CELL/2 - 2, state.current.mouthOpen, 2 * Math.PI - state.current.mouthOpen); 
      c.lineTo(0, 0);
      c.fill();
      c.restore();

      // Ghosts
      state.current.ghosts.forEach(g => {
         const gx = g.x*CELL + CELL/2;
         const gy = g.y*CELL + CELL/2;
         
         c.fillStyle = g.color;
         c.beginPath(); 
         c.arc(gx, gy - 2, CELL/2 - 4, Math.PI, 0); 
         c.lineTo(gx + CELL/2 - 4, gy + 4);
         c.lineTo(gx, gy + 8);
         c.lineTo(gx - CELL/2 + 4, gy + 4);
         c.fill();

         c.fillStyle = 'white';
         c.beginPath(); c.arc(gx - 4, gy - 4, 3, 0, Math.PI*2); c.fill();
         c.beginPath(); c.arc(gx + 4, gy - 4, 3, 0, Math.PI*2); c.fill();
         c.fillStyle = 'black';
         c.beginPath(); c.arc(gx - 4 + g.dir.x*1, gy - 4 + g.dir.y*1, 1.5, 0, Math.PI*2); c.fill();
         c.beginPath(); c.arc(gx + 4 + g.dir.x*1, gy - 4 + g.dir.y*1, 1.5, 0, Math.PI*2); c.fill();
      });
    };
    
    if(isPlaying) gameLoop();
    else if (!gameOver && !win && countdown === 0) {
       draw(ctx);
    }

    return () => cancelAnimationFrame(animId);
  }, [isPlaying, countdown, gameOver, win]);

  const prepareGame = () => {
    state.current.map = MAP_TEMPLATE.map(r => [...r]);
    state.current.dotsLeft = state.current.map.flat().filter(c => c === 0).length;
    state.current.pacman = { x: 1, y: 1, dir: {x:1, y:0}, nextDir: {x:1, y:0} };
    state.current.ghosts = [
      { x: 9, y: 7, color: '#ef4444', dir: {x:0, y:0}, type: 'chase' },
      { x: 9, y: 8, color: '#f472b6', dir: {x:0, y:0}, type: 'random' }
    ];
    // 重置 tick
    state.current.ghostMoveTick = 0;
    
    setScore(0);
    setGameOver(false);
    setWin(false);
    setIsPlaying(true);
    setCountdown(3);
  };

  return (
    <PageTransition>
      <div className="flex flex-col items-center py-6 min-h-[calc(100vh-100px)] select-none">
         
         <div className="flex justify-between w-full max-w-[570px] mb-4 items-center">
            <h1 className="text-4xl font-black text-yellow-400 tracking-tighter drop-shadow-sm">PAC-MAN</h1>
            <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
               <span className="text-slate-400 text-xs font-bold uppercase mr-2">Score</span>
               <span className="text-white font-mono text-xl">{score}</span>
            </div>
         </div>

         <div className="relative bg-black p-1 rounded-xl shadow-2xl border-8 border-blue-900">
            <canvas ref={canvasRef} className="block rounded" />
            
            <AnimatePresence>
                {countdown > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20 backdrop-blur-sm">
                     <motion.div
                       key={countdown}
                       initial={{ scale: 0.5, opacity: 0 }}
                       animate={{ scale: 1.5, opacity: 1 }}
                       exit={{ scale: 2, opacity: 0 }}
                       className={`text-8xl font-black ${
                           countdown === 1 ? 'text-red-500' : 
                           countdown === 2 ? 'text-yellow-400' : 'text-blue-400'
                       }`}
                     >
                       {countdown}
                     </motion.div>
                  </div>
                )}
            </AnimatePresence>

            {!isPlaying && countdown === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 text-white z-30 backdrop-blur-sm">
                 {win ? (
                    <>
                        <Trophy className="w-20 h-20 text-yellow-400 mb-4 animate-bounce" />
                        <div className="text-yellow-400 font-black text-5xl mb-6">YOU WIN!</div>
                    </>
                 ) : gameOver ? (
                    <>
                        <div className="text-red-600 font-black text-6xl mb-2">GAME OVER</div>
                        <div className="text-slate-400 mb-8">Score: {score}</div>
                    </>
                 ) : (
                    <div className="mb-8 flex flex-col items-center">
                       <Keyboard className="w-16 h-16 text-slate-600 mb-4" />
                       <p className="text-slate-400">Use Arrow Keys to Move</p>
                    </div>
                 )}
                 
                 <button 
                    onClick={prepareGame} 
                    className="group relative px-10 py-4 bg-blue-600 rounded-full font-black text-xl hover:bg-blue-500 transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(37,99,235,0.5)] flex items-center gap-2"
                 >
                    <Play fill="currentColor" size={20}/>
                    {win || gameOver ? 'PLAY AGAIN' : 'START GAME'}
                 </button>
              </div>
            )}
         </div>
         <p className="mt-4 text-slate-500 text-sm">Tip: You move faster than ghosts!</p>
      </div>
    </PageTransition>
  );
}