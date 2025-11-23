import { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import PageTransition from '../../components/PageTransition';
import { cn } from '../../lib/utils';

// --- 类型定义 ---
type Tile = {
  id: number;
  val: number;
  r: number;
  c: number;
  isMerged?: boolean;
  isNew?: boolean;
};

// --- 样式与动画配置 ---

// 1. 物理参数：位移要有弹性，缩放要干脆
const SPRING_TRANSITION = {
  type: "spring",
  stiffness: 400,
  damping: 30,
  mass: 1
};

const POP_TRANSITION = {
  duration: 0.15,
  ease: "easeOut"
};

// 2. 方块颜色配置
const getTileStyle = (val: number) => {
  const base = "shadow-sm font-bold flex items-center justify-center rounded-lg select-none";
  
  const map: Record<number, string> = {
    2:    'bg-[#eee4da] text-[#776e65]',
    4:    'bg-[#ede0c8] text-[#776e65]',
    8:    'bg-[#f2b179] text-white',
    16:   'bg-[#f59563] text-white',
    32:   'bg-[#f67c5f] text-white',
    64:   'bg-[#f65e3b] text-white',
    128:  'bg-[#edcf72] text-white text-3xl shadow-[0_0_10px_rgba(237,207,114,0.6)]',
    256:  'bg-[#edcc61] text-white text-3xl shadow-[0_0_15px_rgba(237,204,97,0.7)]',
    512:  'bg-[#edc850] text-white text-3xl shadow-[0_0_20px_rgba(237,200,80,0.8)]',
    1024: 'bg-[#edc53f] text-white text-3xl shadow-[0_0_25px_rgba(237,197,63,0.8)]',
    2048: 'bg-[#edc22e] text-white text-4xl shadow-[0_0_30px_rgba(237,194,46,0.9)] ring-2 ring-[#edc22e]/50',
  };

  if (val > 2048) return `${base} bg-black text-white text-3xl shadow-[0_0_30px_rgba(0,0,0,0.7)]`;
  return `${base} ${map[val] || 'bg-[#3c3a32] text-white'}`;
};

// --- 子组件：Tile (修复了定位逻辑) ---
const GameTile = memo(({ tile }: { tile: Tile }) => {
  // 间距配置 (需与 grid 的 gap 保持一致，这里是 12px)
  const GAP_PX = 12;
  
  // 计算逻辑：使用 calc 动态计算位置
  // 容器总宽 100%。减去 3 个间隙 (3 * 12px)，剩下的除以 4 就是一个格子的宽。
  // 公式：(100% - 36px) / 4
  // 这里的计算稍微有些复杂，为了代码整洁，我们把逻辑写在 calc 字符串里
  
  // 单个格子的尺寸表达式
  const sizeExpr = `calc((100% - ${3 * GAP_PX}px) / 4)`;
  
  // 位置表达式：格子索引 * (格子宽 + 间隙)
  const leftExpr = `calc(${tile.c} * ((100% - ${3 * GAP_PX}px) / 4 + ${GAP_PX}px))`;
  const topExpr =  `calc(${tile.r} * ((100% - ${3 * GAP_PX}px) / 4 + ${GAP_PX}px))`;

  const animateState = tile.isMerged ? "merge" : "animate";

  return (
    <motion.div
      key={tile.id}
      initial={{ scale: 0, opacity: 0, left: leftExpr, top: topExpr }}
      animate={animateState}
      exit={{ scale: 0, opacity: 0, transition: { duration: 0.1 } }}
      variants={{
        animate: { 
          left: leftExpr, 
          top: topExpr, 
          scale: 1, 
          opacity: 1,
          zIndex: 10,
          transition: { left: SPRING_TRANSITION, top: SPRING_TRANSITION }
        },
        merge: {
          left: leftExpr,
          top: topExpr,
          scale: [1, 1.15, 1], // 碰撞的 Pop 效果
          opacity: 1,
          zIndex: 20, // 合并时层级提高
          transition: { 
            left: SPRING_TRANSITION, 
            top: SPRING_TRANSITION, 
            scale: POP_TRANSITION // 缩放使用特定的缓动
          }
        }
      }}
      className={cn("absolute", getTileStyle(tile.val))}
      style={{
        width: sizeExpr,
        height: sizeExpr,
        fontSize: tile.val > 1000 ? '1.5rem' : '2rem'
      }}
    >
      {tile.val}
    </motion.div>
  );
});

// --- 主逻辑 ---

export default function Game2048() {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const movingRef = useRef(false);

  useEffect(() => {
    const savedBest = localStorage.getItem('2048-best');
    if (savedBest) setBest(parseInt(savedBest));
    initGame();
  }, []);

  const initGame = () => {
    setTiles(generateStartTiles());
    setScore(0);
    setGameOver(false);
  };

  const generateStartTiles = () => {
    const t1 = createRandomTile([]);
    const t2 = createRandomTile([t1]);
    return [t1, t2];
  };

  const createRandomTile = (existingTiles: Tile[]): Tile => {
    const taken = new Set(existingTiles.map(t => `${t.r},${t.c}`));
    const empty = [];
    for(let r=0; r<4; r++){
      for(let c=0; c<4; c++){
        if(!taken.has(`${r},${c}`)) empty.push({r, c});
      }
    }
    if(empty.length === 0) throw new Error("No space");
    
    const pos = empty[Math.floor(Math.random() * empty.length)];
    return {
      id: Date.now() + Math.random(),
      val: Math.random() > 0.9 ? 4 : 2,
      r: pos.r,
      c: pos.c,
      isNew: true
    };
  };

  const move = (direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT') => {
    if (movingRef.current || gameOver) return;
    
    movingRef.current = true;
    setTimeout(() => { movingRef.current = false }, 100); 

    let currentTiles = [...tiles];
    let moved = false;
    let points = 0;
    const nextTiles: Tile[] = [];

    const processGroup = (group: Tile[]) => {
      const cleanGroup = group.map(t => ({...t, isMerged: false, isNew: false}));
      const newGroup: Tile[] = [];
      let skipNext = false;

      for (let i = 0; i < cleanGroup.length; i++) {
        if (skipNext) {
           skipNext = false;
           continue;
        }
        
        const t = cleanGroup[i];
        const nextT = cleanGroup[i+1];

        if (nextT && t.val === nextT.val) {
           const mergedVal = t.val * 2;
           points += mergedVal;
           moved = true;
           newGroup.push({ ...t, val: mergedVal, isMerged: true });
           skipNext = true; 
        } else {
           newGroup.push(t);
        }
      }
      return newGroup;
    };

    if (direction === 'LEFT' || direction === 'RIGHT') {
       for (let r = 0; r < 4; r++) {
         const rowTiles = currentTiles.filter(t => t.r === r);
         rowTiles.sort((a, b) => direction === 'LEFT' ? a.c - b.c : b.c - a.c);
         const processed = processGroup(rowTiles);
         processed.forEach((t, idx) => {
            const targetC = direction === 'LEFT' ? idx : 3 - idx;
            if (t.c !== targetC) moved = true;
            t.c = targetC;
            nextTiles.push(t);
         });
       }
    } else {
       for (let c = 0; c < 4; c++) {
         const colTiles = currentTiles.filter(t => t.c === c);
         colTiles.sort((a, b) => direction === 'UP' ? a.r - b.r : b.r - a.r);
         const processed = processGroup(colTiles);
         processed.forEach((t, idx) => {
            const targetR = direction === 'UP' ? idx : 3 - idx;
            if (t.r !== targetR) moved = true;
            t.r = targetR;
            nextTiles.push(t);
         });
       }
    }

    if (moved) {
       setScore(s => {
         const newS = s + points;
         if (newS > best) {
           setBest(newS);
           localStorage.setItem('2048-best', newS.toString());
         }
         return newS;
       });
       
       try {
         const newTile = createRandomTile(nextTiles);
         setTiles([...nextTiles, newTile]);
       } catch (e) {
         setTiles(nextTiles);
       }
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
       if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
         e.preventDefault();
         const map: any = { 'ArrowUp':'UP', 'ArrowDown':'DOWN', 'ArrowLeft':'LEFT', 'ArrowRight':'RIGHT' };
         move(map[e.key]);
       }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [tiles, gameOver]);

  return (
    <PageTransition>
      <div className="flex flex-col items-center py-10 min-h-[calc(100vh-100px)] bg-slate-50 select-none">
        <div className="w-full max-w-md px-6">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
             <div><h1 className="text-6xl font-extrabold text-slate-700 leading-tight">2048</h1></div>
             <div className="flex gap-3">
                <ScoreBox label="SCORE" value={score} />
                <ScoreBox label="BEST" value={best} isBest />
             </div>
          </div>
          
          <div className="flex justify-between items-center mb-6">
            <p className="text-slate-500 font-medium text-sm">Join numbers to get <span className="font-bold text-slate-700">2048</span>!</p>
            <button onClick={initGame} className="p-2.5 bg-slate-700 text-white rounded-md hover:bg-slate-600 active:scale-95 transition-all shadow-md">
               <RefreshCw size={20} />
            </button>
          </div>

          {/* Game Board */}
          <div className="relative bg-[#bbada0] p-3 rounded-lg shadow-xl touch-none mx-auto w-full aspect-square max-w-[400px]">
             {/* Static Grid Background */}
             <div className="grid grid-cols-4 grid-rows-4 gap-3 w-full h-full">
                {Array(16).fill(0).map((_, i) => (
                  <div key={i} className="bg-[#cdc1b4] rounded-md w-full h-full" />
                ))}
             </div>

             {/* Dynamic Tiles Layer */}
             <div className="absolute inset-3 pointer-events-none">
                <AnimatePresence>
                   {tiles.map((tile) => (
                     <GameTile key={tile.id} tile={tile} />
                   ))}
                </AnimatePresence>
             </div>
          </div>

          {/* Mobile Controls */}
          <div className="mt-8 grid grid-cols-3 gap-3 max-w-[220px] mx-auto sm:hidden">
             <div />
             <ControlBtn onClick={() => move('UP')} icon={<ArrowUp />} />
             <div />
             <ControlBtn onClick={() => move('LEFT')} icon={<ArrowLeft />} />
             <ControlBtn onClick={() => move('DOWN')} icon={<ArrowDown />} />
             <ControlBtn onClick={() => move('RIGHT')} icon={<ArrowRight />} />
          </div>

        </div>
      </div>
    </PageTransition>
  );
}

// --- Helpers ---
function ScoreBox({ label, value, isBest }: { label: string, value: number, isBest?: boolean }) {
  return (
    <div className={cn("rounded-md p-2 min-w-[70px] text-center relative overflow-hidden", isBest ? "bg-amber-500" : "bg-[#bbada0]")}>
      <div className="relative z-10">
        <div className="text-[10px] font-bold text-[#eee4da] uppercase tracking-wider mb-[-2px]">{label}</div>
        <div className="font-bold text-xl text-white">{value}</div>
      </div>
    </div>
  );
}

function ControlBtn({ onClick, icon }: { onClick: () => void, icon: React.ReactNode }) {
  return (
    <button onClick={onClick} className="p-4 bg-[#bbada0] text-white rounded-lg active:bg-[#9e8e81] active:scale-95 transition-all shadow-sm flex justify-center">
      {icon}
    </button>
  );
}