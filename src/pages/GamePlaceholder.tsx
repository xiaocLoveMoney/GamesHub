
import { useParams, useNavigate } from 'react-router';
import { games, lanGames } from '../lib/games';
import { Gamepad2, Lock, Zap } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import { Button } from '../components/ui/button';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';

export default function GamePlaceholder() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const allGames = [...games, ...lanGames];
  const game = allGames.find(g => g.id === id);

  if (!game) return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center h-[60vh] bg-white rounded-3xl shadow-sm border border-slate-100 p-10">
        <div className="p-8 bg-slate-50 rounded-full mb-6">
          <Gamepad2 size={64} className="text-slate-400" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">{t('common.no_results')}</h1>
        <p className="text-slate-500 mb-8">{t('lobby.coming_soon')}</p>
        <Button 
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl transition-colors"
        >
          {t('common.dashboard')}
        </Button>
      </div>
    </PageTransition>
  );

  const isDeveloping = game.status === 'developing';

  return (
    <PageTransition>
      <div className="flex flex-col items-center justify-center h-[60vh] bg-gradient-to-br from-slate-50 to-white rounded-3xl shadow-sm border border-slate-100 p-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className={`p-8 rounded-full mb-6 ${isDeveloping ? 'bg-yellow-50' : 'bg-slate-50'}`}
        >
          <game.icon size={64} className={isDeveloping ? 'text-yellow-600' : 'text-slate-400'} />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-3xl font-bold text-slate-800 mb-2 text-center"
        >
          {game.name}
        </motion.h1>

        {isDeveloping ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="text-center"
          >
            <div className="inline-block mb-4 px-4 py-2 bg-yellow-100 rounded-full">
              <span className="text-yellow-700 font-semibold text-sm flex items-center gap-2">
                <Zap size={16} />
                {t('lobby.in_development')}
              </span>
            </div>
            <p className="text-slate-500 mb-8 text-lg">{t('lobby.coming_soon')}</p>
            <p className="text-slate-400 text-sm mb-8 max-w-sm">
              {t('common.classic_games')} {game.name} {t('lobby.in_development')} {t('lobby.coming_soon')}
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <p className="text-slate-500 mb-8">{t('lobby.coming_soon')}</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="flex gap-4"
        >
          <Button 
            onClick={() => navigate('/')}
            variant="outline"
            className="px-6 py-3 rounded-xl"
          >
            ← {t('common.dashboard')}
          </Button>
          
          {isDeveloping && (
            <div className="px-6 py-3 bg-slate-200 text-slate-600 rounded-xl flex items-center gap-2 cursor-not-allowed">
              <Lock size={18} />
              {t('lobby.coming_soon')}
            </div>
          )}
        </motion.div>
      </div>
    </PageTransition>
  );
}
