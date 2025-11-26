import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Menu, LayoutDashboard, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { games } from '../lib/games';
import { cn } from '../lib/utils';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

export default function MainLayout() {
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth < 768);
  const location = useLocation();
  const { t } = useTranslation();

  // 侧边栏宽度配置
  const sidebarWidth = isCollapsed && window.innerWidth >= 768 ? 80 : 260;

  // 搜索相关状态
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const navigate = useNavigate();

  // 搜索逻辑
  const searchResults = games.filter(game =>
    t(`games.${game.id}`).toLowerCase().includes(searchQuery.toLowerCase()) ||
    game.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGameClick = (gameId: string) => {
    navigate(`/game/${gameId}`);
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800 overflow-hidden">

      {/* 左侧导航栏 - 移动端遮罩 */}
      {isCollapsed === false && (
        <div
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}

      {/* 左侧导航栏 */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarWidth,
          x: window.innerWidth < 768 && isCollapsed ? -sidebarWidth : 0
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed md:relative h-screen bg-white border-r border-slate-200 z-20 flex flex-col shadow-xl shadow-slate-200/50"
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
                  label={t('common.dashboard')}
                  isActive={isActive}
                  isCollapsed={isCollapsed}
                />
              )}
            </NavLink>

            <div className={cn("mt-6 mb-2 px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider transition-opacity", isCollapsed && "opacity-0 hidden")}>
              {t('common.classic_games')}
            </div>

            {/* 游戏列表 */}
            {games.map((game) => (
              <NavLink key={game.id} to={`/game/${game.id}`}>
                {({ isActive }) => (
                  <NavDurationItem
                    icon={game.icon}
                    label={t(`games.${game.id}`)}
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
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-6 z-10 relative">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            {/* 移动端汉堡按钮 (可扩展) */}
            <button
              className="md:hidden p-2 -ml-2 hover:bg-slate-100 rounded-lg"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <Menu size={20} />
            </button>

            {/* 搜索框区域 */}
            <div className="relative flex-1 max-w-md group">
              <div className="flex items-center gap-2 text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full text-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:bg-white transition-all border border-transparent focus-within:border-indigo-100">
                <Search size={14} className="group-focus-within:text-indigo-500" />
                <input
                  type="text"
                  placeholder={t('common.search_placeholder')}
                  className="bg-transparent border-none outline-none w-full placeholder:text-slate-400 text-slate-700"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)} // 延迟关闭以允许点击
                />
              </div>

              {/* 搜索结果下拉框 */}
              <AnimatePresence>
                {isSearchFocused && searchQuery && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50"
                  >
                    <div className="max-h-64 overflow-y-auto py-2">
                      {searchResults.length > 0 ? (
                        searchResults.map(game => (
                          <div
                            key={game.id}
                            onClick={() => handleGameClick(game.id)}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-indigo-50 cursor-pointer transition-colors group/item"
                          >
                            <div className="p-2 bg-slate-100 rounded-lg text-slate-500 group-hover/item:bg-indigo-100 group-hover/item:text-indigo-600 transition-colors">
                              <game.icon size={18} />
                            </div>
                            <span className="text-sm font-medium text-slate-700 group-hover/item:text-indigo-700">
                              {t(`games.${game.id}`)}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-8 text-center text-slate-400 text-sm">
                          {t('common.no_results')}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
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
