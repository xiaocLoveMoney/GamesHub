
import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { RefreshCw, CheckCircle2, Timer } from 'lucide-react';
import { cn } from '../../lib/utils';
import PageTransition from '../../components/PageTransition';

// 游戏图标集
const EMOJIS = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼'];

interface Card {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function MemoryMatch() {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);

  // 初始化游戏
  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const duplicatedEmojis = [...EMOJIS, ...EMOJIS];
    const shuffled = duplicatedEmojis
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        isFlipped: false,
        isMatched: false,
      }));
    setCards(shuffled);
    setFlippedCards([]);
    setMoves(0);
    setGameWon(false);
  };

  const handleCardClick = (id: number) => {
    // 防止点击已翻开、已匹配或正在处理两张翻牌的情况
    if (
      flippedCards.length === 2 ||
      cards.find((c) => c.id === id)?.isFlipped ||
      cards.find((c) => c.id === id)?.isMatched
    ) {
      return;
    }

    const newCards = cards.map((card) =>
      card.id === id ? { ...card, isFlipped: true } : card
    );
    setCards(newCards);

    const newFlipped = [...flippedCards, id];
    setFlippedCards(newFlipped);

    if (newFlipped.length === 2) {
      setMoves((prev) => prev + 1);
      checkForMatch(newFlipped, newCards);
    }
  };

  const checkForMatch = (flippedIds: number[], currentCards: Card[]) => {
    const [firstId, secondId] = flippedIds;
    const firstCard = currentCards.find((c) => c.id === firstId);
    const secondCard = currentCards.find((c) => c.id === secondId);

    if (firstCard?.emoji === secondCard?.emoji) {
      // 匹配成功
      setCards((prev) =>
        prev.map((card) =>
          card.id === firstId || card.id === secondId
            ? { ...card, isMatched: true }
            : card
        )
      );
      setFlippedCards([]);
      
      // 检查是否全部匹配
      if (currentCards.filter(c => !c.isMatched).length === 2) {
         setGameWon(true);
      }
    } else {
      // 匹配失败，延迟翻回
      setTimeout(() => {
        setCards((prev) =>
          prev.map((card) =>
            card.id === firstId || card.id === secondId
              ? { ...card, isFlipped: false }
              : card
          )
        );
        setFlippedCards([]);
      }, 1000);
    }
  };

  return (
    <PageTransition>
      <div className="flex flex-col items-center py-8">
        <div className="flex items-center justify-between w-full max-w-2xl mb-8 px-4">
          <div>
             <h2 className="text-3xl font-bold text-slate-800">记忆翻牌</h2>
             <p className="text-slate-500">寻找相同的两张卡片</p>
          </div>
          <div className="flex items-center gap-4 text-slate-600 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
             <div className="flex items-center gap-2">
               <Timer size={18} />
               <span className="font-mono font-bold text-lg">{moves}</span> 步
             </div>
             <button 
               onClick={initializeGame}
               className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
             >
               <RefreshCw size={18} />
             </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3 sm:gap-4 w-full max-w-2xl px-4">
          {cards.map((card) => (
            <div key={card.id} className="aspect-square perspective-1000">
               <motion.div
                 className="w-full h-full relative preserve-3d cursor-pointer"
                 animate={{ rotateY: card.isFlipped || card.isMatched ? 180 : 0 }}
                 transition={{ duration: 0.4, type: 'spring', stiffness: 260, damping: 20 }}
                 onClick={() => handleCardClick(card.id)}
               >
                  {/* 卡片背面 (未翻开) */}
                  <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md border-2 border-white/20 flex items-center justify-center">
                     <span className="text-2xl text-white/30 font-bold">?</span>
                  </div>

                  {/* 卡片正面 (已翻开) */}
                  <div className={cn(
                    "absolute inset-0 backface-hidden bg-white rounded-xl shadow-md border-2 flex items-center justify-center text-4xl rotate-y-180 transition-colors duration-500",
                    card.isMatched ? "border-green-400 bg-green-50 shadow-green-100" : "border-indigo-100"
                  )}>
                     {card.emoji}
                     {card.isMatched && (
                       <motion.div 
                         initial={{ scale: 0 }} 
                         animate={{ scale: 1 }}
                         className="absolute top-1 right-1 text-green-500"
                       >
                         <CheckCircle2 size={16} />
                       </motion.div>
                     )}
                  </div>
               </motion.div>
            </div>
          ))}
        </div>

        {gameWon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
          >
            <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center">
               <div className="text-6xl mb-4">🎉</div>
               <h3 className="text-2xl font-bold text-slate-800 mb-2">挑战成功!</h3>
               <p className="text-slate-500 mb-6">你用了 {moves} 步完成了记忆挑战。</p>
               <button 
                 onClick={initializeGame}
                 className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
               >
                 再玩一次
               </button>
            </div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
}
