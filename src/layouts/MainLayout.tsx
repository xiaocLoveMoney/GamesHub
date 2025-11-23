
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, LayoutDashboard, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { games } from '../lib/games';
import { cn } from '../lib/utils';

export default function MainLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  // 侧边栏宽度配置
  const sidebarWidth = isCollapsed ? 80 : 260;

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden">
      
      {/* 左侧导航栏 */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarWidth }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative h-screen bg-white border-r border-slate-200 z-20 flex flex-col shadow-xl shadow-slate-200/50"
      >
        {/* Logo 区域 */}
        <div className="h-16 flex items-center justify-center border-b border-slate-100 relative overflow-hidden">
           <motion.div 
             className="flex items-center gap-3 font-bold text-xl text-slate-800 whitespace-nowrap absolute left-6"
             animate={{ opacity: isCollapsed ? 0 : 1, x: isCollapsed ? -20 : 0 }}
           >
             <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white">
                G
             </div>
             <span>GameHub</span>
           </motion.div>
           
           {/* 折叠时的简略 Logo */}
           <motion.div
             className="absolute inset-0 flex items-center justify-center"
             animate={{ opacity: isCollapsed ? 1 : 0, scale: isCollapsed ? 1 : 0.5 }}
           >
             <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold">
                G
             </div>
           </motion.div>
        </div>

        {/* 导航列表 */}
        <div className="flex-1 overflow-y-auto py-4 scrollbar-hide">
          <nav className="space-y-1 px-3">
            {/* 控制台首页 */}
            <NavLink to="/" end>
              {({ isActive }) => (
                <NavDurationItem 
                  icon={LayoutDashboard} 
                  label="控制台首页" 
                  isActive={isActive} 
                  isCollapsed={isCollapsed} 
                />
              )}
            </NavLink>

            <div className={cn("mt-6 mb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider transition-opacity", isCollapsed && "opacity-0 hidden")}>
              经典游戏
            </div>
            
            {/* 游戏列表 */}
            {games.map((game) => (
              <NavLink key={game.id} to={`/game/${game.id}`}>
                {({ isActive }) => (
                  <NavDurationItem 
                    icon={game.icon} 
                    label={game.name} 
                    isActive={isActive} 
                    isCollapsed={isCollapsed} 
                  />
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* 底部折叠按钮 */}
        <div className="p-4 border-t border-slate-100 flex justify-end">
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            >
              {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
        </div>
      </motion.aside>

      {/* 右侧内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部 Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 z-10">
           <div className="flex items-center gap-4">
              {/* 移动端汉堡按钮 (可扩展) */}
              <button className="md:hidden p-2 -ml-2 hover:bg-slate-100 rounded-lg">
                <Menu size={20} />
              </button>
              <div className="hidden md:flex items-center gap-2 text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full text-sm">
                 <Search size={14} />
                 <span>搜索游戏...</span>
              </div>
           </div>
           <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-400 to-purple-400 shadow-md" />
           </div>
        </header>

        {/* 主视图区域 */}
        <main className="flex-1 overflow-y-auto p-6 relative">
          {/* 
            使用 AnimatePresence 实现路由切换动画 
            注意：在 React Router v6/7 中，直接包裹 Outlet 并使用 location.pathname 作为 key 是最简单的方式
          */}
          <AnimatePresence mode="wait">
            {/* 使用 cloneElement 或 div 包裹赋予 key */}
            <motion.div key={location.pathname} className="h-full">
               <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}

/**
 * 导航项组件 - 处理复杂的交互样式
 */
function NavDurationItem({ icon: Icon, label, isActive, isCollapsed }: { icon: any, label: string, isActive: boolean, isCollapsed: boolean }) {
  return (
    <div className={cn(
      "relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group overflow-hidden whitespace-nowrap",
      isActive ? "bg-indigo-50 text-indigo-600" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    )}>
      {/* 激活状态下的左侧指示条 */}
      {isActive && (
        <motion.div 
          layoutId="activeNavIndicator"
          className="absolute left-0 w-1 h-6 bg-indigo-500 rounded-r-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
      
      <Icon size={22} className={cn("shrink-0 transition-transform duration-300", isActive && "scale-110")} />
      
      <motion.span 
        animate={{ opacity: isCollapsed ? 0 : 1, width: isCollapsed ? 0 : 'auto' }}
        className="font-medium text-sm overflow-hidden"
      >
        {label}
      </motion.span>

      {/* 悬浮提示 (Tooltip)，仅在折叠时显示 (简化版，实际可用 shadcn Tooltip) */}
      {isCollapsed && (
        <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
          {label}
        </div>
      )}
    </div>
  );
}
