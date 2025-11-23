
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { Play, RefreshCw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import PageTransition from '../../components/PageTransition';
import { cn } from '../../lib/utils';

// 游戏配置
const GRID_SIZE = 20;
const INITIAL_SPEED = 150;

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export default function Snake() {
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('UP');
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  // 使用 Ref 存储当前方向，防止在一次 Tick 内多次快速按键导致的反向自杀
  const directionRef = useRef<Direction>('UP');
  
  // 游戏主循环定时器
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 初始化/重置
  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }]);
    setFood(generateFood());
    setDirection('UP');
    directionRef.current = 'UP';
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
  };

  const generateFood = (): Point => {
    return {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  };

  // 处理键盘输入
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      
      switch (e.key) {
        case 'ArrowUp': changeDirection('UP'); break;
        case 'ArrowDown': changeDirection('DOWN'); break;
        case 'ArrowLeft': changeDirection('LEFT'); break;
        case 'ArrowRight': changeDirection('RIGHT'); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  const changeDirection = (newDir: Direction) => {
    const currentDir = directionRef.current;
    // 禁止直接掉头
    if (newDir === 'UP' && currentDir === 'DOWN') return;
    if (newDir === 'DOWN' && currentDir === 'UP') return;
    if (newDir === 'LEFT' && currentDir === 'RIGHT') return;
    if (newDir === 'RIGHT' && currentDir === 'LEFT') return;

    // 更新 Ref (用于逻辑判断) 和 State (用于UI显示)
    directionRef.current = newDir;
    setDirection(newDir);
  };

  // 游戏循环逻辑
  const moveSnake = useCallback(() => {
    setSnake((prevSnake) => {
      const head = { ...prevSnake[0] };
      const currentDir = directionRef.current; // 读取最新方向

      if (currentDir === 'UP') head.y -= 1;
      if (currentDir === 'DOWN') head.y += 1;
      if (currentDir === 'LEFT') head.x -= 1;
      if (currentDir === 'RIGHT') head.x += 1;

      // 1. 检查撞墙
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameOver(true);
        setIsPlaying(false);
        return prevSnake;
      }

      // 2. 检查撞自己
      if (prevSnake.some(segment => segment.x === head.x && segment.y === head.y)) {
        setGameOver(true);
        setIsPlaying(false);
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];

      // 3. 检查吃食物
      // 注意：这里不能直接读取 state 中的 food，因为闭包问题。
      // 我们可以检查 head 是否与当前组件渲染时的 food 重合吗？
      // 在 setState 内部读取外部 state 是不安全的。
      // 修正策略：将 food 检查放在外部 effect，或使用 ref 存储 food。
      // 为简化，这里我们检查是否撞击到了 DOM 上显示的坐标? 不行。
      // 既然无法在 setSnake 内部可靠获取 food，我们把 food 逻辑移到 effect 也可以，
      // 但为了同步性，我们使用函数式更新的一个变通：在这里假设没吃到，
      // 然后在 useEffect 里检测 head 和 food 的碰撞来决定是否需要“长出来”或生成新食物。
      
      // 实际上，最好的办法是把 moveSnake 整个逻辑放在 useEffect 里，不使用 useCallback 依赖。
      return newSnake; // 暂时返回增长后的蛇
    });
  }, []);

  // 真正的游戏循环 Effect
  useEffect(() => {
    if (!isPlaying) return;

    const tick = () => {
      setSnake(prevSnake => {
        const head = { ...prevSnake[0] };
        const currentDir = directionRef.current;

        if (currentDir === 'UP') head.y -= 1;
        if (currentDir === 'DOWN') head.y += 1;
        if (currentDir === 'LEFT') head.x -= 1;
        if (currentDir === 'RIGHT') head.x += 1;

        // 撞墙
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setGameOver(true);
          setIsPlaying(false);
          return prevSnake;
        }

        // 撞自己
        // 尾巴即将移走，所以只需检查前 n-1 个
        // 但因为我们还没有 pop，所以检查整个 prevSnake
        if (prevSnake.some(s => s.x === head.x && s.y === head.y)) {
          setGameOver(true);
          setIsPlaying(false);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];
        
        // 检查食物 (利用 setState 的回调获取最新 food 比较困难，这里利用闭包里的 food)
        // 这是一个经典的 hook 陷阱。
        // 解决方案：利用 Ref 存储 Food
        if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
           // 吃到食物：不移除尾巴，生成新食物
           setScore(s => s + 1);
           const newFood = generateFood();
           setFood(newFood);
           foodRef.current = newFood; // 更新 Ref
        } else {
           // 没吃到：移除尾巴
           newSnake.pop();
        }
        
        return newSnake;
      });
    };

    timerRef.current = setInterval(tick, Math.max(50, INITIAL_SPEED - score * 2));
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, score]); // 依赖 score 是为了加速，依赖 isPlaying 启动停止

  // Food Ref 用于在 interval 中同步读取
  const foodRef = useRef(food);
  useEffect(() => { foodRef.current = food; }, [food]);


  return (
    <PageTransition>
      <div className="flex flex-col items-center py-6 min-h-[calc(100vh-100px)]">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 w-full max-w-md">
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span className="p-1.5 bg-green-100 text-green-600 rounded-lg text-lg">🐍</span> 贪吃蛇
            </h2>
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full">
              <Trophy size={16} className="text-amber-500" />
              <span className="font-mono font-bold text-slate-700">{score}</span>
            </div>
          </div>

          {/* 游戏区域 */}
          <div 
            className="relative bg-slate-900 rounded-xl overflow-hidden shadow-inner mx-auto aspect-square w-full max-w-[360px] border-4 border-slate-800"
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)`,
              gridTemplateRows: `repeat(${GRID_SIZE}, 1fr)`
            }}
          >
            {/* 遮罩层：游戏结束 */}
            {gameOver && (
              <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center text-white animate-in fade-in">
                <div className="text-4xl mb-2">💀</div>
                <h3 className="text-xl font-bold mb-4">游戏结束</h3>
                <button 
                  onClick={resetGame}
                  className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full font-medium transition-colors flex items-center gap-2"
                >
                  <RefreshCw size={18} /> 再试一次
                </button>
              </div>
            )}

            {/* 遮罩层：未开始 */}
            {!isPlaying && !gameOver && (
              <div className="absolute inset-0 z-20 bg-black/40 flex items-center justify-center">
                <button 
                  onClick={resetGame}
                  className="w-16 h-16 bg-green-500 hover:bg-green-400 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
                >
                  <Play size={32} fill="currentColor" className="ml-1"/>
                </button>
              </div>
            )}

            {/* 蛇 */}
            {snake.map((segment, index) => {
              const isHead = index === 0;
              return (
                <div
                  key={`${segment.x}-${segment.y}-${index}`}
                  className={cn(
                    "relative",
                    isHead ? "z-10" : "z-0"
                  )}
                  style={{
                    gridColumn: segment.x + 1,
                    gridRow: segment.y + 1,
                  }}
                >
                  <div className={cn(
                    "w-full h-full transition-all duration-100",
                    isHead ? "bg-green-400 rounded-sm" : "bg-green-600/80 rounded-[1px]",
                    isHead && "shadow-[0_0_10px_rgba(74,222,128,0.5)]"
                  )}>
                     {isHead && (
                       <>
                         <div className="absolute top-1 left-1 w-1 h-1 bg-black/50 rounded-full"></div>
                         <div className="absolute top-1 right-1 w-1 h-1 bg-black/50 rounded-full"></div>
                       </>
                     )}
                  </div>
                </div>
              );
            })}

            {/* 食物 */}
            <div
              className="relative z-0 animate-bounce"
              style={{
                gridColumn: food.x + 1,
                gridRow: food.y + 1,
                animationDuration: '2s'
              }}
            >
              <div className="w-full h-full bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.6)] flex items-center justify-center text-[10px]">
                🍎
              </div>
            </div>
          </div>

          {/* 移动端控制区 */}
          <div className="mt-8 grid grid-cols-3 gap-2 max-w-[180px] mx-auto">
             <div />
             <ControlBtn icon={ChevronUp} onClick={() => changeDirection('UP')} active={direction === 'UP'} />
             <div />
             <ControlBtn icon={ChevronLeft} onClick={() => changeDirection('LEFT')} active={direction === 'LEFT'} />
             <ControlBtn icon={ChevronDown} onClick={() => changeDirection('DOWN')} active={direction === 'DOWN'} />
             <ControlBtn icon={ChevronRight} onClick={() => changeDirection('RIGHT')} active={direction === 'RIGHT'} />
          </div>
          <p className="text-center text-xs text-slate-400 mt-4">也可使用键盘方向键控制</p>
        </div>
      </div>
    </PageTransition>
  );
}

function ControlBtn({ icon: Icon, onClick, active }: { icon: any, onClick: () => void, active: boolean }) {
  return (
    <button
      className={cn(
        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-95 touch-manipulation",
        active ? "bg-slate-800 text-white shadow-inner" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
      )}
      onClick={(e) => { e.preventDefault(); onClick(); }}
      onPointerDown={(e) => { e.preventDefault(); onClick(); }}
    >
      <Icon size={24} />
    </button>
  );
}
