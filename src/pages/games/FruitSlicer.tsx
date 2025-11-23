import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Trophy, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../../components/PageTransition';

type Fruit = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  sliced: boolean;
  rotation: number;
  rotSpeed: number;
};

// 简单的粒子效果，用于切开时的汁水
type Particle = {
  x: number; y: number; vx: number; vy: number; life: number; color: string;
};

export default function FruitSlicer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [countdown, setCountdown] = useState(0); // 新增：倒计时状态

  const state = useRef({
    fruits: [] as Fruit[],
    particles: [] as Particle[], // 启用粒子系统
    trail: [] as {x: number, y: number}[],
    lastSpawn: 0,
    width: 800,
    height: 600
  });

  // --- 倒计时逻辑 ---
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(c => c - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !gameOver && !isPlaying && score === 0 && lives === 3) {
        // 倒计时结束，且不是游戏结束状态，开始游戏
        // 注意：这里加了很多判断是为了防止无限循环，只有在"刚点开始"的状态下才触发
        // 我们利用一个额外的标记或逻辑来优化：
        // 实际上我们在 startGame 设 countdown 为 3，这里监测到 0 时启动
        setIsPlaying(true);
    }
  }, [countdown, gameOver, isPlaying, score, lives]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize
    canvas.width = state.current.width;
    canvas.height = state.current.height;

    let animationId: number;

    const spawnFruit = () => {
      const x = Math.random() * (canvas.width - 140) + 70; // 稍微往中间一点，防止出生在墙里
      const colors = ['#ef4444', '#eab308', '#22c55e', '#a855f7', '#f97316']; 
      state.current.fruits.push({
        id: Date.now() + Math.random(),
        x,
        y: canvas.height + 50,
        vx: (Math.random() - 0.5) * 8, // 增加一点水平随机速度，更容易触发反弹
        vy: -(Math.random() * 5 + 11), 
        radius: 35,
        color: colors[Math.floor(Math.random() * colors.length)],
        sliced: false,
        rotation: 0,
        rotSpeed: (Math.random() - 0.5) * 0.2
      });
    };

    const update = () => {
      // 只有在游戏中且不在倒计时时才运行逻辑
      if (!isPlaying) return; 
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Background
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Spawn Logic
      if (Date.now() - state.current.lastSpawn > 1000) { 
         spawnFruit();
         state.current.lastSpawn = Date.now();
      }

      // Update Fruits
      for (let i = state.current.fruits.length - 1; i >= 0; i--) {
        const f = state.current.fruits[i];
        
        // 1. 物理位置更新
        f.x += f.vx;
        f.y += f.vy;
        f.vy += 0.15; // Gravity
        f.rotation += f.rotSpeed;

        // --- 新增：墙壁反弹逻辑 ---
        if (!f.sliced) { // 只有没切开的水果会反弹，切开的就让它掉下去
            // 左墙
            if (f.x - f.radius < 0) {
                f.x = f.radius; // 修正位置防止卡住
                f.vx *= -0.8;   // 反弹并损失一点能量
            }
            // 右墙
            if (f.x + f.radius > canvas.width) {
                f.x = canvas.width - f.radius;
                f.vx *= -0.8;
            }
        }

        // 2. 移除出界水果
        if (f.y > canvas.height + 100) {
           state.current.fruits.splice(i, 1);
           if (!f.sliced) {
             setLives(l => {
               if (l <= 1) { setIsPlaying(false); setGameOver(true); }
               return l - 1;
             });
           }
           continue;
        }

        // 3. 绘制水果
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rotation);
        
        ctx.shadowColor = 'rgba(0,0,0,0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 5;

        if (f.sliced) {
           // 绘制切开的两半 (简单的视觉 trick: 稍微分开一点)
           // 为了让效果更好，可以给两半加一点相反的分离速度，这里简单处理
           const separation = 15;
           
           // Left half
           ctx.fillStyle = f.color;
           ctx.beginPath(); ctx.arc(-separation, 0, f.radius, Math.PI, 0); ctx.fill();
           ctx.fillStyle = '#fff'; // 果肉
           ctx.beginPath(); ctx.arc(-separation, 0, f.radius * 0.8, Math.PI, 0); ctx.fill();

           // Right half
           ctx.fillStyle = f.color;
           ctx.beginPath(); ctx.arc(separation, 0, f.radius, 0, Math.PI); ctx.fill();
           ctx.fillStyle = '#fff'; // 果肉
           ctx.beginPath(); ctx.arc(separation, 0, f.radius * 0.8, 0, Math.PI); ctx.fill();
        } else {
           // Whole fruit
           ctx.fillStyle = f.color;
           ctx.beginPath(); ctx.arc(0, 0, f.radius, 0, Math.PI * 2); ctx.fill();
           // Highlight (光泽)
           ctx.fillStyle = 'rgba(255,255,255,0.3)';
           ctx.beginPath(); ctx.arc(-10, -10, f.radius * 0.3, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }

      // Draw Trail (刀光)
      if (state.current.trail.length > 1) {
          ctx.strokeStyle = '#fff';
          ctx.shadowColor = '#fff';
          ctx.shadowBlur = 10;
          ctx.lineWidth = 6;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          for (let i = 0; i < state.current.trail.length; i++) {
            const p = state.current.trail[i];
            // 越新的点越粗，模拟刀锋
            // ctx.lineWidth = (i / state.current.trail.length) * 8; 
            if (i === 0) ctx.moveTo(p.x, p.y);
            else ctx.lineTo(p.x, p.y);
          }
          ctx.stroke();
          // Fade trail
          state.current.trail.shift();
      }

      animationId = requestAnimationFrame(update);
    };

    update();
    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, lives]); // 依赖 isPlaying 来启动循环

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPlaying) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if(!rect) return;
    const x = (e.clientX - rect.left) * (state.current.width / rect.width);
    const y = (e.clientY - rect.top) * (state.current.height / rect.height);
    
    // 增加拖尾长度，手感更好
    state.current.trail.push({x, y});
    if(state.current.trail.length > 15) state.current.trail.shift();

    // Check Slicing
    state.current.fruits.forEach(f => {
      if (!f.sliced) {
        const dx = x - f.x;
        const dy = y - f.y;
        if (Math.sqrt(dx*dx + dy*dy) < f.radius) {
          f.sliced = true;
          // 切开时给一个向两侧的反冲力
          f.vx = dx * 0.05 + (Math.random() - 0.5) * 5; 
          f.vy = -2; // 稍微向上跳一下
          setScore(s => s + 1);
        }
      }
    });
  };

  const prepareGame = () => {
    state.current.fruits = [];
    state.current.trail = [];
    setScore(0);
    setLives(3);
    setGameOver(false);
    setIsPlaying(false);
    setCountdown(3); // 开始倒计时
  };

  return (
    <PageTransition>
      <div className="flex flex-col items-center py-6 min-h-[calc(100vh-100px)] select-none">
        
        {/* Title Block */}
        <div className="text-center mb-6">
           <h1 className="text-4xl font-black text-slate-800 italic tracking-tighter">
             FRUIT <span className="text-red-500">NINJA</span>
           </h1>
        </div>

        <div className="relative bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border-8 border-slate-800 max-w-3xl w-full aspect-[4/3] cursor-none">
          <canvas 
            ref={canvasRef} 
            className="w-full h-full block touch-none"
            onMouseMove={handleMouseMove}
          />
          
          {/* UI Layer: Score & Lives */}
          <div className="absolute top-6 left-6 pointer-events-none">
             <div className="text-slate-400 text-sm font-bold uppercase tracking-wider">Score</div>
             <div className="text-white font-black text-4xl drop-shadow-md">{score}</div>
          </div>
          <div className="absolute top-6 right-6 flex gap-2 pointer-events-none">
             {Array(3).fill(0).map((_, i) => (
               <div 
                 key={i} 
                 className={`w-8 h-8 rounded-full border-2 border-slate-800 transition-colors duration-300 ${
                   i < lives ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.6)]' : 'bg-slate-700'
                 }`} 
               />
             ))}
          </div>

          {/* Countdown Overlay */}
          <AnimatePresence>
            {countdown > 0 && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] z-20 pointer-events-none">
                 <motion.div
                   key={countdown}
                   initial={{ scale: 0.5, opacity: 0 }}
                   animate={{ scale: 1.5, opacity: 1 }}
                   exit={{ scale: 2, opacity: 0 }}
                   transition={{ duration: 0.5, type: 'spring' }}
                   className={`text-9xl font-black italic drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] ${
                     countdown === 1 ? 'text-red-500' : 
                     countdown === 2 ? 'text-yellow-400' : 'text-green-400'
                   }`}
                 >
                   {countdown}
                 </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Game Over / Start Menu */}
          {(!isPlaying && countdown === 0) && (
            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white backdrop-blur-sm z-30">
              {gameOver ? (
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center"
                >
                  <Trophy className="w-24 h-24 text-yellow-400 mx-auto mb-4 drop-shadow-lg" />
                  <h2 className="text-5xl font-black mb-2 italic">GAME OVER</h2>
                  <p className="text-2xl mb-8 text-slate-300">Final Score: <span className="text-white font-bold">{score}</span></p>
                  <button 
                    onClick={prepareGame} 
                    className="px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-2 mx-auto shadow-xl"
                  >
                    <RefreshCw size={24} /> Try Again
                  </button>
                </motion.div>
              ) : (
                <motion.button 
                  initial={{ scale: 0.9, opacity: 0 }} 
                  animate={{ scale: 1, opacity: 1 }}
                  onClick={prepareGame} 
                  className="group relative px-12 py-5 bg-red-600 text-white rounded-full font-black text-3xl hover:bg-red-500 transition-all shadow-[0_0_30px_rgba(220,38,38,0.6)] hover:shadow-[0_0_50px_rgba(220,38,38,0.8)] hover:-translate-y-1 active:scale-95 flex items-center gap-3 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-3"><Play fill="currentColor" /> START GAME</span>
                  {/* Shiny effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shine" />
                </motion.button>
              )}
            </div>
          )}
        </div>
        
        <p className="mt-6 text-slate-400 flex items-center gap-2">
          <span className="bg-slate-200 text-slate-600 px-2 py-1 rounded text-xs font-bold">TIP</span>
          Move mouse quickly to slice! Bounce fruits off walls!
        </p>
      </div>
    </PageTransition>
  );
}