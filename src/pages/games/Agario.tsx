import { useEffect, useRef, useState, useCallback } from 'react';
import { MousePointer2, Play, Pause, Crosshair } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../../components/PageTransition';

type Blob = { x: number; y: number; r: number; color: string };

export default function Agario() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false); // 游戏是否已开始（包括暂停状态）
  const [isPaused, setIsPaused] = useState(false);   // 是否处于暂停状态
  const [countdown, setCountdown] = useState(0);     // 倒计时状态

  // 虚拟鼠标位置（相对于 Canvas 左上角），因为 PointerLock 后系统鼠标位置不再更新
  const virtualMouse = useRef({ x: 400, y: 300 }); 
  
  const WORLD_SIZE = 2000;
  
  const state = useRef({
    player: { x: WORLD_SIZE/2, y: WORLD_SIZE/2, r: 20, color: '#3b82f6' },
    foods: [] as Blob[],
    camera: { x: 0, y: 0 },
    width: 800,
    height: 600
  });

  // --- 倒计时逻辑 ---
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && isPlaying && !isPaused) {
       // 倒计时结束，尝试锁定鼠标
       requestLock();
    }
  }, [countdown, isPlaying, isPaused]);

  // --- 鼠标锁定辅助函数 ---
  const requestLock = async () => {
    if (canvasRef.current) {
      try {
        await canvasRef.current.requestPointerLock();
      } catch (e) {
        console.error("Pointer lock failed", e);
      }
    }
  };

  const unlock = () => {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  };

  // --- 键盘事件 (Space 暂停) ---
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isPlaying && countdown === 0) {
        e.preventDefault();
        if (isPaused) {
          // 恢复游戏
          setIsPaused(false);
          requestLock();
        } else {
          // 暂停游戏
          setIsPaused(true);
          unlock();
        }
      }
    };

    const handleLockChange = () => {
      // 如果用户通过 ESC 退出锁定，自动暂停
      if (!document.pointerLockElement && isPlaying && countdown === 0 && !isPaused) {
        setIsPaused(true);
      }
    };

    window.addEventListener('keydown', handleKey);
    document.addEventListener('pointerlockchange', handleLockChange);
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.removeEventListener('pointerlockchange', handleLockChange);
    };
  }, [isPlaying, isPaused, countdown]);


  // --- 游戏主循环 ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    if(!ctx) return;

    canvas.width = state.current.width;
    canvas.height = state.current.height;
    
    // 重置虚拟鼠标位置到中心
    virtualMouse.current = { x: state.current.width / 2, y: state.current.height / 2 };

    // Init Food
    if (state.current.foods.length === 0) {
      for(let i=0; i<300; i++) addFood();
    }

    let animId: number;

    const loop = () => {
      // 只有在 游戏进行中、非暂停、倒计时结束 时才更新逻辑
      if(isPlaying && !isPaused && countdown === 0) {
        update();
      }
      // 始终绘制画面（暂停时显示静止画面）
      draw(ctx);
      animId = requestAnimationFrame(loop);
    };

    const update = () => {
      const p = state.current.player;
      const { width, height } = state.current;
      
      // Calculate movement vector based on Virtual Mouse relative to Center
      // 虚拟鼠标坐标 (0~800) 减去 中心点 (400)
      const dx = virtualMouse.current.x - width/2;
      const dy = virtualMouse.current.y - height/2;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      // 只有当鼠标离开中心一定距离才移动 (死区)
      if(dist > 10) {
         const speed = 4 * (20 / p.r); // 稍微加快一点基础速度
         p.x += (dx / dist) * speed;
         p.y += (dy / dist) * speed;
      }
      
      // Clamp world
      p.x = Math.max(p.r, Math.min(WORLD_SIZE - p.r, p.x));
      p.y = Math.max(p.r, Math.min(WORLD_SIZE - p.r, p.y));

      // Camera follow
      state.current.camera.x = p.x - width/2;
      state.current.camera.y = p.y - height/2;

      // Eat Food
      for(let i = state.current.foods.length - 1; i>=0; i--) {
        const f = state.current.foods[i];
        const d = Math.sqrt((f.x-p.x)**2 + (f.y-p.y)**2);
        if(d < p.r) {
           // Eat it
           const area = Math.PI * p.r * p.r + Math.PI * f.r * f.r;
           p.r = Math.sqrt(area / Math.PI);
           state.current.foods.splice(i, 1);
           addFood();
           setScore(Math.floor(p.r));
        }
      }
    };

    const draw = (c: CanvasRenderingContext2D) => {
      c.fillStyle = '#f8fafc';
      c.fillRect(0, 0, canvas.width, canvas.height);

      c.save();
      c.translate(-state.current.camera.x, -state.current.camera.y);

      // Draw Grid
      c.strokeStyle = '#e2e8f0';
      c.lineWidth = 1;
      c.beginPath();
      for(let x=0; x<=WORLD_SIZE; x+=50) { c.moveTo(x, 0); c.lineTo(x, WORLD_SIZE); }
      for(let y=0; y<=WORLD_SIZE; y+=50) { c.moveTo(0, y); c.lineTo(WORLD_SIZE, y); }
      c.stroke();

      // Draw Food
      state.current.foods.forEach(f => {
        c.fillStyle = f.color;
        c.beginPath(); c.arc(f.x, f.y, f.r, 0, Math.PI*2); c.fill();
      });

      // Draw Player
      const p = state.current.player;
      c.fillStyle = p.color;
      c.beginPath(); c.arc(p.x, p.y, p.r, 0, Math.PI*2); c.fill();
      
      // Cell Details (Shine/Glow)
      c.fillStyle = 'rgba(255,255,255,0.2)';
      c.beginPath(); c.arc(p.x - p.r*0.2, p.y - p.r*0.2, p.r*0.4, 0, Math.PI*2); c.fill();

      c.restore();

      // --- Draw Virtual Cursor (UI Overlay inside Canvas) ---
      // 只有在锁定状态下（或者游戏进行中且不暂停）才绘制准星
      if (!isPaused && countdown === 0 && isPlaying) {
          const vx = virtualMouse.current.x;
          const vy = virtualMouse.current.y;
          
          c.strokeStyle = 'rgba(0,0,0,0.2)';
          c.lineWidth = 2;
          c.beginPath();
          c.moveTo(vx - 10, vy); c.lineTo(vx + 10, vy);
          c.moveTo(vx, vy - 10); c.lineTo(vx, vy + 10);
          c.stroke();
          
          // Draw a line from center to mouse to show direction
          c.strokeStyle = 'rgba(59, 130, 246, 0.2)'; // blue-500 low opacity
          c.beginPath();
          c.moveTo(state.current.width/2, state.current.height/2);
          c.lineTo(vx, vy);
          c.stroke();
      }
    };

    if(isPlaying) {
        loop();
    }
    
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, isPaused, countdown]);

  const addFood = () => {
     const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];
     state.current.foods.push({
       x: Math.random() * WORLD_SIZE,
       y: Math.random() * WORLD_SIZE,
       r: Math.random() * 5 + 3,
       color: colors[Math.floor(Math.random() * colors.length)]
     });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    // 只有当游戏开始且鼠标锁定（或者在游戏中）时，使用 movementX/Y
    if (isPlaying && !isPaused && countdown === 0) {
        // 如果已经锁定了鼠标，使用 movementX/Y 更新虚拟位置
        if (document.pointerLockElement === canvasRef.current) {
            virtualMouse.current.x += e.movementX;
            virtualMouse.current.y += e.movementY;
            
            // 限制虚拟鼠标在画布范围内
            virtualMouse.current.x = Math.max(0, Math.min(state.current.width, virtualMouse.current.x));
            virtualMouse.current.y = Math.max(0, Math.min(state.current.height, virtualMouse.current.y));
        } else {
            // 如果没锁定（例如刚开始没锁住），为了兼容，使用 client rect
            // 但理想情况下 pointer lock 应该生效
            const rect = canvasRef.current?.getBoundingClientRect();
            if(rect) {
                virtualMouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            }
        }
    }
  };
  
  // 处理暂停后的点击恢复
  const handleCanvasClick = () => {
      if (isPlaying && isPaused) {
          setIsPaused(false);
          requestLock();
      }
  };

  const prepareGame = () => {
      // 重置状态
      setScore(0);
      state.current.player = { x: WORLD_SIZE/2, y: WORLD_SIZE/2, r: 20, color: '#3b82f6' };
      state.current.foods = [];
      for(let i=0; i<300; i++) addFood();
      
      setIsPlaying(true);
      setIsPaused(false);
      setCountdown(3); // 开始 3 秒倒计时
  };

  return (
    <PageTransition>
      <div className="flex flex-col items-center py-6 min-h-[calc(100vh-100px)] select-none">
         <div className="relative bg-slate-50 rounded-xl overflow-hidden shadow-2xl border-4 border-slate-200">
            <canvas 
              ref={canvasRef} 
              onMouseMove={handleMouseMove}
              onClick={handleCanvasClick}
              className="block touch-none" 
              style={{ maxWidth: '100%', cursor: isPlaying && !isPaused && countdown === 0 ? 'none' : 'default' }}
            />
            
            {/* Countdown Overlay */}
            <AnimatePresence>
                {countdown > 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-sm z-50">
                     <motion.div
                       key={countdown}
                       initial={{ scale: 0.5, opacity: 0 }}
                       animate={{ scale: 1.5, opacity: 1 }}
                       exit={{ scale: 2, opacity: 0 }}
                       className={`text-9xl font-black ${
                           countdown === 1 ? 'text-red-500' : 
                           countdown === 2 ? 'text-yellow-400' : 'text-blue-500'
                       }`}
                     >
                       {countdown}
                     </motion.div>
                  </div>
                )}
            </AnimatePresence>

            {/* Menu / Pause Overlay */}
            {(!isPlaying || isPaused) && countdown === 0 && (
               <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center backdrop-blur-sm z-40">
                  <h1 className="text-5xl font-black text-slate-800 mb-2 drop-shadow-sm">Agar.io Clone</h1>
                  
                  {isPaused && isPlaying ? (
                      <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                          <h2 className="text-2xl font-bold text-slate-600 mb-6 bg-white px-4 py-1 rounded-full shadow-sm">PAUSED</h2>
                          <button onClick={() => { setIsPaused(false); requestLock(); }} className="px-10 py-4 bg-blue-500 text-white rounded-full font-bold shadow-lg hover:bg-blue-600 hover:scale-105 transition-all flex items-center gap-3">
                             <Play fill="currentColor" /> Resume
                          </button>
                          <p className="mt-4 text-slate-500 text-sm">Press Space or Click to Resume</p>
                      </div>
                  ) : (
                      <div className="flex flex-col items-center">
                         <p className="mb-8 text-slate-500 font-medium">Grow your cell by eating dots!</p>
                         <button onClick={prepareGame} className="px-12 py-5 bg-blue-600 text-white rounded-full font-black text-xl shadow-xl hover:bg-blue-500 hover:scale-105 transition-all flex items-center gap-3">
                             <Play fill="currentColor" /> START GAME
                         </button>
                      </div>
                  )}
               </div>
            )}
            
            {/* Score HUD */}
            <div className="absolute top-4 left-4 bg-white/80 backdrop-blur px-4 py-2 rounded-lg font-mono font-bold text-slate-700 border border-slate-200 shadow-sm pointer-events-none">
               Size: {score}
            </div>

            {/* Instructions HUD */}
            {isPlaying && !isPaused && countdown === 0 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-400/50 text-xs font-bold pointer-events-none">
                    PRESS SPACE TO PAUSE
                </div>
            )}
         </div>
         
         <div className="mt-6 flex gap-6 text-slate-400 text-sm">
             <div className="flex items-center gap-2">
                 <div className="p-1 bg-slate-200 rounded"><MousePointer2 size={16} /></div>
                 <span>Mouse to Move</span>
             </div>
             <div className="flex items-center gap-2">
                 <div className="p-1 bg-slate-200 rounded font-mono text-xs px-2">SPACE</div>
                 <span>Pause / Menu</span>
             </div>
         </div>
      </div>
    </PageTransition>
  );
}