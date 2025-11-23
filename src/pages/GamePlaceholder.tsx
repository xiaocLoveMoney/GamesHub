
import { useParams } from 'react-router';
import { games } from '../lib/games';
import { Gamepad2 } from 'lucide-react';
import PageTransition from '../components/PageTransition';

export default function GamePlaceholder() {
  const { id } = useParams();
  const game = games.find(g => g.id === id);

  if (!game) return <div>游戏未找到</div>;

  return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center h-[60vh] bg-white rounded-3xl shadow-sm border border-slate-100 p-10">
        <div className="p-8 bg-slate-50 rounded-full mb-6">
          <game.icon size={64} className="text-slate-400" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">{game.name}</h1>
        <p className="text-slate-500 mb-8">该游戏正在开发中...</p>
        
        <button className="px-6 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors flex items-center gap-2">
          <Gamepad2 size={18} />
          开始模拟
        </button>
      </div>
    </PageTransition>
  );
}
