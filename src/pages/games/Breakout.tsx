import { useEffect, useRef, useState } from 'react';
import { Play, RefreshCw, Trophy, Heart, MousePointer2, Settings, X } from 'lucide-react';
import PageTransition from '../../components/PageTransition';
import { AnimatePresence, motion } from 'motion/react';

type Brick = { x: number; y: number; w: number; h: number; active: boolean; color: string };

const BRICK_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899'];

// --- 1. 定义配置选项 ---
const SPEEDS = {
  slow: { label: '休闲', value: 4, dx: 2, dy: -2 },
  medium: { label: '正常', value: 6, dx: 3, dy: -3 },
  fast: { label: '极速', value: 9, dx: 4.5, dy: -4.5 }
};

const LAYOUTS = {
  small: { label: '稀疏', rows: 4, cols: 6 },
  medium: { label: '标准', rows: 5, cols: 8 },
  large: { label: '密集', rows: 7, cols: 10 }
};

import { useTranslation } from 'react-i18next';

export default function Breakout() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameStatus, setGameStatus] = useState<'start' | 'countdown' | 'playing' | 'won' | 'lost'>('start');
  const [countdown, setCountdown] = useState(3);

  // --- 2. 新增设置状态 ---
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState({
    speed: 'medium' as keyof typeof SPEEDS,
    layout: 'medium' as keyof typeof LAYOUTS
  });

  const gameState = useRef({
    paddle: { x: 250, y: 380, w: 100, h: 12, dx: 0, speed: 8 },
    ball: { x: 300, y: 300, r: 8, dx: 3, dy: -3, color: BRICK_COLORS[4] },
    bricks: [] as Brick[],
    canvasWidth: 600,
    canvasHeight: 400,
    animationId: 0
  });

  // --- 3. 动态初始化砖块 (根据设置) ---
  const initBricks = () => {
    const layout = LAYOUTS[config.layout];
    const cols = layout.cols;
    const rows = layout.rows;

    const padding = 10;
    const offsetTop = 50;
    const offsetLeft = 35;

    // 自动计算砖块宽度以适应画布 (总宽600 - 左右留白 - 间隙) / 列数
    const availableWidth = 600 - (offsetLeft * 2);
    const width = (availableWidth - (padding * (cols - 1))) / cols;
    const height = 20;

    const newBricks: Brick[] = [];
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        newBricks.push({
          x: (c * (width + padding)) + offsetLeft,
          y: (r * (height + padding)) + offsetTop,
          w: width,
          h: height,
          active: true,
          // 循环使用颜色数组
          color: BRICK_COLORS[r % BRICK_COLORS.length]
        });
      }
    }
    gameState.current.bricks = newBricks;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') gameState.current.paddle.dx = gameState.current.paddle.speed;
      if (e.key === 'ArrowLeft') gameState.current.paddle.dx = -gameState.current.paddle.speed;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') gameState.current.paddle.dx = 0;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (gameStatus === 'countdown') {
      setCountdown(3);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setGameStatus('playing');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameStatus]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = 600 * dpr;
    canvas.height = 400 * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = "100%";
    canvas.style.height = "100%";

    const draw = () => {
      const state = gameState.current;
      const logicalWidth = 600;
      const logicalHeight = 400;

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, logicalWidth, logicalHeight);

      // Paddle
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.roundRect(state.paddle.x, state.paddle.y, state.paddle.w, state.paddle.h, 6);
      ctx.fill();

      // Ball
      ctx.fillStyle = state.ball.color;
      ctx.beginPath();
      ctx.arc(state.ball.x, state.ball.y, state.ball.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Bricks
      state.bricks.forEach(b => {
        if (b.active) {
          ctx.fillStyle = b.color;
          ctx.beginPath();
          ctx.roundRect(b.x, b.y, b.w, b.h, 4);
          ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fillRect(b.x, b.y, b.w, b.h / 2);
        }
      });
    };

    const update = () => {
      if (gameStatus !== 'playing') return;
      const state = gameState.current;

      // Paddle logic
      state.paddle.x += state.paddle.dx;
      if (state.paddle.x < 0) state.paddle.x = 0;
      if (state.paddle.x + state.paddle.w > state.canvasWidth) state.paddle.x = state.canvasWidth - state.paddle.w;

      // Ball logic
      state.ball.x += state.ball.dx;
      state.ball.y += state.ball.dy;

      // Walls
      if (state.ball.x + state.ball.r > state.canvasWidth || state.ball.x - state.ball.r < 0) {
        state.ball.dx *= -1;
      }
      if (state.ball.y - state.ball.r < 0) {
        state.ball.dy *= -1;
      }

      // Paddle Collision
      if (
        state.ball.y + state.ball.r > state.paddle.y &&
        state.ball.x > state.paddle.x &&
        state.ball.x < state.paddle.x + state.paddle.w
      ) {
        state.ball.dy = -Math.abs(state.ball.dy);
        const hitPoint = state.ball.x - (state.paddle.x + state.paddle.w / 2);
        // 根据速度配置调整反弹系数
        const speedFactor = SPEEDS[config.speed].value / 20;
        state.ball.dx = hitPoint * speedFactor;
      }

      // Bricks Collision
      state.bricks.forEach(b => {
        if (b.active) {
          if (
            state.ball.x > b.x &&
            state.ball.x < b.x + b.w &&
            state.ball.y > b.y &&
            state.ball.y < b.y + b.h
          ) {
            state.ball.dy *= -1;

            if (state.ball.color === b.color) {
              b.active = false;
              setScore(s => s + 10);
              if (state.bricks.every(brick => !brick.active)) {
                setGameStatus('won');
              }
            } else {
              state.ball.color = b.color;
            }
          }
        }
      });

      // Game Over
      if (state.ball.y + state.ball.r > state.canvasHeight) {
        setLives(l => {
          const newLives = l - 1;
          if (newLives <= 0) {
            setGameStatus('lost');
          } else {
            resetBall();
          }
          return newLives;
        });
      }
    };

    const loop = () => {
      update();
      draw();
      gameState.current.animationId = requestAnimationFrame(loop);
    };
    loop();

    return () => cancelAnimationFrame(gameState.current.animationId);
  }, [gameStatus, config]); // 监听配置变化

  // --- 4. 重置球 (根据设置的速度) ---
  const resetBall = () => {
    const speedConfig = SPEEDS[config.speed];
    // 初始颜色设为当前布局最下面一行的颜色，保证能玩
    const layout = LAYOUTS[config.layout];
    const initialColor = BRICK_COLORS[(layout.rows - 1) % BRICK_COLORS.length];

    gameState.current.ball = {
      x: 300, y: 300, r: 8,
      dx: speedConfig.dx,
      dy: speedConfig.dy,
      color: initialColor
    };
    gameState.current.paddle.x = 250;
  };

  const handleStart = () => {
    initBricks();
    setScore(0);
    setLives(3);
    resetBall();
    setGameStatus('countdown');
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (gameStatus !== 'playing') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const scaleX = gameState.current.canvasWidth / rect.width;
      const mouseX = (e.clientX - rect.left) * scaleX;
      let newX = mouseX - gameState.current.paddle.w / 2;
      newX = Math.max(0, Math.min(gameState.current.canvasWidth - gameState.current.paddle.w, newX));
      gameState.current.paddle.x = newX;
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col items-center py-6 min-h-[calc(100vh-100px)] select-none relative">

        {/* 设置弹窗 Modal */}
        <AnimatePresence>
          {showSettings && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 border border-slate-100"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Settings size={20} /> {t('common.settings_title')}
                  </h3>
                  <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {/* 球速设置 */}
                <div className="mb-6">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">{t('common.ball_speed')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(SPEEDS) as Array<keyof typeof SPEEDS>).map((key) => (
                      <button
                        key={key}
                        onClick={() => setConfig(p => ({ ...p, speed: key }))}
                        className={`py-2 rounded-lg text-sm font-medium transition-all ${config.speed === key
                          ? 'bg-slate-800 text-white shadow-md scale-105'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                      >
                        {t(`common.speed_${key}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 砖块数量设置 */}
                <div className="mb-6">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 block">{t('common.brick_density')}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(LAYOUTS) as Array<keyof typeof LAYOUTS>).map((key) => (
                      <button
                        key={key}
                        onClick={() => setConfig(p => ({ ...p, layout: key }))}
                        className={`py-2 rounded-lg text-sm font-medium transition-all ${config.layout === key
                          ? 'bg-slate-800 text-white shadow-md scale-105'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                      >
                        {t(`common.layout_${key}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setShowSettings(false)}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
                >
                  {t('common.complete_setup')}
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <div className="bg-white p-1 rounded-[2rem] shadow-lg border border-slate-100 w-full max-w-2xl relative z-10">
          {/* 顶部状态栏 */}
          <div className="flex justify-between items-center mb-2 px-6 pt-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5 text-rose-500 bg-rose-50 px-3 py-1 rounded-full">
                <Heart size={18} fill="currentColor" />
                <span className="font-bold text-lg font-mono pt-0.5">{lives}</span>
              </div>
              <div className="text-slate-300 text-xl font-light">|</div>
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{t('common.score')}</span>
                <span className="font-bold text-2xl text-slate-700 font-mono leading-none">{score}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* 颜色提示 */}
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                <div className="flex gap-1">
                  {BRICK_COLORS.slice(0, 5).map(c => (
                    <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }}></div>
                  ))}
                </div>
                <span>{t('common.same_color_break')}</span>
              </div>
            </div>
          </div>

          {/* 游戏区域 */}
          <div className="relative w-full aspect-[3/2] bg-slate-50 rounded-[1.5rem] overflow-hidden cursor-none group">
            <canvas
              ref={canvasRef}
              className="w-full h-full block touch-none"
              onMouseMove={handleMouseMove}
            />

            <AnimatePresence>
              {gameStatus === 'countdown' && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center"
                >
                  <motion.div
                    key={countdown}
                    initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1.5, opacity: 1 }} exit={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-8xl font-black text-slate-800 font-mono"
                  >
                    {countdown}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {(gameStatus === 'start' || gameStatus === 'won' || gameStatus === 'lost') && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-30">
                {gameStatus === 'won' && (
                  <div className="text-center text-amber-500 mb-6 animate-bounce">
                    <Trophy size={80} />
                    <h2 className="text-4xl font-bold mt-4 text-slate-800">{t('common.level_cleared')}</h2>
                  </div>
                )}
                {gameStatus === 'lost' && (
                  <div className="text-center mb-6">
                    <h2 className="text-4xl font-bold text-slate-800 mb-2">{t('common.game_over')}</h2>
                    <p className="text-slate-500">{t('common.final_score')}: {score}</p>
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleStart}
                    className="group relative px-10 py-4 bg-slate-900 text-white rounded-full font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center gap-3">
                      {gameStatus === 'start' ? <Play size={24} fill="currentColor" /> : <RefreshCw size={24} />}
                      <span className="text-lg">{gameStatus === 'start' ? t('common.start_challenge') : t('common.try_again')}</span>
                    </div>
                  </button>

                  {/* 设置按钮 (只在开始或结束时显示) */}
                  <button
                    onClick={() => setShowSettings(true)}
                    className="px-6 py-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all text-sm font-medium flex items-center gap-2 justify-center"
                  >
                    <Settings size={16} /> {t('common.custom_difficulty')}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mt-4 mb-2 text-slate-400 text-sm px-4">
            <div className="flex items-center gap-2">
              <MousePointer2 size={16} />
              <span>{t('common.mouse_follow')}</span>
            </div>
            <div className="flex gap-4 text-xs font-mono">
              <span>{t('common.speed')}: {t(`common.speed_${config.speed}`)}</span>
              <span>{t('common.layout')}: {t(`common.layout_${config.layout}`)}</span>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}