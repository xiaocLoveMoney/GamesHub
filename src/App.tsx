import { HashRouter, Route, Routes } from 'react-router';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import GamePlaceholder from './pages/GamePlaceholder';
import React, { Suspense } from 'react';

// 动态导入所有游戏（每个游戏单独chunk）
const TicTacToe = React.lazy(() => import('./pages/games/TicTacToe'))
const MemoryMatch = React.lazy(() => import('./pages/games/MemoryMatch'))
const WhackAMole = React.lazy(() => import('./pages/games/WhackAMole'))
const SimonSays = React.lazy(() => import('./pages/games/SimonSays'))
const TypingSpeed = React.lazy(() => import('./pages/games/TypingSpeed'))
const Snake = React.lazy(() => import('./pages/games/Snake'))
const Pong = React.lazy(() => import('./pages/games/Pong'))
const Breakout = React.lazy(() => import('./pages/games/Breakout'))
const FlappyBird = React.lazy(() => import('./pages/games/FlappyBird'))
const DinoRun = React.lazy(() => import('./pages/games/DinoRun'))
const Game2048 = React.lazy(() => import('./pages/games/Game2048'))
const Minesweeper = React.lazy(() => import('./pages/games/Minesweeper'))
const Sudoku = React.lazy(() => import('./pages/games/Sudoku'))
const SlidingPuzzle = React.lazy(() => import('./pages/games/SlidingPuzzle'))
const Tetris = React.lazy(() => import('./pages/games/Tetris'))
const FruitSlicer = React.lazy(() => import('./pages/games/FruitSlicer'))
const GameOfLife = React.lazy(() => import('./pages/games/GameOfLife'))
const MazeGenerator = React.lazy(() => import('./pages/games/MazeGenerator'))
const PacMan = React.lazy(() => import('./pages/games/PacMan'))
const Agario = React.lazy(() => import('./pages/games/Agario'))

// 加载中显示组件
const GameLoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading game...</p>
    </div>
  </div>
)

// 主入口
export default function App() {
  return (
    <HashRouter>
       <AppContent />
    </HashRouter>
  );
}

function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<MainLayoutWrapper />}>
        <Route index element={<Dashboard />} />
        
        {/* 核心游戏路由 */}
        <Route path="game/tic-tac-toe" element={
          <Suspense fallback={<GameLoadingFallback />}>
            <TicTacToe />
          </Suspense>
        } />
        <Route path="game/memory-match" element={
          <Suspense fallback={<GameLoadingFallback />}>
            <MemoryMatch />
          </Suspense>
        } />
        <Route path="game/whack-a-mole" element={
          <Suspense fallback={<GameLoadingFallback />}>
            <WhackAMole />
          </Suspense>
        } />
        <Route path="game/simon-says" element={
          <Suspense fallback={<GameLoadingFallback />}>
            <SimonSays />
          </Suspense>
        } />
        <Route path="game/typing-speed" element={
          <Suspense fallback={<GameLoadingFallback />}>
            <TypingSpeed />
          </Suspense>
        } />
        <Route path="game/snake" element={
          <Suspense fallback={<GameLoadingFallback />}>
            <Snake />
          </Suspense>
        } />
        
        {/* Arcade 游戏 */}
        <Route path="game/pong" element={
          <Suspense fallback={<GameLoadingFallback />}>
            <Pong />
          </Suspense>
        } />
        <Route path="game/breakout" element={
          <Suspense fallback={<GameLoadingFallback />}>
            <Breakout />
          </Suspense>
        } />
        <Route path="game/flappy-bird" element={
          <Suspense fallback={<GameLoadingFallback />}>
            <FlappyBird />
          </Suspense>
        } />
        <Route path="game/dino-run" element={
          <Suspense fallback={<GameLoadingFallback />}>
            <DinoRun />
          </Suspense>
        } />
        <Route path="game/2048" element={
          <Suspense fallback={<GameLoadingFallback />}>
            <Game2048 />
          </Suspense>
        } />
        
        {/* 益智与策略 */}
        <Route path="game/minesweeper" element={
          <Suspense fallback={<GameLoadingFallback />}>
            <Minesweeper />
          </Suspense>
        } />
        <Route path="game/sudoku" element={
          <Suspense fallback={<GameLoadingFallback />}>
            <Sudoku />
          </Suspense>
        } />
        <Route path="game/klotski" element={
          <Suspense fallback={<GameLoadingFallback />}>
            <SlidingPuzzle />
          </Suspense>
        } />
        <Route path="game/tetris" element={
          <Suspense fallback={<GameLoadingFallback />}>
            <Tetris />
          </Suspense>
        } />
        <Route path="game/fruit-ninja" element={
          <Suspense fallback={<GameLoadingFallback />}>
            <FruitSlicer />
          </Suspense>
        } />
        <Route path="game/game-of-life" element={
          <Suspense fallback={<GameLoadingFallback />}>
            <GameOfLife />
          </Suspense>
        } />
        <Route path="game/maze" element={
          <Suspense fallback={<GameLoadingFallback />}>
            <MazeGenerator />
          </Suspense>
        } />
        <Route path="game/pacman" element={
          <Suspense fallback={<GameLoadingFallback />}>
            <PacMan />
          </Suspense>
        } />
        <Route path="game/agar-io" element={
          <Suspense fallback={<GameLoadingFallback />}>
            <Agario />
          </Suspense>
        } />
        
        {/* 通用占位路由 */}
        <Route path="game/:id" element={<GamePlaceholder />} />
      </Route>
    </Routes>
  );
}

function MainLayoutWrapper() {
  return <MainLayout />;
}
