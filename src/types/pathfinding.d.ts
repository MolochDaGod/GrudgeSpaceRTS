// Type declarations for the `pathfinding` npm package
// Source: https://github.com/qiao/PathFinding.js (MIT)

declare module 'pathfinding' {
  export class Grid {
    constructor(width: number, height: number);
    constructor(matrix: number[][]);
    width: number;
    height: number;
    setWalkableAt(x: number, y: number, walkable: boolean): void;
    isWalkableAt(x: number, y: number): boolean;
    clone(): Grid;
  }

  export interface FinderOptions {
    allowDiagonal?: boolean;
    dontCrossCorners?: boolean;
    heuristic?: (dx: number, dy: number) => number;
    weight?: number;
  }

  type Path = [number, number][];

  export class AStarFinder {
    constructor(options?: FinderOptions);
    findPath(startX: number, startY: number, endX: number, endY: number, grid: Grid): Path;
  }

  export class BreadthFirstFinder {
    constructor(options?: FinderOptions);
    findPath(startX: number, startY: number, endX: number, endY: number, grid: Grid): Path;
  }

  export class JumpPointFinder {
    constructor(options?: FinderOptions);
    findPath(startX: number, startY: number, endX: number, endY: number, grid: Grid): Path;
  }

  export namespace Util {
    function smoothenPath(grid: Grid, path: Path): Path;
    function compressPath(path: Path): Path;
    function expandPath(path: Path): Path;
  }

  export namespace Heuristic {
    function manhattan(dx: number, dy: number): number;
    function euclidean(dx: number, dy: number): number;
    function chebyshev(dx: number, dy: number): number;
    function octile(dx: number, dy: number): number;
  }
}
