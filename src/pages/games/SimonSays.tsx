
import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Play, RefreshCw, BrainCircuit } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PageTransition from '../../components/PageTransition';
import { cn } from '../../lib/utils';

type Color = 'green' | 'red' | 'yellow' | 'blue';
const COLORS: Color[] = ['green', 'red', 'yellow', 'blue'];

export default function SimonSays() {
  const { t } = useTranslation();
  const [sequence, setSequence] = useState<Color[]>([]);
  const [userSequence, setUserSequence] = useState<Color[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUserTurn, setIsUserTurn] = useState(false);
  const [activeColor, setActiveColor] = useState<Color | null>(null);
  const [message, setMessage] = useState(t('common.click_to_start'));
  const [score, setScore] = useState(0);

  const isPlayingRef = useRef(false);

  const startGame = () => {
    setSequence([]);
    setUserSequence([]);
    setScore(0);
    setIsPlaying(true);
    isPlayingRef.current = true;
    setMessage(t('common.watch_carefully'));
    nextRound([]); // 传入空数组开始第一轮
  };

  const nextRound = async (currentSeq: Color[]) => {
    setIsUserTurn(false);
    setMessage(t('common.remember_color_order'));
    
    // 增加一个新颜色
    const nextColor = COLORS[Math.floor(Math.random() * 4)];
    const newSequence = [...currentSeq, nextColor];
    setSequence(newSequence);

    // 播放序列
    await new Promise(resolve => setTimeout(resolve, 800)); // 等待一点时间再开始
    
    for (const color of newSequence) {
      if (!isPlayingRef.current) return;
      setActiveColor(color);
      await new Promise(resolve => setTimeout(resolve, 500)); // 亮灯时间
      setActiveColor(null);
      await new Promise(resolve => setTimeout(resolve, 200)); // 间隔时间
    }

    if (!isPlayingRef.current) return;
    
    setIsUserTurn(true);
    setUserSequence([]);
    setMessage(t('common.your_turn'));
  };

  const handleColorClick = (color: Color) => {
    if (!isUserTurn || !isPlaying) return;

    // 亮一下反馈
    setActiveColor(color);
    setTimeout(() => setActiveColor(null), 200);

    const newUserSeq = [...userSequence, color];
    setUserSequence(newUserSeq);

    // 检查这一步是否正确
    const currentIndex = newUserSeq.length - 1;
    if (color !== sequence[currentIndex]) {
      // 错误
      setGameOver();
      return;
    }

    // 检查是否完成整个序列
    if (newUserSeq.length === sequence.length) {
      setScore(s => s + 1);
      setIsUserTurn(false);
      setMessage(t('common.correct') + '! ' + t('common.next_round'));
      setTimeout(() => nextRound(sequence), 500);
    }
  };

  const setGameOver = () => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    setIsUserTurn(false);
    setMessage(t('common.game_over') + '! ' + t('common.score') + ': ' + score);
  };

  return (
    <PageTransition>
      <div className="flex flex-col items-center py-8 min-h-[calc(100vh-100px)]">
        
        {/* 头部 */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center justify-center gap-2 mb-2">
             <BrainCircuit size={24} className="text-indigo-500" /> {t('games.simon-says')}
          </h2>
          <p className={cn(
            "text-lg font-medium transition-colors",
            message.includes("失败") || message.includes("结束") ? "text-rose-500" : "text-slate-600"
          )}>
            {message}
          </p>
        </div>

        {/* 游戏盘 */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 bg-slate-900 rounded-full p-4 shadow-2xl mb-10">
          <div className="grid grid-cols-2 grid-rows-2 w-full h-full gap-2">
            <SimonBtn color="green" active={activeColor === 'green'} onClick={() => handleColorClick('green')} position="top-left" />
            <SimonBtn color="red" active={activeColor === 'red'} onClick={() => handleColorClick('red')} position="top-right" />
            <SimonBtn color="yellow" active={activeColor === 'yellow'} onClick={() => handleColorClick('yellow')} position="bottom-left" />
            <SimonBtn color="blue" active={activeColor === 'blue'} onClick={() => handleColorClick('blue')} position="bottom-right" />
          </div>
          
          {/* 中心控制台 */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-slate-800 rounded-full border-4 border-slate-900 flex items-center justify-center z-10 shadow-lg">
             {!isPlaying ? (
               <button 
                 onClick={startGame}
                 className="flex flex-col items-center justify-center w-full h-full rounded-full hover:bg-slate-700 transition-colors text-white"
               >
                 <Play size={24} fill="currentColor" className="mb-1" />
                 <span className="text-[10px] font-bold uppercase tracking-wide">Start</span>
               </button>
             ) : (
               <div className="text-center">
                 <div className="text-2xl font-mono font-bold text-white">{score}</div>
                 <div className="text-[8px] text-slate-400 uppercase">{t('common.score')}</div>
               </div>
             )}
          </div>
        </div>

        {/* 重新开始按钮 (仅在结束后显示) */}
        {!isPlaying && score > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={startGame}
            className="flex items-center gap-2 px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded-full hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw size={16} /> {t('common.replay')}
          </motion.button>
        )}
      </div>
    </PageTransition>
  );
}

function SimonBtn({ 
  color, 
  active, 
  onClick, 
  position 
}: { 
  color: Color, 
  active: boolean, 
  onClick: () => void, 
  position: string 
}) {
  const baseColors = {
    green: "bg-emerald-500",
    red: "bg-rose-500",
    yellow: "bg-amber-400",
    blue: "bg-indigo-500"
  };

  const activeColors = {
    green: "bg-emerald-300 shadow-[0_0_30px_rgba(52,211,153,0.6)]",
    red: "bg-rose-300 shadow-[0_0_30px_rgba(251,113,133,0.6)]",
    yellow: "bg-amber-200 shadow-[0_0_30px_rgba(251,191,36,0.6)]",
    blue: "bg-indigo-300 shadow-[0_0_30px_rgba(129,140,248,0.6)]"
  };

  const roundedClass = {
    "top-left": "rounded-tl-full",
    "top-right": "rounded-tr-full",
    "bottom-left": "rounded-bl-full",
    "bottom-right": "rounded-br-full"
  };

  return (
    <div 
      className={cn(
        "w-full h-full cursor-pointer transition-all duration-100 relative active:scale-[0.98]",
        baseColors[color],
        // @ts-ignore
        roundedClass[position],
        active ? activeColors[color] : "opacity-90 hover:opacity-100"
      )}
      onClick={onClick}
    />
  );
}
