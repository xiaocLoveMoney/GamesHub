
import { useEffect, useRef, useState } from 'react';
import { Play, RefreshCw } from 'lucide-react';
import PageTransition from '../../components/PageTransition';

export default function MazeGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const COLS = 40;
  const ROWS = 30;
  const CELL_SIZE = 20;

  const generate = async () => {
    if(isGenerating) return;
    setIsGenerating(true);
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if(!canvas || !ctx) return;

    ctx.fillStyle = '#1e293b'; // Wall color
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const grid = Array(ROWS).fill(0).map(() => Array(COLS).fill(false)); // Visited
    const stack: [number, number][] = [];
    
    const current = { x: 0, y: 0 };
    grid[0][0] = true;
    stack.push([0,0]);

    const drawCell = (x: number, y: number, color: string) => {
      ctx.fillStyle = color;
      ctx.fillRect(x * CELL_SIZE + 1, y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    };

    const removeWall = (x1: number, y1: number, x2: number, y2: number) => {
      const x = (x1 * CELL_SIZE + x2 * CELL_SIZE) / 2;
      const y = (y1 * CELL_SIZE + y2 * CELL_SIZE) / 2;
      ctx.fillStyle = '#fff'; // Path color
      ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    };

    // Iterative DFS with animation delay
    while(stack.length > 0) {
      const [cx, cy] = stack[stack.length - 1];
      drawCell(cx, cy, '#22c55e'); // Head

      // Get neighbors
      const neighbors = [];
      const dirs = [[0,-1],[0,1],[-1,0],[1,0]]; // N, S, W, E
      
      for(let [dx, dy] of dirs) {
        const nx = cx + dx, ny = cy + dy;
        if(nx >= 0 && nx < COLS && ny >= 0 && ny < ROWS && !grid[ny][nx]) {
          neighbors.push([nx, ny]);
        }
      }

      if(neighbors.length > 0) {
        const [nx, ny] = neighbors[Math.floor(Math.random() * neighbors.length)];
        removeWall(cx, cy, nx, ny);
        grid[ny][nx] = true;
        stack.push([nx, ny]);
        
        drawCell(cx, cy, '#fff'); // Mark current as visited path
        
        // Animation delay
        await new Promise(r => setTimeout(r, 5));
      } else {
        drawCell(cx, cy, '#fff');
        stack.pop();
      }
    }
    setIsGenerating(false);
  };

  useEffect(() => {
    if(canvasRef.current) {
       canvasRef.current.width = COLS * CELL_SIZE;
       canvasRef.current.height = ROWS * CELL_SIZE;
       const ctx = canvasRef.current.getContext('2d');
       if(ctx) {
         ctx.fillStyle = '#1e293b';
         ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
       }
    }
  }, []);

  return (
    <PageTransition>
      <div className="flex flex-col items-center py-8 min-h-[calc(100vh-100px)]">
         <h1 className="text-3xl font-bold text-slate-800 mb-6">Maze Generator (DFS)</h1>
         
         <div className="bg-white p-2 rounded-lg shadow-lg border border-slate-200">
            <canvas ref={canvasRef} className="block" />
         </div>

         <div className="mt-8">
           <button 
             onClick={generate} 
             disabled={isGenerating}
             className="px-8 py-3 bg-slate-900 text-white rounded-full font-bold shadow-lg hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2"
           >
             {isGenerating ? <RefreshCw className="animate-spin" /> : <Play />} 
             Generate Maze
           </button>
         </div>
      </div>
    </PageTransition>
  );
}
