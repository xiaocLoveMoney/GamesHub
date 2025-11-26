import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Trophy, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../../components/PageTransition';

export default function DinoRun() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);

  const gameState = useRef({
    dino: { y: 0, dy: 0, w: 40, h: 40, grounded: true },
    obstacles: [] as { x: number; w: number; h: number }[],
    gameSpeed: 3,
    gravity: 0.35, // 🪶 重力略小 → 跳得更高更远
    jumpForce: -12.5, // 🦖 跳跃力度更强
    frameCount: 0,
    baseY: 250,
    width: 600,
    height: 300,
    animationId: 0
  });

  const resetGame = () => {
    gameState.current.dino.y = 0;
    gameState.current.dino.dy = 0;
    gameState.current.dino.grounded = true;
    gameState.current.obstacles = [];
    gameState.current.frameCount = 0;
    gameState.current.gameSpeed = 3;
    setScore(0);
    setGameOver(false);
    setCountdown(3); // Start countdown
  };

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 300;

    const s = gameState.current;

    // 🌵 障碍物生成逻辑
    const spawnObstacle = () => {
      // 更大间距（生成间隔延长）
      if (s.frameCount % Math.floor(1300 / s.gameSpeed + Math.random() * 100) === 0) {
        const type = Math.random();
        let width = 20 + Math.random() * 20;
        let height = 35;

        if (type > 0.8) {
          height = 55;
          width = 20;
        } else if (type > 0.6) {
          width = 50;
          height = 25;
        }

        s.obstacles.push({ x: s.width, w: width, h: height });
      }
    };

    // 🦕 可爱恐龙绘制
    const drawCuteDino = (x: number, y: number, w: number, h: number) => {
      // 身体
      ctx.fillStyle = '#86efac'; // 可爱浅绿色
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.fill();

      // 脸颊
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.arc(x + 8, y + 12, 4, 0, Math.PI * 2);
      ctx.arc(x + w - 8, y + 12, 4, 0, Math.PI * 2);
      ctx.fill();

      // 眼睛
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(x + w / 2 + 5, y + 10, 3, 0, Math.PI * 2);
      ctx.fill();

      // 嘴巴
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + w / 2 + 6, y + 16, 4, 0, Math.PI / 4);
      ctx.stroke();

      // 腿部动画
      if (s.dino.grounded && isPlaying) {
        ctx.fillStyle = '#22c55e';
        if (Math.floor(s.frameCount / 10) % 2 === 0) {
          ctx.fillRect(x + 5, y + h - 2, 10, 5); // 左脚
        } else {
          ctx.fillRect(x + 25, y + h - 2, 10, 5); // 右脚
        }
      }
    };

    const loop = () => {
      if (!isPlaying) return;

      s.frameCount++;
      s.gameSpeed += 0.0003; // ⚙️ 减慢加速速率
      setScore(Math.floor(s.frameCount / 10));

      // 背景
      ctx.fillStyle = '#f8fafc'; // 更亮的背景
      ctx.fillRect(0, 0, s.width, s.height);

      // 地面线
      ctx.beginPath();
      ctx.moveTo(0, s.baseY);
      ctx.lineTo(s.width, s.baseY);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.stroke();

      // 跳跃物理
      if (!s.dino.grounded) {
        s.dino.dy += s.gravity;
        s.dino.y += s.dino.dy;
      }

      // 落地
      if (s.dino.y > 0) {
        s.dino.y = 0;
        s.dino.dy = 0;
        s.dino.grounded = true;
      }

      const dinoX = 50;
      const dinoY = s.baseY - s.dino.h + s.dino.y;

      drawCuteDino(dinoX, dinoY, s.dino.w, s.dino.h);

      spawnObstacle();

      // 障碍物逻辑
      for (let i = 0; i < s.obstacles.length; i++) {
        const obs = s.obstacles[i];
        obs.x -= s.gameSpeed;

        ctx.fillStyle = '#fca5a5'; // 🌵粉红仙人掌
        ctx.beginPath();
        ctx.roundRect(obs.x, s.baseY - obs.h, obs.w, obs.h, 4);
        ctx.fill();

        // 碰撞检测（稍放宽）
        if (
          dinoX < obs.x + obs.w - 8 &&
          dinoX + s.dino.w - 5 > obs.x &&
          dinoY < s.baseY - obs.h + obs.h &&
          dinoY + s.dino.h > s.baseY - obs.h
        ) {
          setGameOver(true);
          setIsPlaying(false);
          setHighScore(prev => Math.max(prev, Math.floor(s.frameCount / 10)));
          return;
        }

        if (obs.x + obs.w < 0) {
          s.obstacles.shift();
          i--;
        }
      }

      s.animationId = requestAnimationFrame(loop);
    };

    if (isPlaying) {
      loop();
    } else {
      // 静态画面
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, s.width, s.height);
      ctx.beginPath();
      ctx.moveTo(0, s.baseY);
      ctx.lineTo(s.width, s.baseY);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.stroke();
      drawCuteDino(50, s.baseY - 40 + s.dino.y, 40, 40);
    }

    return () => cancelAnimationFrame(s.animationId);
  }, [isPlaying, countdown]);

  const jump = () => {
    if (!isPlaying && !gameOver && countdown === null) {
      // Start countdown if not playing
      setCountdown(3);
      return;
    }

    if (!isPlaying || !gameState.current.dino.grounded) return;
    gameState.current.dino.dy = gameState.current.jumpForce;
    gameState.current.dino.grounded = false;
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (gameOver) resetGame();
        else jump(); // Call the jump useCallback
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [gameOver, isPlaying, jump]); // Added jump to dependencies

  return (
    <PageTransition>
      <div className="flex flex-col items-center py-10 min-h-[calc(100vh-100px)] select-none">
        <div className="w-full max-w-2xl px-4">

          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              <span className="text-4xl">🦖</span> Dino Run
            </h1>
            <div className="flex gap-6 text-right">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('common.score')}</div>
                <div className="text-2xl font-mono font-bold text-slate-800">{Math.floor(score)}</div>
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('common.high_score')}</div>
                <div className="text-2xl font-mono font-bold text-slate-400">{Math.floor(highScore)}</div>
              </div>
            </div>
          </div>

          {/* Game Canvas */}
          <div
            className="relative bg-white rounded-xl shadow-xl overflow-hidden border-4 border-slate-800 cursor-pointer"
            onClick={gameOver ? resetGame : jump} // Use jump for click handler
          >
            <canvas
              ref={canvasRef}
              width={gameState.current.width} // Use state ref for width
              height={gameState.current.height} // Use state ref for height
              className="w-full h-auto block bg-slate-50"
            />

            {/* Overlays */}
            <AnimatePresence>
              {/* Game Over */}
              {gameOver && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center text-white"
                >
                  <h2 className="text-4xl font-black mb-2">GAME OVER</h2>
                  <button
                    onClick={(e) => { e.stopPropagation(); resetGame(); }}
                    className="mt-4 px-6 py-2 bg-white text-slate-900 rounded-full font-bold hover:scale-105 transition-transform flex items-center gap-2"
                  >
                    <RefreshCw size={20} /> Try Again
                  </button>
                </motion.div>
              )}

              {/* Start Screen */}
              {!isPlaying && !gameOver && countdown === null && (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-black/20 flex items-center justify-center"
                >
                  <div className="bg-white/90 backdrop-blur px-6 py-4 rounded-2xl shadow-lg flex flex-col items-center">
                    <p className="text-slate-500 font-medium mb-2">Press Space or Click to Jump</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); jump(); }} // Use jump to start countdown
                      className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center gap-2 animate-pulse"
                    >
                      <Play size={20} fill="currentColor" /> {t('common.start_game')}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Countdown Overlay */}
              {countdown !== null && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  key={countdown}
                  className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                >
                  <motion.span
                    className="text-8xl font-black text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1.2, opacity: 1 }}
                    exit={{ scale: 2, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    {countdown === 0 ? "GO!" : countdown}
                  </motion.span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="text-center text-slate-400 mt-6 text-sm">
            Tip: The game gets faster as you progress!
          </p>

        </div>
      </div>
    </PageTransition>
  );
}

