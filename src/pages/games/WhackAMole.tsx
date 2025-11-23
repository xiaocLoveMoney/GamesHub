
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RefreshCw, Gavel } from 'lucide-react';
import PageTransition from '../../components/PageTransition';
import { cn } from '../../lib/utils';

export default function WhackAMole() {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeMoles, setActiveMoles] = useState<number[]>([]);

  // 使用 Refs 来打破闭包限制，确保在定时器中能访问最新值
  const stateRef = useRef({
    isPlaying: false,
    score: 0,
    activeMoles: [] as number[]
  });

  // 同步状态到 Ref
  useEffect(() => {
    stateRef.current.isPlaying = isPlaying;
    stateRef.current.score = score;
    stateRef.current.activeMoles = activeMoles;
  }, [isPlaying, score, activeMoles]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const spawnTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startGame = () => {
    if (isPlaying) return;
    setScore(0);
    setTimeLeft(30);
    setActiveMoles([]);
    setIsPlaying(true);
  };

  const pauseGame = () => {
    setIsPlaying(false);
    cleanupTimers();
  };

  const resetGame = () => {
    setIsPlaying(false);
    setScore(0);
    setTimeLeft(30);
    setActiveMoles([]);
    cleanupTimers();
  };

  const cleanupTimers = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
  };

  // 游戏主循环
  useEffect(() => {
    if (!isPlaying) return;

    // 倒计时逻辑
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsPlaying(false);
          cleanupTimers();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 地鼠生成循环 (递归 setTimeout)
    const gameLoop = () => {
      if (!stateRef.current.isPlaying) return;

      const { score, activeMoles } = stateRef.current;

      // 计算生成间隔：分数越高，生成越快 (最低 400ms)
      const spawnInterval = Math.max(400, 1000 - score * 30);
      
      // 计算停留时间：分数越高，消失越快 (最低 500ms)
      const stayDuration = Math.max(500, 1200 - score * 40);

      // 尝试生成地鼠
      const holeIndex = Math.floor(Math.random() * 9);
      
      if (!activeMoles.includes(holeIndex)) {
        setActiveMoles(prev => [...prev, holeIndex]);

        // 设定该地鼠的消失定时器
        setTimeout(() => {
          // 仅当游戏仍在进行时移除
          if (stateRef.current.isPlaying) {
             setActiveMoles(prev => prev.filter(id => id !== holeIndex));
          }
        }, stayDuration);
      }

      // 安排下一次生成
      spawnTimerRef.current = setTimeout(gameLoop, spawnInterval);
    };

    // 启动循环
    gameLoop();

    return () => cleanupTimers();
  }, [isPlaying]);

  const whack = (index: number) => {
    if (!activeMoles.includes(index) || !isPlaying) return;
    
    // 击中逻辑
    setScore(prev => prev + 1);
    setActiveMoles(prev => prev.filter(id => id !== index));
  };

  return (
    <PageTransition>
      <div className="flex flex-col items-center min-h-[calc(100vh-100px)] py-6">
         <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden p-6">
            <div className="flex items-center justify-between mb-6">
               <div>
                 <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                    <span className="p-1.5 bg-orange-100 text-orange-600 rounded-lg"><Gavel size={20}/></span>
                    打地鼠
                 </h2>
                 <p className="text-sm text-slate-400">反应力挑战</p>
               </div>
               <div className="text-right">
                  <div className="text-3xl font-mono font-bold text-slate-800">{score}</div>
                  <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">得分</div>
               </div>
            </div>

            {/* 游戏区 */}
            <div className="grid grid-cols-3 gap-4 mb-8 bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50 cursor-crosshair select-none">
               {Array(9).fill(0).map((_, i) => (
                  <div key={i} className="relative aspect-square bg-amber-200/40 rounded-full shadow-inner overflow-hidden border-b-4 border-amber-200/60">
                     {/* 洞穴阴影 */}
                     <div className="absolute top-2 inset-x-2 h-1/2 bg-black/5 rounded-full blur-sm" />
                     
                     <AnimatePresence>
                        {activeMoles.includes(i) && (
                           <motion.button
                              initial={{ y: '100%' }}
                              animate={{ y: '10%' }}
                              exit={{ y: '100%' }}
                              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                              className="absolute inset-x-2 bottom-0 top-2 outline-none group touch-manipulation"
                              onPointerDown={() => whack(i)}
                           >
                              {/* 地鼠身体 */}
                              <div className="w-full h-full bg-[#8d6e63] rounded-t-full relative border-2 border-[#795548] shadow-lg flex flex-col items-center justify-center">
                                 {/* 眼睛 */}
                                 <div className="flex gap-3 -mt-2">
                                    <div className="w-3 h-3 bg-black rounded-full animate-blink" />
                                    <div className="w-3 h-3 bg-black rounded-full animate-blink" />
                                 </div>
                                 {/* 鼻子 */}
                                 <div className="w-4 h-3 bg-pink-300 rounded-full mt-1" />
                                 {/* 牙齿 */}
                                 <div className="w-3 h-2 bg-white rounded-b-sm mt-1" />
                                 
                                 {/* 被击中反馈 (仅视觉) */}
                                 <div className="absolute inset-0 bg-white/0 active:bg-white/40 transition-colors rounded-t-full" />
                              </div>
                           </motion.button>
                        )}
                     </AnimatePresence>
                  </div>
               ))}</div>

            {/* 控制栏 */}
            <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl">
               <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full animate-pulse", isPlaying ? "bg-green-500" : "bg-red-500")} />
                  <span className="text-sm font-medium text-slate-600">
                     {isPlaying ? `剩余时间: ${timeLeft}s` : timeLeft === 0 ? "时间到!" : "准备就绪"}
                  </span>
               </div>
               
               <div className="flex gap-2">
                  {!isPlaying ? (
                     <button 
                        onClick={startGame}
                        className="p-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
                     >
                        <Play size={20} fill="currentColor" />
                     </button>
                  ) : (
                     <button 
                        onClick={pauseGame}
                        className="p-3 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 transition-colors"
                     >
                        <Pause size={20} fill="currentColor" />
                     </button>
                  )}
                  <button 
                     onClick={resetGame}
                     className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                     <RefreshCw size={20} />
                  </button>
               </div>
            </div>
         </div>
      </div>
    </PageTransition>
  );
}
