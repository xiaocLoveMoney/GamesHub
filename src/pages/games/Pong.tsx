import { useEffect, useRef, useState } from 'react';
import { Play, RefreshCw, Trophy } from 'lucide-react';
import PageTransition from '../../components/PageTransition';

export default function Pong() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [score, setScore] = useState({ player: 0, ai: 0 });
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const gameState = useRef({
    paddleHeight: 80,
    paddleWidth: 10,
    ballSize: 10,
    playerY: 150,
    aiY: 150,
    ball: { x: 300, y: 200, dx: 2, dy: 2 }, // 🐢 初始速度更慢
    canvasWidth: 600,
    canvasHeight: 400,
    aiSpeed: 5 // 🤖 提高AI移动速度
  });

  const mouseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 600;
    canvas.height = 400;

    let animationId: number;

    const render = () => {
      if (!isPlaying || countdown !== null) return; // ⏸ 倒计时期间暂停球运动

      const state = gameState.current;

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 中线
      ctx.setLineDash([10, 10]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0);
      ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.strokeStyle = '#334155';
      ctx.stroke();
      ctx.setLineDash([]);

      // 玩家球拍
      let targetY = mouseRef.current - state.paddleHeight / 2;
      targetY = Math.max(0, Math.min(canvas.height - state.paddleHeight, targetY));
      state.playerY = targetY;

      // AI 球拍智能跟踪
      const aiCenter = state.aiY + state.paddleHeight / 2;
      if (aiCenter < state.ball.y - 20) {
        state.aiY += state.aiSpeed;
      } else if (aiCenter > state.ball.y + 20) {
        state.aiY -= state.aiSpeed;
      }
      state.aiY = Math.max(0, Math.min(canvas.height - state.paddleHeight, state.aiY));

      // 球运动
      state.ball.x += state.ball.dx;
      state.ball.y += state.ball.dy;

      // 撞到上下边界
      if (state.ball.y <= 0 || state.ball.y + state.ballSize >= canvas.height) {
        state.ball.dy *= -1;
      }

      // 玩家挡球
      if (
        state.ball.x <= 20 + state.paddleWidth &&
        state.ball.y + state.ballSize >= state.playerY &&
        state.ball.y <= state.playerY + state.paddleHeight &&
        state.ball.dx < 0
      ) {
        state.ball.dx *= -1.03; // ⚙️ 减少反弹加速幅度
        const deltaY = state.ball.y - (state.playerY + state.paddleHeight / 2);
        state.ball.dy = deltaY * 0.15;
      }

      // AI 挡球
      if (
        state.ball.x + state.ballSize >= canvas.width - 20 - state.paddleWidth &&
        state.ball.y + state.ballSize >= state.aiY &&
        state.ball.y <= state.aiY + state.paddleHeight &&
        state.ball.dx > 0
      ) {
        state.ball.dx *= -1.03;
        const deltaY = state.ball.y - (state.aiY + state.paddleHeight / 2);
        state.ball.dy = deltaY * 0.15;
      }

      // 出界判分
      if (state.ball.x < 0) {
        setScore(s => {
          const newScore = { ...s, ai: s.ai + 1 };
          checkWinner(newScore);
          return newScore;
        });
        startRoundCountdown();
      } else if (state.ball.x > canvas.width) {
        setScore(s => {
          const newScore = { ...s, player: s.player + 1 };
          checkWinner(newScore);
          return newScore;
        });
        startRoundCountdown();
      }

      // 绘制球拍和球
      ctx.fillStyle = '#fff';
      ctx.fillRect(20, state.playerY, state.paddleWidth, state.paddleHeight);
      ctx.fillRect(canvas.width - 20 - state.paddleWidth, state.aiY, state.paddleWidth, state.paddleHeight);
      ctx.fillRect(state.ball.x, state.ball.y, state.ballSize, state.ballSize);

      animationId = requestAnimationFrame(render);
    };

    if (isPlaying) render();

    return () => cancelAnimationFrame(animationId);
  }, [isPlaying, countdown]);

  const resetBall = () => {
    const state = gameState.current;
    state.ball = {
      x: state.canvasWidth / 2,
      y: state.canvasHeight / 2,
      dx: Math.random() > 0.5 ? 2 : -2, // 🐢 更慢起步
      dy: Math.random() * 2 - 1
    };
  };

  const checkWinner = (currentScore: { player: number; ai: number }) => {
    if (currentScore.player >= 5) {
      setWinner('player');
      setIsPlaying(false);
    } else if (currentScore.ai >= 5) {
      setWinner('ai');
      setIsPlaying(false);
    }
  };

  const startRoundCountdown = () => {
    resetBall();
    setCountdown(3);
    let counter = 3;
    const timer = setInterval(() => {
      counter--;
      if (counter > 0) {
        setCountdown(counter);
      } else {
        clearInterval(timer);
        setCountdown(null); // 倒计时结束，开始运动
      }
    }, 1000);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const scaleY = gameState.current.canvasHeight / rect.height;
      mouseRef.current = (e.clientY - rect.top) * scaleY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const scaleY = gameState.current.canvasHeight / rect.height;
      mouseRef.current = (e.touches[0].clientY - rect.top) * scaleY;
    }
  };

  const startGame = () => {
    setScore({ player: 0, ai: 0 });
    setWinner(null);
    setIsPlaying(true);
    startRoundCountdown();
  };

  return (
    <PageTransition>
      <div className="flex flex-col items-center py-10 min-h-[calc(100vh-100px)]">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 w-full max-w-3xl">
          <div className="flex justify-between items-center mb-6 px-10">
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Player</span>
              <span className="text-4xl font-mono font-bold text-slate-800">{score.player}</span>
            </div>
            <div className="text-slate-200 text-2xl font-light">VS</div>
            <div className="flex flex-col items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI</span>
              <span className="text-4xl font-mono font-bold text-slate-800">{score.ai}</span>
            </div>
          </div>

          <div className="relative mx-auto w-full aspect-[3/2] bg-slate-900 rounded-xl overflow-hidden shadow-inner">
            <canvas
              ref={canvasRef}
              className="w-full h-full block"
              onMouseMove={handleMouseMove}
              onTouchMove={handleTouchMove}
            />

            {/* 游戏未开始或结束界面 */}
            {!isPlaying && (
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white z-10">
                {winner ? (
                  <div className="text-center animate-in fade-in zoom-in">
                    <Trophy size={48} className="mx-auto mb-4 text-yellow-400" />
                    <h2 className="text-3xl font-bold mb-2">{winner === 'player' ? '你赢了！' : 'AI 获胜'}</h2>
                    <button
                      onClick={startGame}
                      className="mt-6 px-8 py-3 bg-white text-slate-900 rounded-full font-bold hover:bg-slate-200 transition-colors flex items-center gap-2 mx-auto"
                    >
                      <RefreshCw size={20} /> 再来一局
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={startGame}
                    className="w-20 h-20 bg-white text-slate-900 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-xl"
                  >
                    <Play size={40} fill="currentColor" className="ml-1" />
                  </button>
                )}
              </div>
            )}

            {/* 倒计时显示 */}
            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center text-white text-6xl font-bold z-20 animate-in fade-in zoom-in">
                {countdown === 0 ? '开始！' : countdown}
              </div>
            )}
          </div>

          <p className="text-center text-sm text-slate-400 mt-6">
            移动鼠标或在屏幕上滑动来控制左侧球拍。率先获得 5 分者获胜。
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
