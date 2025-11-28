import { useEffect, useRef, useState, useCallback } from 'react';
import { MousePointer2, Play, Pause, Crosshair } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import PageTransition from '../../components/PageTransition';

type Blob = { x: number; y: number; r: number; color: string; isAI?: boolean; vx?: number; vy?: number; targetX?: number; targetY?: number };
type AIDifficulty = 'easy' | 'medium' | 'hard';


export default function Agario() {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false); // 游戏是否已开始（包括暂停状态）
  const [isPaused, setIsPaused] = useState(false);   // 是否处于暂停状态
  const [countdown, setCountdown] = useState(0);     // 倒计时状态

  // AI 配置
  const [aiCount, setAiCount] = useState(3);
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('medium');


  // 虚拟鼠标位置（相对于 Canvas 左上角），因为 PointerLock 后系统鼠标位置不再更新
  const virtualMouse = useRef({ x: 400, y: 300 });

  const WORLD_SIZE = 2000;

  const state = useRef({
    player: { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2, r: 20, color: '#3b82f6' },
    foods: [] as Blob[],
    aiPlayers: [] as Blob[],
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
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = state.current.width;
    canvas.height = state.current.height;

    // 重置虚拟鼠标位置到中心
    virtualMouse.current = { x: state.current.width / 2, y: state.current.height / 2 };

    // Init Food
    if (state.current.foods.length === 0) {
      for (let i = 0; i < 300; i++) addFood();
    }

    let animId: number;

    const loop = () => {
      // 只有在 游戏进行中、非暂停、倒计时结束 时才更新逻辑
      if (isPlaying && !isPaused && countdown === 0) {
        update();
      }
      // 始终绘制画面（暂停时显示静止画面）
      draw(ctx);
      animId = requestAnimationFrame(loop);
    };

    const update = () => {
      const p = state.current.player;
      const { width, height, aiPlayers } = state.current;

      // --- 玩家移动 ---
      const dx = virtualMouse.current.x - width / 2;
      const dy = virtualMouse.current.y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 10) {
        const speed = 4 * (20 / p.r);
        p.x += (dx / dist) * speed;
        p.y += (dy / dist) * speed;
      }

      p.x = Math.max(p.r, Math.min(WORLD_SIZE - p.r, p.x));
      p.y = Math.max(p.r, Math.min(WORLD_SIZE - p.r, p.y));

      state.current.camera.x = p.x - width / 2;
      state.current.camera.y = p.y - height / 2;

      // --- AI 移动逻辑 ---
      aiPlayers.forEach((ai) => {
        if (!ai.isAI) return;

        const speed = 3 * (20 / ai.r);

        // 根据难度决定移动策略
        if (aiDifficulty === 'easy') {
          // Easy: 随机移动
          if (!ai.targetX || !ai.targetY || Math.random() < 0.02) {
            ai.targetX = Math.random() * WORLD_SIZE;
            ai.targetY = Math.random() * WORLD_SIZE;
          }
          const tdx = ai.targetX - ai.x;
          const tdy = ai.targetY - ai.y;
          const tdist = Math.sqrt(tdx * tdx + tdy * tdy);
          if (tdist > 10) {
            ai.x += (tdx / tdist) * speed;
            ai.y += (tdy / tdist) * speed;
          }
        } else if (aiDifficulty === 'medium') {
          // Medium: 寻找最近的食物，避开更大的玩家
          let nearestFood = null;
          let minDist = Infinity;
          state.current.foods.forEach(f => {
            const d = Math.sqrt((f.x - ai.x) ** 2 + (f.y - ai.y) ** 2);
            if (d < minDist) {
              minDist = d;
              nearestFood = f;
            }
          });

          // 检查是否有比自己大的威胁
          const threats = [...aiPlayers, p].filter(
            other => other !== ai && other.r > ai.r * 1.2
          );

          let targetX = ai.x;
          let targetY = ai.y;

          if (threats.length > 0) {
            // 逃离威胁
            const nearestThreat = threats.reduce((nearest, threat) => {
              const d = Math.sqrt((threat.x - ai.x) ** 2 + (threat.y - ai.y) ** 2);
              if (!nearest || d < nearest.dist) return { threat, dist: d };
              return nearest;
            }, null as any);

            if (nearestThreat && nearestThreat.dist < 150) {
              targetX = ai.x - (nearestThreat.threat.x - ai.x);
              targetY = ai.y - (nearestThreat.threat.y - ai.y);
            }
          } else if (nearestFood) {
            // 追逐食物
            targetX = nearestFood.x;
            targetY = nearestFood.y;
          }

          const mdx = targetX - ai.x;
          const mdy = targetY - ai.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
          if (mdist > 5) {
            ai.x += (mdx / mdist) * speed;
            ai.y += (mdy / mdist) * speed;
          }
        } else if (aiDifficulty === 'hard') {
          // Hard: 智能目标选择 - 追逐小玩家，避开大玩家，优先食物集群
          const allTargets = [...aiPlayers, p].filter(other => other !== ai);
          const smallerTargets = allTargets.filter(other => other.r < ai.r * 0.8);
          const largerTargets = allTargets.filter(other => other.r > ai.r * 1.1);

          let targetX = ai.x;
          let targetY = ai.y;

          // 优先逃离大玩家
          if (largerTargets.length > 0) {
            const nearestThreat = largerTargets.reduce((nearest, threat) => {
              const d = Math.sqrt((threat.x - ai.x) ** 2 + (threat.y - ai.y) ** 2);
              if (!nearest || d < nearest.dist) return { threat, dist: d };
              return nearest;
            }, null as any);

            if (nearestThreat && nearestThreat.dist < 200) {
              targetX = ai.x * 2 - nearestThreat.threat.x;
              targetY = ai.y * 2 - nearestThreat.threat.y;
            }
          } else if (smallerTargets.length > 0) {
            // 追逐可以吃掉的玩家
            const nearestPrey = smallerTargets.reduce((nearest, prey) => {
              const d = Math.sqrt((prey.x - ai.x) ** 2 + (prey.y - ai.y) ** 2);
              if (!nearest || d < nearest.dist) return { prey, dist: d };
              return nearest;
            }, null as any);

            if (nearestPrey) {
              targetX = nearestPrey.prey.x;
              targetY = nearestPrey.prey.y;
            }
          } else {
            // 寻找食物
            let nearestFood = null;
            let minDist = Infinity;
            state.current.foods.forEach(f => {
              const d = Math.sqrt((f.x - ai.x) ** 2 + (f.y - ai.y) ** 2);
              if (d < minDist) {
                minDist = d;
                nearestFood = f;
              }
            });
            if (nearestFood) {
              targetX = nearestFood.x;
              targetY = nearestFood.y;
            }
          }

          const hdx = targetX - ai.x;
          const hdy = targetY - ai.y;
          const hdist = Math.sqrt(hdx * hdx + hdy * hdy);
          if (hdist > 5) {
            ai.x += (hdx / hdist) * speed;
            ai.y += (hdy / hdist) * speed;
          }
        }

        // 限制在世界范围内
        ai.x = Math.max(ai.r, Math.min(WORLD_SIZE - ai.r, ai.x));
        ai.y = Math.max(ai.r, Math.min(WORLD_SIZE - ai.r, ai.y));
      });

      // --- 玩家吃食物 ---
      for (let i = state.current.foods.length - 1; i >= 0; i--) {
        const f = state.current.foods[i];
        const d = Math.sqrt((f.x - p.x) ** 2 + (f.y - p.y) ** 2);
        if (d < p.r) {
          const area = Math.PI * p.r * p.r + Math.PI * f.r * f.r;
          p.r = Math.sqrt(area / Math.PI);
          state.current.foods.splice(i, 1);
          addFood();
          setScore(Math.floor(p.r));
        }
      }

      // --- AI 吃食物 ---
      aiPlayers.forEach((ai) => {
        for (let i = state.current.foods.length - 1; i >= 0; i--) {
          const f = state.current.foods[i];
          const d = Math.sqrt((f.x - ai.x) ** 2 + (f.y - ai.y) ** 2);
          if (d < ai.r) {
            const area = Math.PI * ai.r * ai.r + Math.PI * f.r * f.r;
            ai.r = Math.sqrt(area / Math.PI);
            state.current.foods.splice(i, 1);
            addFood();
          }
        }
      });

      // --- 玩家吃 AI ---
      for (let i = aiPlayers.length - 1; i >= 0; i--) {
        const ai = aiPlayers[i];
        const d = Math.sqrt((ai.x - p.x) ** 2 + (ai.y - p.y) ** 2);
        if (d < p.r && ai.r < p.r * 0.8) {
          const area = Math.PI * p.r * p.r + Math.PI * ai.r * ai.r;
          p.r = Math.sqrt(area / Math.PI);
          aiPlayers.splice(i, 1);
          setScore(Math.floor(p.r));

          // 3秒后重生AI
          setTimeout(() => {
            if (state.current.aiPlayers.length < aiCount) {
              state.current.aiPlayers.push(createAIPlayer());
            }
          }, 3000);
        }
      }

      // --- AI 吃玩家 (游戏结束) ---
      for (const ai of aiPlayers) {
        const d = Math.sqrt((ai.x - p.x) ** 2 + (ai.y - p.y) ** 2);
        if (d < ai.r && p.r < ai.r * 0.8) {
          setIsPlaying(false);
          unlock();
          break;
        }
      }

      // --- AI 互相吃 ---
      for (let i = aiPlayers.length - 1; i >= 0; i--) {
        const ai1 = aiPlayers[i];
        for (let j = aiPlayers.length - 1; j >= 0; j--) {
          if (i === j) continue;
          const ai2 = aiPlayers[j];
          const d = Math.sqrt((ai1.x - ai2.x) ** 2 + (ai1.y - ai2.y) ** 2);
          if (d < ai1.r && ai2.r < ai1.r * 0.8) {
            const area = Math.PI * ai1.r * ai1.r + Math.PI * ai2.r * ai2.r;
            ai1.r = Math.sqrt(area / Math.PI);
            aiPlayers.splice(j, 1);

            // 重生被吃的AI
            setTimeout(() => {
              if (state.current.aiPlayers.length < aiCount) {
                state.current.aiPlayers.push(createAIPlayer());
              }
            }, 3000);
            break;
          }
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
      for (let x = 0; x <= WORLD_SIZE; x += 50) { c.moveTo(x, 0); c.lineTo(x, WORLD_SIZE); }
      for (let y = 0; y <= WORLD_SIZE; y += 50) { c.moveTo(0, y); c.lineTo(WORLD_SIZE, y); }
      c.stroke();

      // Draw Food
      state.current.foods.forEach(f => {
        c.fillStyle = f.color;
        c.beginPath(); c.arc(f.x, f.y, f.r, 0, Math.PI * 2); c.fill();
      });

      // Draw AI Players
      state.current.aiPlayers.forEach(ai => {
        c.fillStyle = ai.color;
        c.beginPath();
        c.arc(ai.x, ai.y, ai.r, 0, Math.PI * 2);
        c.fill();

        // AI cell shine (slightly different)
        c.fillStyle = 'rgba(255,255,255,0.15)';
        c.beginPath();
        c.arc(ai.x - ai.r * 0.2, ai.y - ai.r * 0.2, ai.r * 0.3, 0, Math.PI * 2);
        c.fill();
      });

      // Draw Player
      const p = state.current.player;
      c.fillStyle = p.color;
      c.beginPath(); c.arc(p.x, p.y, p.r, 0, Math.PI * 2); c.fill();

      // Cell Details (Shine/Glow)
      c.fillStyle = 'rgba(255,255,255,0.2)';
      c.beginPath(); c.arc(p.x - p.r * 0.2, p.y - p.r * 0.2, p.r * 0.4, 0, Math.PI * 2); c.fill();

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
        c.moveTo(state.current.width / 2, state.current.height / 2);
        c.lineTo(vx, vy);
        c.stroke();
      }
    };

    if (isPlaying) {
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
        if (rect) {
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

  // 创建AI玩家
  const createAIPlayer = (): Blob => {
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#8b5cf6', '#ec4899', '#14b8a6'];
    return {
      x: Math.random() * WORLD_SIZE,
      y: Math.random() * WORLD_SIZE,
      r: 15 + Math.random() * 10,
      color: colors[Math.floor(Math.random() * colors.length)],
      isAI: true
    };
  };

  const prepareGame = () => {
    // 重置状态
    setScore(0);
    state.current.player = { x: WORLD_SIZE / 2, y: WORLD_SIZE / 2, r: 20, color: '#3b82f6' };
    state.current.foods = [];
    for (let i = 0; i < 300; i++) addFood();

    // 初始化AI玩家
    state.current.aiPlayers = [];
    for (let i = 0; i < aiCount; i++) {
      state.current.aiPlayers.push(createAIPlayer());
    }

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
                  className={`text-9xl font-black ${countdown === 1 ? 'text-red-500' :
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
              <h1 className="text-5xl font-black text-slate-800 mb-2 drop-shadow-sm">{t('games.agar-io')}</h1>

              {isPaused && isPlaying ? (
                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                  <h2 className="text-2xl font-bold text-slate-600 mb-6 bg-white px-4 py-1 rounded-full shadow-sm">{t('common.pause', { defaultValue: 'PAUSED' })}</h2>
                  <button onClick={() => { setIsPaused(false); requestLock(); }} className="px-10 py-4 bg-blue-500 text-white rounded-full font-bold shadow-lg hover:bg-blue-600 hover:scale-105 transition-all flex items-center gap-3">
                    <Play fill="currentColor" /> {t('common.resume', { defaultValue: 'Resume' })}
                  </button>
                  <p className="mt-4 text-slate-500 text-sm">{t('games.agario-resume-hint', { defaultValue: 'Press Space or Click to Resume' })}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  {/* AI Settings */}
                  <div className="bg-white/90 p-6 rounded-xl shadow-lg mb-6 w-80">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">{t('common.ai_settings', { defaultValue: 'AI Settings' })}</h3>

                    {/* AI Count */}
                    <div className="mb-4">
                      <label className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-slate-700">{t('common.ai_count', { defaultValue: 'AI Players:' })}</span>
                        <span className="text-lg font-bold text-blue-600">{aiCount}</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={aiCount}
                        onChange={(e) => setAiCount(Number(e.target.value))}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                      />
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>0</span>
                        <span>10</span>
                      </div>
                    </div>

                    {/* AI Difficulty */}
                    <div>
                      <label className="text-sm font-semibold text-slate-700 block mb-2">{t('common.difficulty', { defaultValue: 'Difficulty:' })}</label>
                      <div className="flex gap-2">
                        {(['easy', 'medium', 'hard'] as AIDifficulty[]).map((diff) => (
                          <button
                            key={diff}
                            onClick={() => setAiDifficulty(diff)}
                            className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${aiDifficulty === diff
                                ? diff === 'easy' ? 'bg-green-500 text-white shadow-md'
                                  : diff === 'medium' ? 'bg-yellow-500 text-white shadow-md'
                                    : 'bg-red-500 text-white shadow-md'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                          >
                            {diff.charAt(0).toUpperCase() + diff.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <p className="mb-8 text-slate-500 font-medium">{t('games.agario-hint', { defaultValue: 'Grow your cell by eating dots!' })}</p>
                  <button onClick={prepareGame} className="px-12 py-5 bg-blue-600 text-white rounded-full font-black text-xl shadow-xl hover:bg-blue-500 hover:scale-105 transition-all flex items-center gap-3">
                    <Play fill="currentColor" /> {t('common.start_game')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Score HUD */}
          <div className="absolute top-4 left-4 bg-white/80 backdrop-blur px-4 py-2 rounded-lg font-mono font-bold text-slate-700 border border-slate-200 shadow-sm pointer-events-none">
            {t('games.agario-size', { defaultValue: 'Size:' })} {score}
          </div>

          {/* Instructions HUD */}
          {isPlaying && !isPaused && countdown === 0 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-slate-400/50 text-xs font-bold pointer-events-none">
              {t('games.agario-pause-hint', { defaultValue: 'PRESS SPACE TO PAUSE' })}
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-6 text-slate-400 text-sm">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-slate-200 rounded"><MousePointer2 size={16} /></div>
            <span>{t('games.agario-move-hint', { defaultValue: 'Mouse to Move' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="p-1 bg-slate-200 rounded font-mono text-xs px-2">SPACE</div>
            <span>{t('games.agario-space-hint', { defaultValue: 'Pause / Menu' })}</span>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}