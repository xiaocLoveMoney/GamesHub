import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'motion/react';
import { Play, RefreshCw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Trophy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PageTransition from '../../components/PageTransition';
import { cn } from '../../lib/utils';
import { playtimeService } from '../../services/playtimeService';

// 游戏配置
const GRID_SIZE = 20;
const INITIAL_SPEED = 150;

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export default function Snake() {
  const { t } = useTranslation();
  const INITIAL_SNAKE = [{ x: 10, y: 10 }, { x: 10, y: 11 }, { x: 10, y: 12 }];

  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const directionRef = useRef<Direction>('RIGHT');
  const lastProcessedDirection = useRef<Direction>('RIGHT');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const foodRef = useRef({ x: 5, y: 5 });
  const startTimeRef = useRef<number | null>(null);

  // Generate food that doesn't collide with snake
  const generateFood = (currentSnake: Point[] = []): Point => {
    let newFood: Point;
    let isColliding;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      isColliding = currentSnake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
    } while (isColliding);
    return newFood;
  };

  const startGame = () => {
    setSnake(INITIAL_SNAKE);
    const newFood = generateFood(INITIAL_SNAKE);
    setFood(newFood);
    foodRef.current = newFood;
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    lastProcessedDirection.current = 'RIGHT';
    setScore(0);
    setGameOver(false);
    setCountdown(3);
  };

  // Record Playtime
  useEffect(() => {
    if (isPlaying && !startTimeRef.current) {
      startTimeRef.current = Date.now();
    } else if (!isPlaying && startTimeRef.current) {
      const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
      playtimeService.savePlaytime('snake', duration);
      startTimeRef.current = null;
    }

    return () => {
      if (startTimeRef.current) {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        playtimeService.savePlaytime('snake', duration);
        startTimeRef.current = null;
      }
    };
  }, [isPlaying]);

  // Countdown Effect
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(c => c! - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCountdown(null);
      setIsPlaying(true);
    }
  }, [countdown]);

  // Keyboard Input
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
    const currentDir = lastProcessedDirection.current;
    if (newDir === 'UP' && currentDir === 'DOWN') return;
    if (newDir === 'DOWN' && currentDir === 'UP') return;
    if (newDir === 'LEFT' && currentDir === 'RIGHT') return;
    if (newDir === 'RIGHT' && currentDir === 'LEFT') return;

    directionRef.current = newDir;
    setDirection(newDir);
  };

  // Game Loop
  useEffect(() => {
    if (!isPlaying) return;

    const tick = () => {
      setSnake(prevSnake => {
        const head = { ...prevSnake[0] };
        const currentDir = directionRef.current;
        lastProcessedDirection.current = currentDir;

        if (currentDir === 'UP') head.y -= 1;
        if (currentDir === 'DOWN') head.y += 1;
        if (currentDir === 'LEFT') head.x -= 1;
        if (currentDir === 'RIGHT') head.x += 1;

        // Collision with walls
        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setGameOver(true);
          setIsPlaying(false);
          return prevSnake;
        }

        // Collision with self
        if (prevSnake.some(s => s.x === head.x && s.y === head.y)) {
          setGameOver(true);
          setIsPlaying(false);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        // Eat Food
        if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
          setScore(s => s + 1);
          const newFood = generateFood(newSnake);
          setFood(newFood);
          foodRef.current = newFood;
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    };

    timerRef.current = setInterval(tick, Math.max(50, INITIAL_SPEED - score * 2));
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, score]);


  return (
    <PageTransition>
      <div className="flex flex-col items-center py-6 min-h-[calc(100vh-100px)]">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 w-full max-w-md">

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span className="p-1.5 bg-green-100 text-green-600 rounded-lg text-lg">🐍</span> {t('games.snake')}
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
                <h3 className="text-xl font-bold mb-4">{t('common.game_over')}</h3>
                <button
                  onClick={startGame}
                  className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full font-medium transition-colors flex items-center gap-2"
                >
                  <RefreshCw size={18} /> {t('common.try_again')}
                </button>
              </div>
            )}

            {/* 遮罩层：倒计时 */}
            {countdown !== null && countdown > 0 && (
              <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                <motion.div
                  key={countdown}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 1.5, opacity: 0 }}
                  className="text-8xl font-bold text-white"
                >
                  {countdown}
                </motion.div>
              </div>
            )}

            {/* 遮罩层：未开始 */}
            {!isPlaying && !gameOver && countdown === null && (
              <div className="absolute inset-0 z-20 bg-black/40 flex items-center justify-center">
                <button
                  onClick={startGame}
                  className="w-16 h-16 bg-green-500 hover:bg-green-400 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
                >
                  <Play size={32} fill="currentColor" className="ml-1" />
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
          <p className="text-center text-xs text-slate-400 mt-4">{t('common.snake_hint')}</p>
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
