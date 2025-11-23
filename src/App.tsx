
import { HashRouter, Route, Routes } from 'react-router';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import GamePlaceholder from './pages/GamePlaceholder';
import TicTacToe from './pages/games/TicTacToe';
import MemoryMatch from './pages/games/MemoryMatch';
import WhackAMole from './pages/games/WhackAMole';
import SimonSays from './pages/games/SimonSays';
import TypingSpeed from './pages/games/TypingSpeed';
import Snake from './pages/games/Snake';
import Pong from './pages/games/Pong';
import Breakout from './pages/games/Breakout';
import FlappyBird from './pages/games/FlappyBird';
import DinoRun from './pages/games/DinoRun';
import Game2048 from './pages/games/Game2048';
import Minesweeper from './pages/games/Minesweeper';
import Sudoku from './pages/games/Sudoku';
import SlidingPuzzle from './pages/games/SlidingPuzzle';
import Tetris from './pages/games/Tetris';
import FruitSlicer from './pages/games/FruitSlicer';
import GameOfLife from './pages/games/GameOfLife';
import MazeGenerator from './pages/games/MazeGenerator';
import PacMan from './pages/games/PacMan';
import Agario from './pages/games/Agario';
import React from 'react';

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
        <Route path="game/tic-tac-toe" element={<TicTacToe />} />
        <Route path="game/memory-match" element={<MemoryMatch />} />
        <Route path="game/whack-a-mole" element={<WhackAMole />} />
        <Route path="game/simon-says" element={<SimonSays />} />
        <Route path="game/typing-speed" element={<TypingSpeed />} />
        <Route path="game/snake" element={<Snake />} />
        
        {/* Arcade 游戏 */}
        <Route path="game/pong" element={<Pong />} />
        <Route path="game/breakout" element={<Breakout />} />
        <Route path="game/flappy-bird" element={<FlappyBird />} />
        <Route path="game/dino-run" element={<DinoRun />} />
        <Route path="game/2048" element={<Game2048 />} />
        
        {/* 益智与策略 (ID 对应 lib/games.ts) */}
        <Route path="game/minesweeper" element={<Minesweeper />} />
        <Route path="game/sudoku" element={<Sudoku />} />
        <Route path="game/klotski" element={<SlidingPuzzle />} />
        <Route path="game/tetris" element={<Tetris />} />
        <Route path="game/fruit-ninja" element={<FruitSlicer />} />
        <Route path="game/game-of-life" element={<GameOfLife />} />
        <Route path="game/maze" element={<MazeGenerator />} />
        <Route path="game/pacman" element={<PacMan />} />
        <Route path="game/agar-io" element={<Agario />} />
        
        {/* 通用占位路由 */}
        <Route path="game/:id" element={<GamePlaceholder />} />
      </Route>
    </Routes>
  );
}

function MainLayoutWrapper() {
  return <MainLayout />;
}
