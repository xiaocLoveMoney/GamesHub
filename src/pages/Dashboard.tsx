import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Clock, Users, Cpu, Trophy } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useTranslation } from 'react-i18next';
import PageTransition from '../components/PageTransition';
import { playtimeService } from '../services/playtimeService';
import { games } from '../lib/games';

const CHART_COLORS = [
  '#8b5cf6', // Indigo
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#6366f1', // Indigo
  '#84cc16', // Lime
  '#06b6d4', // Cyan
  '#d946ef', // Fuchsia
];

export default function Dashboard() {
  const { t } = useTranslation();
  const [playtimeData, setPlaytimeData] = useState<any[]>([]);
  const [todayPlaytime, setTodayPlaytime] = useState(0);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Initialize mock data if needed
    playtimeService.initMockData();

    // Load data
    setPlaytimeData(playtimeService.getLast7DaysPlaytime());
    setTodayPlaytime(playtimeService.getTodayTotalPlaytime());

    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Gauge Chart Data
  const dailyGoal = 60; // 60 minutes goal
  const gaugeData = [
    { name: 'Completed', value: Math.min(todayPlaytime, dailyGoal) },
    { name: 'Remaining', value: Math.max(0, dailyGoal - todayPlaytime) }
  ];
  const gaugeColors = ['#8b5cf6', '#f1f5f9']; // Indigo-500, Slate-100

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{t('dashboard.title')}</h1>
            <span className="text-sm text-slate-500">{t('dashboard.welcome', { minutes: todayPlaytime })}</span>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-2xl font-mono font-bold text-slate-700">{time.toLocaleTimeString()}</div>
            <div className="text-xs text-slate-400">{time.toLocaleDateString()}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart 1: Playtime History (Stacked Area) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 min-h-[400px] flex flex-col"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-700 flex items-center gap-2">
                <Activity size={20} className="text-indigo-500" />
                {t('dashboard.playtime_history')}
              </h3>
            </div>
            <div className="flex-1 w-full h-full min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={playtimeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    {games.map((game, index) => (
                      <linearGradient key={game.id} id={`color-${game.id}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 500 }}
                    formatter={(value: number) => [`${Math.floor(value / 60)}m ${value % 60}s`, '']}
                    labelStyle={{ color: '#64748b', marginBottom: '8px' }}
                  />
                  {games.map((game, index) => (
                    <Area
                      key={game.id}
                      type="monotone"
                      dataKey={game.id}
                      stackId="1"
                      stroke={CHART_COLORS[index % CHART_COLORS.length]}
                      fill={`url(#color-${game.id})`}
                      name={t(`games.${game.id}`)}
                      connectNulls
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Chart 2: Today's Playtime (Gauge) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center relative overflow-hidden"
          >
            <h3 className="font-bold text-slate-700 mb-4 w-full text-left flex items-center gap-2">
              <Trophy size={20} className="text-yellow-500" />
              {t('dashboard.today_goal')}
            </h3>

            <div className="relative w-64 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={gaugeData}
                    cx="50%"
                    cy="50%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={80}
                    outerRadius={100}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    {gaugeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={gaugeColors[index % gaugeColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-10">
                <span className="text-4xl font-bold text-slate-800">{todayPlaytime}</span>
                <span className="text-sm text-slate-400">/ {dailyGoal} min</span>
              </div>
            </div>

            <p className="text-sm text-slate-500 text-center mt-4">
              {todayPlaytime >= dailyGoal ? t('dashboard.completed') : t('dashboard.remaining')}
            </p>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Users size={24} />
              </div>
              <div>
                <div className="text-indigo-100 text-sm">{t('dashboard.total_visitors')}</div>
                <div className="text-2xl font-bold">12,345</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-orange-50 text-orange-500 rounded-xl">
              <Clock size={24} />
            </div>
            <div>
              <div className="text-slate-500 text-sm">{t('dashboard.system_uptime')}</div>
              <div className="text-xl font-bold text-slate-800">24h 12m</div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-green-50 text-green-500 rounded-xl">
              <Cpu size={24} />
            </div>
            <div>
              <div className="text-slate-500 text-sm">{t('dashboard.memory_status')}</div>
              <div className="text-xl font-bold text-slate-800">{t('dashboard.status_good')}</div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
