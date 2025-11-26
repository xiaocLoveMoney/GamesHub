import { useState, useEffect, useMemo } from 'react';
import { Eraser, RefreshCw, Trophy, Settings, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import PageTransition from '../../components/PageTransition';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

type Difficulty = 'Easy' | 'Medium' | 'Hard';

const DIFFICULTY_SETTINGS = {
  Easy: { label: '简单', holes: 30 },
  Medium: { label: '普通', holes: 40 },
  Hard: { label: '困难', holes: 50 },
};

export default function Sudoku() {
  const { t } = useTranslation();
  // 核心状态
  const [board, setBoard] = useState<number[][]>([]); // 当前盘面
  const [initialBoard, setInitialBoard] = useState<number[][]>([]); // 初始盘面 (不可变)
  const [solution, setSolution] = useState<number[][]>([]); // 答案 (用于最终校验)
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [isSuccess, setIsSuccess] = useState(false);
  const [showDiffMenu, setShowDiffMenu] = useState(false);

  // --- 数独生成算法 (优化版) ---
  const generateGame = (diff: Difficulty) => {
    const newSolution = Array(9).fill(0).map(() => Array(9).fill(0));
    
    // 1. 填充对角线区域 (独立区域，随机填充以增加随机性)
    fillDiagonal(newSolution);
    
    // 2. 求解剩余部分生成完整终盘
    solveSudoku(newSolution);
    setSolution(newSolution.map(r => [...r])); // 保存答案

    // 3. 根据难度挖空
    const newBoard = newSolution.map(r => [...r]);
    let holes = DIFFICULTY_SETTINGS[diff].holes;
    
    while (holes > 0) {
      const r = Math.floor(Math.random() * 9);
      const c = Math.floor(Math.random() * 9);
      if (newBoard[r][c] !== 0) {
        newBoard[r][c] = 0;
        holes--;
      }
    }

    setInitialBoard(newBoard.map(r => [...r]));
    setBoard(newBoard);
    setIsSuccess(false);
    setSelected(null);
  };

  const fillDiagonal = (grid: number[][]) => {
    for (let i = 0; i < 9; i += 3) fillBox(grid, i, i);
  };

  const fillBox = (grid: number[][], row: number, col: number) => {
    let num: number;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        do {
          num = Math.floor(Math.random() * 9) + 1;
        } while (!isSafeInBox(grid, row, col, num));
        grid[row + i][col + j] = num;
      }
    }
  };

  const isSafeInBox = (grid: number[][], rowStart: number, colStart: number, num: number) => {
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        if (grid[rowStart + i][colStart + j] === num) return false;
    return true;
  };

  const isSafe = (grid: number[][], row: number, col: number, num: number) => {
    for (let x = 0; x < 9; x++) if (grid[row][x] === num) return false;
    for (let x = 0; x < 9; x++) if (grid[x][col] === num) return false;
    const startRow = row - row % 3, startCol = col - col % 3;
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        if (grid[i + startRow][j + startCol] === num) return false;
    return true;
  };

  const solveSudoku = (grid: number[][]) => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (grid[r][c] === 0) {
          for (let n = 1; n <= 9; n++) {
            if (isSafe(grid, r, c, n)) {
              grid[r][c] = n;
              if (solveSudoku(grid)) return true;
              grid[r][c] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  };

  // --- 交互逻辑 ---

  useEffect(() => {
    generateGame(difficulty);
  }, []);

  const handleInput = (num: number) => {
    if (!selected || isSuccess) return;
    const [r, c] = selected;
    
    // 初始数字不可修改
    if (initialBoard[r][c] !== 0) return;

    const newBoard = board.map(row => [...row]);
    // 如果点击当前已填的数字，则清除（方便操作）
    if (newBoard[r][c] === num) {
      newBoard[r][c] = 0;
    } else {
      newBoard[r][c] = num;
    }
    
    setBoard(newBoard);
    checkCompletion(newBoard);
  };

  // 检查是否完成
  const checkCompletion = (currentBoard: number[][]) => {
    // 1. 检查是否有空格
    for(let r=0; r<9; r++)
      for(let c=0; c<9; c++)
        if(currentBoard[r][c] === 0) return;

    // 2. 检查是否匹配答案 (这是唯一的正确性校验点)
    // 也可以用 isValid 数独算法校验，对比 solution 更快
    const isCorrect = JSON.stringify(currentBoard) === JSON.stringify(solution);
    
    if (isCorrect) {
      setIsSuccess(true);
    }
  };

  // 辅助：检查当前格子是否与行列宫冲突 (仅用于视觉提示，不阻断输入)
  const hasConflict = (r: number, c: number, val: number) => {
    if (val === 0) return false;
    // 检查行
    for (let k = 0; k < 9; k++) if (k !== c && board[r][k] === val) return true;
    // 检查列
    for (let k = 0; k < 9; k++) if (k !== r && board[k][c] === val) return true;
    // 检查宫
    const startR = r - r % 3;
    const startC = c - c % 3;
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++)
        if ((startR + i !== r || startC + j !== c) && board[startR + i][startC + j] === val) return true;
        
    return false;
  };

  return (
    <PageTransition>
      <div className="flex flex-col items-center py-6 min-h-[calc(100vh-100px)] select-none">
        <div className="w-full max-w-md px-4">
          
          {/* 顶部栏 */}
          <div className="flex justify-between items-center mb-6">
             <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Sudoku</h1>
             
             {/* 难度选择器 */}
             <div className="relative">
               <button 
                 onClick={() => setShowDiffMenu(!showDiffMenu)}
                 className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
               >
                 {DIFFICULTY_SETTINGS[difficulty].label}
                 <ChevronDown size={14} className={cn("transition-transform", showDiffMenu && "rotate-180")} />
               </button>
               
               <AnimatePresence>
                 {showDiffMenu && (
                   <motion.div 
                     initial={{ opacity: 0, y: 10 }}
                     animate={{ opacity: 1, y: 0 }}
                     exit={{ opacity: 0, y: 10 }}
                     className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-20"
                   >
                     {(Object.keys(DIFFICULTY_SETTINGS) as Difficulty[]).map((key) => (
                       <button
                         key={key}
                         onClick={() => {
                           setDifficulty(key);
                           generateGame(key);
                           setShowDiffMenu(false);
                         }}
                         className={cn(
                           "w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors",
                           difficulty === key ? "text-blue-600 font-bold bg-blue-50" : "text-slate-600"
                         )}
                       >
                         {DIFFICULTY_SETTINGS[key].label}
                       </button>
                     ))}
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>
          </div>

          {/* 棋盘区域 */}
          <div className="bg-slate-800 p-1 rounded-xl shadow-2xl relative overflow-hidden">
             
             {/* 胜利覆盖层 */}
             <AnimatePresence>
               {isSuccess && (
                 <motion.div 
                   initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                   className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-20 flex flex-col items-center justify-center text-white"
                 >
                   <motion.div 
                     initial={{ scale: 0 }} animate={{ scale: 1 }}
                     className="bg-white text-slate-900 p-6 rounded-3xl shadow-2xl flex flex-col items-center"
                   >
                      <Trophy size={64} className="text-yellow-500 mb-4 animate-bounce" />
                      <h2 className="text-2xl font-bold mb-2">完美解题!</h2>
                      <button 
                        onClick={() => generateGame(difficulty)}
                        className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-full font-medium hover:scale-105 transition-transform"
                      >
                        再来一局
                      </button>
                   </motion.div>
                 </motion.div>
               )}
             </AnimatePresence>

             <div className="grid grid-cols-9 gap-[1px] bg-slate-500 border-[2px] border-slate-800 rounded-lg overflow-hidden">
               {board.map((row, r) => (
                 row.map((num, c) => {
                   const isInitial = initialBoard[r][c] !== 0;
                   const isSelected = selected?.[0] === r && selected?.[1] === c;
                   const isRelated = selected && (selected[0] === r || selected[1] === c); // 同行列高亮
                   const isSameNum = selected && board[selected[0]][selected[1]] !== 0 && num === board[selected[0]][selected[1]]; // 同数字高亮
                   
                   // 视觉冲突检查：不是初始数字，且有冲突
                   const isConflict = !isInitial && num !== 0 && hasConflict(r, c, num);

                   // 宫格边界样式
                   const borderRight = (c + 1) % 3 === 0 && c !== 8 ? 'border-r-[2px] border-r-slate-800' : '';
                   const borderBottom = (r + 1) % 3 === 0 && r !== 8 ? 'border-b-[2px] border-b-slate-800' : '';

                   return (
                     <div
                       key={`${r}-${c}`}
                       onClick={() => setSelected([r, c])}
                       className={cn(
                         "w-full aspect-square flex items-center justify-center text-lg sm:text-xl cursor-pointer bg-white transition-colors duration-75",
                         borderRight, borderBottom,
                         // 字体样式
                         isInitial ? "font-bold text-slate-900" : "font-medium text-blue-600",
                         // 状态样式
                         isSelected && "bg-blue-500 text-white ring-2 ring-blue-500 z-10",
                         !isSelected && isSameNum && "bg-blue-200", // 同数字关联
                         !isSelected && !isSameNum && isRelated && "bg-slate-100", // 同行列关联
                         // 错误提示 (冲突)
                         isConflict && !isSelected && "text-red-500 bg-red-50",
                         isConflict && isSelected && "bg-red-500"
                       )}
                     >
                       {num !== 0 ? num : ''}
                     </div>
                   );
                 })
               ))}
             </div>
          </div>

          {/* 键盘区域 */}
          <div className="mt-8">
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {[1,2,3,4,5,6,7,8,9].map(n => (
                <button 
                    key={n} 
                    onClick={() => handleInput(n)}
                    className="aspect-square bg-white border border-slate-200 rounded-xl shadow-sm text-2xl font-bold text-blue-600 active:scale-90 hover:bg-blue-50 hover:border-blue-300 transition-all"
                >
                    {n}
                </button>
                ))}
                <button 
                    onClick={() => selected && handleInput(0)} // 0 代表清除
                    className="aspect-square flex items-center justify-center bg-slate-100 border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-200 active:scale-90 transition-all"
                >
                    <Eraser size={24} />
                </button>
            </div>
          </div>
          
          {/* 底部控制 */}
          <div className="mt-8 flex justify-center">
             <button 
               onClick={() => generateGame(difficulty)} 
               className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-full font-medium shadow-sm hover:shadow-md hover:text-slate-900 transition-all"
             >
               <RefreshCw size={18} /> 重置游戏
             </button>
          </div>

        </div>
      </div>
    </PageTransition>
  );
}