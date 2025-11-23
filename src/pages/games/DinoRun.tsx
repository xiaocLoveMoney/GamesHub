import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Trophy } from 'lucide-react';
import PageTransition from '../../components/PageTransition';

export default function DinoRun() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const state = useRef({
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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 300;

    const s = state.current;

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
  }, [isPlaying]);

  const handleJump = () => {
    if (state.current.dino.grounded && isPlaying) {
      state.current.dino.grounded = false;
      state.current.dino.dy = state.current.jumpForce;
    } else if (!isPlaying && !gameOver) {
      setIsPlaying(true);
    }
  };

  const resetGame = () => {
    state.current.dino.y = 0;
    state.current.dino.dy = 0;
    state.current.dino.grounded = true;
    state.current.obstacles = [];
    state.current.frameCount = 0;
    state.current.gameSpeed = 3; // 🐢 起始速度更低
    setScore(0);
    setGameOver(false);
    setIsPlaying(true);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        if (gameOver) resetGame();
        else handleJump();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [gameOver, isPlaying]);

  return (
    <PageTransition>
      <div className="flex flex-col items-center py-10 min-h-[calc(100vh-100px)]">
        <div className="w-full max-w-3xl bg-white p-2 rounded-xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center px-4 py-2 font-mono text-slate-600">
            <div className="text-xl font-bold flex items-center gap-2">
              <span className="text-slate-800">DINO RUN 🦕</span>
            </div>
            <div className="flex gap-6">
              <div className="flex items-center gap-2 text-slate-400">
                <Trophy size={16} />
                <span>HI {highScore.toString().padStart(5, '0')}</span>
              </div>
              <div className="font-bold text-slate-800 text-xl">
                {score.toString().padStart(5, '0')}
              </div>
            </div>
          </div>

          <div
            className="relative w-full aspect-[2/1] bg-white border-t border-b border-slate-100 cursor-pointer touch-manipulation overflow-hidden select-none"
            onClick={gameOver ? resetGame : handleJump}
          >
            <canvas ref={canvasRef} className="w-full h-full block" />

            {!isPlaying && !gameOver && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-slate-800/80 text-white px-6 py-3 rounded-full animate-pulse">
                  按空格或点击屏幕开始
                </div>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[1px] z-10">
                <div className="text-3xl font-bold text-slate-800 mb-4">GAME OVER</div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resetGame();
                  }}
                  className="p-4 bg-green-500 text-white rounded-full hover:scale-110 transition-transform shadow-lg"
                >
                  <RefreshCw size={24} />
                </button>
              </div>
            )}
          </div>

          <div className="p-4 text-center text-xs text-slate-400">
            <span className="hidden sm:inline">
              <kbd className="px-2 py-1 bg-slate-100 rounded border border-slate-300 mx-1">Space</kbd> 跳跃
            </span>
            <span className="sm:hidden">点击屏幕跳跃</span>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
