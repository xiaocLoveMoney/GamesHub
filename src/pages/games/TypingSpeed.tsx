
import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, Keyboard, Zap, Target } from 'lucide-react';
import PageTransition from '../../components/PageTransition';
import { cn } from '../../lib/utils';

const SENTENCES = [
  "The quick brown fox jumps over the lazy dog",
  "Pack my box with five dozen liquor jugs",
  "How vexingly quick daft zebras jump",
  "Sphinx of black quartz judge my vow",
  "React is a JavaScript library for building user interfaces",
  "TypeScript is a strongly typed programming language that builds on JavaScript",
  "Tailwind CSS is a utility-first CSS framework for rapidly building modern websites"
];

export default function TypingSpeed() {
  const [text, setText] = useState("");
  const [input, setInput] = useState("");
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [wpm, setWpm] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // 初始化游戏
  useEffect(() => {
    resetGame();
  }, []);

  const resetGame = () => {
    const randomText = SENTENCES[Math.floor(Math.random() * SENTENCES.length)];
    setText(randomText);
    setInput("");
    setStartTime(null);
    setEndTime(null);
    setWpm(0);
    // 自动聚焦
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    
    if (!startTime) {
      setStartTime(Date.now());
    }

    setInput(val);

    if (val === text) {
      const end = Date.now();
      setEndTime(end);
      const durationInMinutes = (end - (startTime || Date.now())) / 60000;
      const words = text.split(" ").length;
      setWpm(Math.round(words / durationInMinutes));
      inputRef.current?.blur();
    }
  };

  const focusInput = () => {
    inputRef.current?.focus();
  };

  // 计算字符状态
  const chars = useMemo(() => {
    return text.split('').map((char, index) => {
      let status = 'pending'; // pending, correct, incorrect
      if (index < input.length) {
        status = input[index] === char ? 'correct' : 'incorrect';
      }
      const isCurrent = index === input.length;
      return { char, status, isCurrent };
    });
  }, [text, input]);

  // 准确率计算
  const accuracy = useMemo(() => {
    if (input.length === 0) return 100;
    let correct = 0;
    for (let i = 0; i < input.length; i++) {
      if (input[i] === text[i]) correct++;
    }
    return Math.round((correct / input.length) * 100);
  }, [input, text]);

  return (
    <PageTransition>
      <div className="flex flex-col items-center py-10 min-h-[calc(100vh-100px)]">
        <div className="w-full max-w-3xl px-4">
          
          {/* 顶部数据栏 */}
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span className="p-2 bg-indigo-100 text-indigo-600 rounded-lg"><Keyboard size={20} /></span>
              打字测速
            </h2>
            
            <div className="flex gap-6">
              <div className="text-center">
                 <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">WPM</div>
                 <div className="text-2xl font-mono font-bold text-slate-800">{wpm > 0 ? wpm : '-'}</div>
              </div>
              <div className="text-center">
                 <div className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">准确率</div>
                 <div className="text-2xl font-mono font-bold text-slate-800">{accuracy}%</div>
              </div>
            </div>
          </div>

          {/* 游戏主区域 - 点击任意位置聚焦 */}
          <div 
            className={cn(
              "relative bg-white p-10 rounded-3xl shadow-sm border-2 transition-all cursor-text min-h-[200px] flex items-center",
              isFocused ? "border-indigo-500 shadow-indigo-100 ring-4 ring-indigo-50" : "border-slate-100"
            )}
            onClick={focusInput}
          >
            {/* 隐形输入框 */}
            <input
              ref={inputRef}
              type="text"
              className="absolute inset-0 opacity-0 w-full h-full cursor-default"
              value={input}
              onChange={handleInput}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={!!endTime}
              autoComplete="off"
            />

            <div className="text-2xl sm:text-3xl font-medium leading-relaxed tracking-wide font-mono break-words w-full select-none">
              {chars.map((item, i) => (
                <span 
                  key={i}
                  className={cn(
                    "relative transition-colors duration-100",
                    item.status === 'correct' && "text-slate-800",
                    item.status === 'incorrect' && "text-rose-500 bg-rose-50 rounded-sm",
                    item.status === 'pending' && "text-slate-300",
                    item.isCurrent && isFocused && "after:content-[''] after:absolute after:-left-[1px] after:top-1 after:bottom-1 after:w-[2px] after:bg-indigo-500 after:animate-pulse"
                  )}
                >
                  {item.char}
                </span>
              ))}
            </div>
            
            {!isFocused && !endTime && (
               <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-[1px] rounded-3xl">
                  <span className="text-slate-400 font-medium flex items-center gap-2">
                    <Target size={16} /> 点击此处开始输入
                  </span>
               </div>
            )}
          </div>

          {/* 结算/重置 */}
          <div className="mt-8 flex justify-center">
             {endTime ? (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="flex flex-col items-center gap-4"
               >
                 <div className="px-6 py-3 bg-green-50 text-green-700 rounded-xl flex items-center gap-2 border border-green-100">
                    <Zap size={20} /> 
                    <span>完成！你的速度是 <strong>{wpm} WPM</strong></span>
                 </div>
                 <button
                   onClick={resetGame}
                   className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
                 >
                   <RefreshCw size={18} /> 再来一局
                 </button>
               </motion.div>
             ) : (
               <button
                 onClick={resetGame}
                 className="flex items-center gap-2 px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
               >
                 <RefreshCw size={16} /> 换一句
               </button>
             )}
          </div>

        </div>
      </div>
    </PageTransition>
  );
}
