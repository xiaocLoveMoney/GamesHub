import { createHashRouter, RouterProvider, Outlet, useNavigation, Route, createRoutesFromElements } from 'react-router';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import GamePlaceholder from './pages/GamePlaceholder';
import React, { useEffect } from 'react';
import nprogress from 'nprogress';
import 'nprogress/nprogress.css';

// Configure NProgress
nprogress.configure({ showSpinner: false });

// Helper for lazy loading routes
const lazyLoad = (importFn: () => Promise<any>) => async () => {
  const m = await importFn();
  return { Component: m.default };
};

// Root layout to handle global loading state
function RootLayout() {
  const navigation = useNavigation();

  useEffect(() => {
    if (navigation.state === 'loading') {
      nprogress.start();
    } else {
      nprogress.done();
    }
  }, [navigation.state]);

  return <Outlet />;
}

// Define router
const router = createHashRouter(
  createRoutesFromElements(
    <Route element={<RootLayout />}>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Dashboard />} />

        {/* Core Games */}
        <Route path="game/tic-tac-toe" lazy={lazyLoad(() => import('./pages/games/TicTacToe'))} />
        <Route path="game/memory-match" lazy={lazyLoad(() => import('./pages/games/MemoryMatch'))} />
        <Route path="game/whack-a-mole" lazy={lazyLoad(() => import('./pages/games/WhackAMole'))} />
        <Route path="game/simon-says" lazy={lazyLoad(() => import('./pages/games/SimonSays'))} />
        <Route path="game/typing-speed" lazy={lazyLoad(() => import('./pages/games/TypingSpeed'))} />
        <Route path="game/snake" lazy={lazyLoad(() => import('./pages/games/Snake'))} />

        {/* Arcade Games */}
        <Route path="game/pong" lazy={lazyLoad(() => import('./pages/games/Pong'))} />
        <Route path="game/breakout" lazy={lazyLoad(() => import('./pages/games/Breakout'))} />
        <Route path="game/flappy-bird" lazy={lazyLoad(() => import('./pages/games/FlappyBird'))} />
        <Route path="game/dino-run" lazy={lazyLoad(() => import('./pages/games/DinoRun'))} />
        <Route path="game/2048" lazy={lazyLoad(() => import('./pages/games/Game2048'))} />

        {/* Puzzle & Strategy */}
        <Route path="game/minesweeper" lazy={lazyLoad(() => import('./pages/games/Minesweeper'))} />
        <Route path="game/sudoku" lazy={lazyLoad(() => import('./pages/games/Sudoku'))} />
        <Route path="game/klotski" lazy={lazyLoad(() => import('./pages/games/SlidingPuzzle'))} />
        <Route path="game/tetris" lazy={lazyLoad(() => import('./pages/games/Tetris'))} />
        <Route path="game/fruit-ninja" lazy={lazyLoad(() => import('./pages/games/FruitSlicer'))} />
        <Route path="game/game-of-life" lazy={lazyLoad(() => import('./pages/games/GameOfLife'))} />
        <Route path="game/maze" lazy={lazyLoad(() => import('./pages/games/MazeGenerator'))} />
        <Route path="game/pacman" lazy={lazyLoad(() => import('./pages/games/PacMan'))} />
        <Route path="game/agar-io" lazy={lazyLoad(() => import('./pages/games/Agario'))} />

        {/* Fallback */}
        <Route path="game/:id" element={<GamePlaceholder />} />
      </Route>
    </Route>
  )
);

export default function App() {
  return <RouterProvider router={router} />;
}
