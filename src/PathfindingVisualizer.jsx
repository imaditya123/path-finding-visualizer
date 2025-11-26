import React, { useState, useEffect, useRef } from 'react';

const ROWS = 20;
const COLS = 40;
const START = { row: 10, col: 5 };
const END = { row: 10, col: 35 };

const PathfindingVisualizer = () => {
  const [grid, setGrid] = useState([]);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState('wall'); // 'wall', 'start', 'end'
  
  useEffect(() => {
    initializeGrid();
  }, []);

  const initializeGrid = () => {
    const newGrid = [];
    for (let row = 0; row < ROWS; row++) {
      const currentRow = [];
      for (let col = 0; col < COLS; col++) {
        currentRow.push({
          row,
          col,
          isStart: row === START.row && col === START.col,
          isEnd: row === END.row && col === END.col,
          isWall: false,
          isVisited: false,
          isPath: false,
          distance: Infinity,
          prev: null
        });
      }
      newGrid.push(currentRow);
    }
    setGrid(newGrid);
  };

  const handleMouseDown = (row, col) => {
    if (isRunning) return;
    setIsMouseDown(true);
    handleCellClick(row, col);
  };

  const handleMouseEnter = (row, col) => {
    if (!isMouseDown || isRunning) return;
    handleCellClick(row, col);
  };

  const handleMouseUp = () => {
    setIsMouseDown(false);
  };

  const handleCellClick = (row, col) => {
    const newGrid = grid.map(r => r.map(c => ({ ...c })));
    const cell = newGrid[row][col];

    if (mode === 'wall') {
      if (!cell.isStart && !cell.isEnd) {
        cell.isWall = !cell.isWall;
      }
    } else if (mode === 'start') {
      newGrid.forEach(r => r.forEach(c => c.isStart = false));
      cell.isStart = true;
      cell.isWall = false;
    } else if (mode === 'end') {
      newGrid.forEach(r => r.forEach(c => c.isEnd = false));
      cell.isEnd = true;
      cell.isWall = false;
    }

    setGrid(newGrid);
  };

  const visualizeDijkstra = async () => {
    setIsRunning(true);
    const newGrid = grid.map(r => r.map(c => ({ 
      ...c, 
      isVisited: false, 
      isPath: false,
      distance: Infinity,
      prev: null
    })));
    
    const startNode = newGrid.flat().find(n => n.isStart);
    const endNode = newGrid.flat().find(n => n.isEnd);
    
    startNode.distance = 0;
    const unvisited = newGrid.flat();
    const visitedOrder = [];

    while (unvisited.length) {
      unvisited.sort((a, b) => a.distance - b.distance);
      const closest = unvisited.shift();
      
      if (closest.isWall) continue;
      if (closest.distance === Infinity) break;
      
      closest.isVisited = true;
      visitedOrder.push(closest);
      
      if (closest === endNode) break;

      const neighbors = getNeighbors(closest, newGrid);
      for (const neighbor of neighbors) {
        if (!neighbor.isVisited && !neighbor.isWall) {
          const alt = closest.distance + 1;
          if (alt < neighbor.distance) {
            neighbor.distance = alt;
            neighbor.prev = closest;
          }
        }
      }
    }

    // Animate visited nodes
    for (let i = 0; i < visitedOrder.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 10));
      const node = visitedOrder[i];
      if (!node.isStart && !node.isEnd) {
        setGrid(prev => {
          const updated = prev.map(r => [...r]);
          updated[node.row][node.col] = { ...node, isVisited: true };
          return updated;
        });
      }
    }

    // Trace back path
    const path = [];
    let current = endNode;
    while (current !== null) {
      path.unshift(current);
      current = current.prev;
    }

    // Animate path
    for (let i = 0; i < path.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 30));
      const node = path[i];
      if (!node.isStart && !node.isEnd) {
        setGrid(prev => {
          const updated = prev.map(r => [...r]);
          updated[node.row][node.col] = { ...node, isPath: true };
          return updated;
        });
      }
    }

    setIsRunning(false);
  };

  const getNeighbors = (node, grid) => {
    const neighbors = [];
    const { row, col } = node;
    
    if (row > 0) neighbors.push(grid[row - 1][col]);
    if (row < ROWS - 1) neighbors.push(grid[row + 1][col]);
    if (col > 0) neighbors.push(grid[row][col - 1]);
    if (col < COLS - 1) neighbors.push(grid[row][col + 1]);
    
    return neighbors;
  };

  const clearPath = () => {
    if (isRunning) return;
    setGrid(prev => 
      prev.map(row => 
        row.map(cell => ({ 
          ...cell, 
          isVisited: false, 
          isPath: false,
          distance: Infinity,
          prev: null
        }))
      )
    );
  };

  const clearWalls = () => {
    if (isRunning) return;
    setGrid(prev => 
      prev.map(row => 
        row.map(cell => ({ 
          ...cell, 
          isWall: false,
          isVisited: false, 
          isPath: false,
          distance: Infinity,
          prev: null
        }))
      )
    );
  };

  const getCellClass = (cell) => {
    if (cell.isStart) return 'bg-green-500';
    if (cell.isEnd) return 'bg-red-500';
    if (cell.isWall) return 'bg-gray-800';
    if (cell.isPath) return 'bg-yellow-400';
    if (cell.isVisited) return 'bg-blue-300';
    return 'bg-white border border-gray-300';
  };

  return (
    <div className="flex flex-col items-center p-4 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-4">Pathfinding Visualizer</h1>
      
      <div className="flex gap-4 mb-4 flex-wrap justify-center">
        <button
          onClick={visualizeDijkstra}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          Visualize Dijkstra
        </button>
        <button
          onClick={clearPath}
          disabled={isRunning}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-400"
        >
          Clear Path
        </button>
        <button
          onClick={clearWalls}
          disabled={isRunning}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
        >
          Clear Walls
        </button>
        <button
          onClick={initializeGrid}
          disabled={isRunning}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-400"
        >
          Reset Grid
        </button>
      </div>

      <div className="flex gap-4 mb-4">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            value="wall"
            checked={mode === 'wall'}
            onChange={(e) => setMode(e.target.value)}
            disabled={isRunning}
          />
          Draw Walls
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            value="start"
            checked={mode === 'start'}
            onChange={(e) => setMode(e.target.value)}
            disabled={isRunning}
          />
          Move Start
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            value="end"
            checked={mode === 'end'}
            onChange={(e) => setMode(e.target.value)}
            disabled={isRunning}
          />
          Move End
        </label>
      </div>

      <div className="flex gap-4 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500"></div>
          <span>Start</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500"></div>
          <span>End</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-800"></div>
          <span>Wall</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-300"></div>
          <span>Visited</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-400"></div>
          <span>Path</span>
        </div>
      </div>

      <div 
        className="inline-block bg-white p-2 rounded shadow-lg"
        onMouseLeave={handleMouseUp}
      >
        {grid.map((row, rowIdx) => (
          <div key={rowIdx} className="flex">
            {row.map((cell, cellIdx) => (
              <div
                key={cellIdx}
                className={`w-6 h-6 ${getCellClass(cell)} cursor-pointer transition-colors duration-200`}
                onMouseDown={() => handleMouseDown(cell.row, cell.col)}
                onMouseEnter={() => handleMouseEnter(cell.row, cell.col)}
                onMouseUp={handleMouseUp}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PathfindingVisualizer;