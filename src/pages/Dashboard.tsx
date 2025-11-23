
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Clock, Users, Cpu } from 'lucide-react';
import PageTransition from '../components/PageTransition';

export default function Dashboard() {
  const [time, setTime] = useState(new Date());
  const [memory, setMemory] = useState(42);
  const [visitors, setVisitors] = useState(1234);

  // 模拟数据更新
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    const memTimer = setInterval(() => {
      setMemory(prev => Math.min(90, Math.max(20, prev + (Math.random() * 10 - 5))));
    }, 2000);
    const visitorTimer = setInterval(() => {
      setVisitors(prev => prev + Math.floor(Math.random() * 3));
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(memTimer);
      clearInterval(visitorTimer);
    };
  }, []);

  const stats = [
    {
      label: '运行时间',
      value: time.toLocaleTimeString(),
      icon: Clock,
      color: 'text-blue-500',
      bg: 'bg-blue-50'
    },
    {
      label: '实时访客',
      value: visitors.toLocaleString(),
      icon: Users,
      color: 'text-green-500',
      bg: 'bg-green-50'
    },
    {
      label: '内存占用',
      value: `${memory.toFixed(1)}%`,
      icon: Cpu,
      color: 'text-purple-500',
      bg: 'bg-purple-50',
      progress: memory
    },
    {
      label: '系统状态',
      value: '运行正常',
      icon: Activity,
      color: 'text-orange-500',
      bg: 'bg-orange-50'
    }
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">控制台首页</h1>
          <span className="text-sm text-slate-500">系统监控中</span>
        </div>

        {/* 状态卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color}`}>
                  <stat.icon size={24} />
                </div>
                {stat.progress && (
                  <div className="flex h-2 w-12 rounded-full bg-slate-100 overflow-hidden">
                    <motion.div 
                      className="bg-purple-500 h-full"
                      animate={{ width: `${stat.progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                )}
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-1 font-mono">
                {stat.value}
              </div>
              <div className="text-sm text-slate-500 font-medium">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>

        {/* 装饰性图表区域 (模拟) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 h-64 flex flex-col justify-center items-center text-slate-400"
          >
            <Activity size={48} className="mb-4 opacity-20" />
            <p>实时流量趋势图 (模拟)</p>
          </motion.div>
          <motion.div 
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             transition={{ delay: 0.5 }}
             className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-64 flex flex-col justify-center items-center text-slate-400"
          >
            <Users size={48} className="mb-4 opacity-20" />
            <p>用户分布 (模拟)</p>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
}
