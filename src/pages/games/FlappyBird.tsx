import { useEffect, useRef, useState } from 'react';
import { Play, RefreshCw } from 'lucide-react';
import PageTransition from '../../components/PageTransition';
import { AnimatePresence, motion } from 'motion/react';

export default function FlappyBird() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // 1. 增加 'countdown' 状态
  const [gameStatus, setGameStatus] = useState<'start' | 'countdown' | 'playing' | 'gameover'>('start');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [count, setCount] = useState(3); // 倒计时数字

  // 2. 优化后的物理参数 (坠落更慢，手感更轻)
  const CONFIG = {
    width: 320,
    height: 480,
    gravity: 0.15,     // ⬇️ 原来是 0.25，调小让坠落变慢
    jumpStrength: -3.5,// ⬇️ 配合重力调小跳跃力度，防止飞太高
    speed: 2.5, 
    birdX: 80,  
    pipeGap: 140,      // ⬆️ 稍微加宽一点管道间隙，降低难度
    pipeWidth: 52,
    spawnRate: 110 
  };

  const state = useRef({
    birdY: 200,
    velocity: 0,
    rotation: 0,
    pipes: [] as { x: number, topHeight: number, passed: boolean }[],
    frameCount: 0,
    animationId: 0,
    floatOffset: 0 
  });

  // --- 倒计时逻辑 ---
  useEffect(() => {
    let timer: any;
    if (gameStatus === 'countdown') {
      if (count > 0) {
        timer = setTimeout(() => setCount(c => c - 1), 1000);
      } else {
        // 倒计时结束，开始游戏
        setGameStatus('playing');
        // 给一个初始向上的小力，防止直接掉下去
        state.current.velocity = CONFIG.jumpStrength; 
      }
    }
    return () => clearTimeout(timer);
  }, [gameStatus, count]);

  // --- 核心游戏循环 ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = CONFIG.width * dpr;
    canvas.height = CONFIG.height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = `${CONFIG.width}px`;
    canvas.style.height = `${CONFIG.height}px`;

    // 绘制函数 (保持不变)
    const drawBird = (y: number, rotation: number) => {
      ctx.save();
      ctx.translate(CONFIG.birdX, y);
      ctx.rotate(rotation);
      ctx.fillStyle = '#fbbf24'; 
      ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(6, -6, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(8, -6, 2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-4, 4, 6, 4, 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.ellipse(6, 4, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    };

    const drawPipe = (x: number, topHeight: number) => {
      const { pipeWidth, height, pipeGap } = CONFIG;
      const gradient = ctx.createLinearGradient(x, 0, x + pipeWidth, 0);
      gradient.addColorStop(0, '#65a30d'); gradient.addColorStop(0.5, '#84cc16'); gradient.addColorStop(1, '#4d7c0f');
      ctx.fillStyle = gradient; ctx.strokeStyle = '#365314'; ctx.lineWidth = 2;
      ctx.fillRect(x, 0, pipeWidth, topHeight); ctx.strokeRect(x, -2, pipeWidth, topHeight);
      ctx.fillRect(x - 2, topHeight - 24, pipeWidth + 4, 24); ctx.strokeRect(x - 2, topHeight - 24, pipeWidth + 4, 24);
      const bottomY = topHeight + pipeGap; const bottomH = height - bottomY - 20;
      ctx.fillRect(x, bottomY, pipeWidth, bottomH); ctx.strokeRect(x, bottomY, pipeWidth, bottomH + 2);
      ctx.fillRect(x - 2, bottomY, pipeWidth + 4, 24); ctx.strokeRect(x - 2, bottomY, pipeWidth + 4, 24);
    };

    const loop = () => {
      const s = state.current;
      s.frameCount++;

      // --- 物理更新 ---
      if (gameStatus === 'playing') {
        s.velocity += CONFIG.gravity;
        s.birdY += s.velocity;
        s.rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, (s.velocity * 0.1)));

        if (s.frameCount % CONFIG.spawnRate === 0) {
          const minPipe = 50;
          const maxPipe = CONFIG.height - CONFIG.pipeGap - minPipe - 50;
          const topHeight = Math.floor(Math.random() * (maxPipe - minPipe + 1) + minPipe);
          s.pipes.push({ x: CONFIG.width, topHeight, passed: false });
        }

        s.pipes.forEach(p => p.x -= CONFIG.speed);
        if (s.pipes.length && s.pipes[0].x < -CONFIG.pipeWidth - 10) s.pipes.shift();

        // 碰撞检测
        const birdRadius = 12;
        const hitPadding = 4;
        if (s.birdY + birdRadius >= CONFIG.height - 20 || s.birdY - birdRadius <= 0) setGameStatus('gameover');
        s.pipes.forEach(p => {
          if (CONFIG.birdX + birdRadius - hitPadding > p.x && CONFIG.birdX - birdRadius + hitPadding < p.x + CONFIG.pipeWidth) {
            if (s.birdY - birdRadius + hitPadding < p.topHeight || s.birdY + birdRadius - hitPadding > p.topHeight + CONFIG.pipeGap) {
              setGameStatus('gameover');
            }
          }
          if (p.x + CONFIG.pipeWidth < CONFIG.birdX && !p.passed) {
            p.passed = true;
            setScore(prev => prev + 1);
          }
        });
      } else {
         // 'start' 或 'countdown' 状态：悬浮动画
         s.floatOffset += 0.08;
         s.birdY = 200 + Math.sin(s.floatOffset) * 8;
         s.rotation = 0;
      }

      // --- 绘制 ---
      ctx.fillStyle = '#7dd3fc'; ctx.fillRect(0, 0, CONFIG.width, CONFIG.height);
      
      // 云朵
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.beginPath(); ctx.arc(50, 100, 30, 0, Math.PI*2); ctx.arc(90, 90, 40, 0, Math.PI*2); ctx.arc(130, 100, 30, 0, Math.PI*2); ctx.fill();
      
      s.pipes.forEach(p => drawPipe(p.x, p.topHeight));

      const groundY = CONFIG.height - 20;
      ctx.fillStyle = '#ded895'; ctx.fillRect(0, groundY, CONFIG.width, 20);
      ctx.fillStyle = '#a3e635'; ctx.fillRect(0, groundY, CONFIG.width, 4);
      
      // 条纹滚动
      const stripeOffset = (s.frameCount * CONFIG.speed) % 20;
      ctx.fillStyle = 'rgba(212, 200, 124, 0.5)';
      for(let i = -20; i < CONFIG.width; i+=20) {
         ctx.beginPath();
         const x = (gameStatus === 'gameover' || gameStatus === 'countdown' || gameStatus === 'start') ? i - stripeOffset : i - stripeOffset; 
         // 在倒计时时也让地面动起来，保持活力
         ctx.moveTo(x, CONFIG.height); ctx.lineTo(x + 10, groundY); ctx.lineTo(x + 15, groundY); ctx.lineTo(x + 5, CONFIG.height); ctx.fill();
      }

      drawBird(s.birdY, s.rotation);

      if (gameStatus !== 'gameover') {
        s.animationId = requestAnimationFrame(loop);
      }
    };

    loop();
    return () => cancelAnimationFrame(state.current.animationId);
  }, [gameStatus]);

  // --- 输入控制 ---
  const handleAction = (e?: any) => {
    if (e) { 
        e.preventDefault();
        e.stopPropagation();
    }

    if (gameStatus === 'playing') {
      state.current.velocity = CONFIG.jumpStrength;
    } else if (gameStatus === 'start') {
      triggerCountdown();
    } else if (gameStatus === 'gameover') {
      // 稍微防抖一下，防止连点直接重开
      triggerCountdown();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') handleAction(e);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus]);

  const triggerCountdown = () => {
    state.current.birdY = 200;
    state.current.velocity = 0;
    state.current.rotation = 0;
    state.current.pipes = [];
    state.current.frameCount = 0;
    setScore(0);
    setCount(3); // 重置倒计时
    setGameStatus('countdown');
  };

  return (
    <PageTransition>
      <div className="flex flex-col items-center py-10 min-h-[calc(100vh-100px)] select-none">
        <div className="relative bg-slate-800 p-3 rounded-[2.5rem] shadow-2xl border-4 border-slate-700 overflow-hidden">
           
           <canvas 
             ref={canvasRef}
             className="bg-sky-300 rounded-3xl cursor-pointer block touch-none"
             onMouseDown={handleAction}
             onTouchStart={handleAction}
           />

           {/* UI 覆盖层 */}
           {gameStatus !== 'playing' && (
             <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
               
               {/* 倒计时动画 */}
               <AnimatePresence>
                 {gameStatus === 'countdown' && (
                   <motion.div
                     key={count}
                     initial={{ scale: 0.5, opacity: 0 }}
                     animate={{ scale: 1.5, opacity: 1 }}
                     exit={{ scale: 2, opacity: 0 }}
                     transition={{ duration: 0.4 }}
                     className="absolute inset-0 flex items-center justify-center"
                   >
                     <span className="text-8xl font-black text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.3)] stroke-black stroke-2">
                       {count}
                     </span>
                   </motion.div>
                 )}
               </AnimatePresence>

               {/* Game Over UI */}
               {gameStatus === 'gameover' && (
                 <div className="absolute inset-0 bg-black/40 rounded-3xl backdrop-blur-[2px] animate-in fade-in duration-300 flex flex-col items-center justify-center pointer-events-auto">
                    <div className="relative bg-[#ded895] p-1 rounded-xl border-2 border-[#523e24] shadow-xl mb-6 animate-in zoom-in duration-300 w-64">
                        <div className="bg-[#dcd37b] border border-[#9e8c46] rounded-lg p-4 flex flex-col gap-4">
                            <h2 className="text-2xl font-black text-[#e65f2a] text-center uppercase tracking-wider drop-shadow-sm">Game Over</h2>
                            <div className="flex justify-between items-end px-2">
                               <div className="flex flex-col items-center">
                                  <span className="text-[10px] font-bold text-[#e65f2a] uppercase tracking-widest">Score</span>
                                  <span className="text-3xl font-mono font-bold text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.2)]">{score}</span>
                               </div>
                               <div className="flex flex-col items-center">
                                  <span className="text-[10px] font-bold text-[#c68c28] uppercase tracking-widest">Best</span>
                                  <span className="text-3xl font-mono font-bold text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.2)]">{Math.max(score, highScore)}</span>
                               </div>
                            </div>
                        </div>
                    </div>
                    
                    <button 
                        onClick={(e) => { e.stopPropagation(); triggerCountdown(); }}
                        className="relative group"
                    >
                        <div className="absolute inset-0 bg-white rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <div className="relative w-20 h-20 bg-[#84cc16] border-4 border-white text-white rounded-full flex items-center justify-center shadow-[0_6px_0_#4d7c0f] hover:translate-y-1 hover:shadow-[0_3px_0_#4d7c0f] active:translate-y-2 active:shadow-none transition-all">
                            <RefreshCw size={32} strokeWidth={3} />
                        </div>
                    </button>
                 </div>
               )}

               {/* Start UI */}
               {gameStatus === 'start' && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-auto">
                    <button 
                        onClick={(e) => { e.stopPropagation(); triggerCountdown(); }}
                        className="relative group mb-12"
                    >
                        <div className="absolute inset-0 bg-white rounded-full blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <div className="relative w-24 h-24 bg-[#84cc16] border-4 border-white text-white rounded-full flex items-center justify-center shadow-[0_6px_0_#4d7c0f] hover:translate-y-1 hover:shadow-[0_3px_0_#4d7c0f] active:translate-y-2 active:shadow-none transition-all">
                            <Play size={40} fill="currentColor" className="ml-2" />
                        </div>
                    </button>
                    <div className="text-white font-bold text-lg animate-bounce drop-shadow-md">
                        点击开始游戏
                    </div>
                 </div>
               )}
             </div>
           )}

           {/* 实时分数 (Playing) */}
           {gameStatus === 'playing' && (
             <div className="absolute top-10 left-0 right-0 text-center pointer-events-none z-20">
               <span className="text-6xl font-black text-white drop-shadow-[0_4px_2px_rgba(0,0,0,0.3)] stroke-2 stroke-black font-[Impact,sans-serif]">
                 {score}
               </span>
             </div>
           )}
        </div>
      </div>
    </PageTransition>
  );
}