import React from "react";
import { useTheme } from "../context/ThemeContext";

interface BoardProps {
  board: string[][];
  onCellClick?: (row: number, col: number) => void;
  selectedCoords?: string;
  previewScore?: number | null;
  previewWord?: string;
}

// Scrabble multiplier types
export type PremiumCellType = "NORMAL" | "TWS" | "DWS" | "TLS" | "DLS" | "CENTER";

// Determine the cell type based on Scrabble board symmetry coordinates (0-indexed 15x15)
export function getPremiumCellType(row: number, col: number): PremiumCellType {
  // Center
  if (row === 7 && col === 7) return "CENTER";

  // Triple Word (TWS) - Corners and midpoints
  const twsCoords = [
    [0, 0], [0, 7], [0, 14],
    [7, 0],         [7, 14],
    [14, 0], [14, 7], [14, 14]
  ];
  if (twsCoords.some(([r, c]) => r === row && c === col)) return "TWS";

  // Double Word (DWS) - Diagonals
  const dwsCoords = [
    [1, 1], [2, 2], [3, 3], [4, 4],
    [10, 10], [11, 11], [12, 12], [13, 13],
    [1, 13], [2, 12], [3, 11], [4, 10],
    [10, 4], [11, 3], [12, 2], [13, 1]
  ];
  if (dwsCoords.some(([r, c]) => r === row && c === col)) return "DWS";

  // Triple Letter (TLS) - Symmetry
  const tlsCoords = [
    [1, 5], [1, 9],
    [5, 1], [5, 5], [5, 9], [5, 13],
    [9, 1], [9, 5], [9, 9], [9, 13],
    [13, 5], [13, 9]
  ];
  if (tlsCoords.some(([r, c]) => r === row && c === col)) return "TLS";

  // Double Letter (DLS)
  const dlsCoords = [
    [0, 3], [0, 11],
    [2, 6], [2, 8],
    [3, 0], [3, 7], [3, 14],
    [6, 2], [6, 6], [6, 8], [6, 12],
    [7, 3], [7, 11],
    [8, 2], [8, 6], [8, 8], [8, 12],
    [11, 0], [11, 7], [11, 14],
    [12, 6], [12, 8],
    [14, 3], [14, 11]
  ];
  if (dlsCoords.some(([r, c]) => r === row && c === col)) return "DLS";

  return "NORMAL";
}

export default function Board({ 
  board, 
  onCellClick, 
  selectedCoords,
  previewScore,
  previewWord 
}: BoardProps) {
  const { theme } = useTheme();

  // Columns A-O, Rows 1-15
  const cols = Array.from({ length: 15 }, (_, i) => String.fromCharCode(65 + i));
  const rows = Array.from({ length: 15 }, (_, i) => i + 1);

  const getCellStyles = (type: PremiumCellType) => {
    switch (type) {
      case "CENTER":
        return theme === "dark" 
          ? "bg-amber-500/20 text-amber-400 border-amber-500/30" 
          : "bg-amber-100 border-amber-300 text-amber-800";
      case "TWS": // Triple Word (Red)
        return theme === "dark" 
          ? "bg-rose-500/20 text-rose-400 border-rose-500/30 font-bold" 
          : "bg-rose-100 border-rose-300 text-rose-800 font-semibold";
      case "DWS": // Double Word (Pink/Orange)
        return theme === "dark" 
          ? "bg-orange-500/15 text-orange-400 border-orange-500/20" 
          : "bg-orange-55 border-orange-200 text-orange-850";
      case "TLS": // Triple Letter (Dark Blue)
        return theme === "dark" 
          ? "bg-indigo-500/20 text-indigo-400 border-indigo-500/30" 
          : "bg-indigo-100 border-indigo-300 text-indigo-800";
      case "DLS": // Double Letter (Light Blue)
        return theme === "dark" 
          ? "bg-sky-500/15 text-sky-400 border-sky-500/20" 
          : "bg-sky-50 border-sky-250 text-sky-850";
      default:
        return theme === "dark" 
          ? "bg-slate-900/40 text-slate-500 border-slate-800"
          : "bg-slate-50 border-slate-200 text-slate-400";
    }
  };

  const getCellLabel = (type: PremiumCellType): string => {
    switch (type) {
      case "CENTER": return "★";
      case "TWS": return "MT";
      case "DWS": return "MD";
      case "TLS": return "LT";
      case "DLS": return "LD";
      default: return "";
    }
  };

  return (
    <div className="flex flex-col items-center select-none w-full">
      {/* Wrapper to handle scaling and borders without breaking layout */}
      <div className="w-full flex justify-center">
        <div className={`p-1.5 sm:p-3 rounded-2xl border flex flex-col items-center w-full max-w-[500px] ${
          theme === "dark" ? "bg-slate-900/60 border-slate-800/80" : "bg-white border-slate-200 shadow-sm"
        }`}>
          
          {/* Top Header Labels (A-O) aligned dynamically */}
          <div className="flex w-full mb-0.5">
            <div className="w-5 sm:w-6 shrink-0 flex items-center justify-center" /> {/* top-left corner spacer */}
            {cols.map((col) => (
              <div 
                key={col} 
                className="flex-1 text-center font-mono text-[8px] sm:text-[10px] uppercase font-bold text-slate-500 flex items-center justify-center aspect-square"
              >
                {col}
              </div>
            ))}
          </div>

          {/* Board Grid Rows */}
          <div className="flex flex-col gap-[1px] sm:gap-0.5 w-full">
            {board.map((rowArr, rIdx) => (
              <div key={rIdx} className="flex gap-[1px] sm:gap-0.5 w-full items-center">
                
                {/* Left Side Labels (1-15) */}
                <div className="w-5 sm:w-6 shrink-0 font-mono text-[8px] sm:text-[10px] font-bold text-slate-500 text-right pr-1 sm:pr-1.5 aspect-square flex items-center justify-end">
                  {rows[rIdx]}
                </div>

                {/* Grid Cells */}
                {rowArr.map((cellValue, cIdx) => {
                  const cellType = getPremiumCellType(rIdx, cIdx);
                  const isPreview = !!cellValue && cellValue.startsWith("preview:");
                  const displayValue = isPreview ? cellValue.replace("preview:", "") : cellValue;
                  const isPlaced = !!cellValue && !isPreview;
                  const cellCoord = `${cols[cIdx]}${rows[rIdx]}`;
                  const isSelected = selectedCoords === cellCoord;

                  return (
                    <div
                      key={cIdx}
                      onClick={() => onCellClick?.(rIdx, cIdx)}
                      className={`flex-1 aspect-square rounded-sm border-[0.5px] sm:border flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 relative ${
                        isSelected
                          ? theme === "dark"
                            ? "ring-2 ring-amber-400 border-amber-400 bg-amber-500/35 text-amber-300 scale-105 z-10 animate-pulse font-extrabold shadow-lg shadow-amber-500/20"
                            : "ring-2 ring-amber-500 border-amber-500 bg-amber-200 text-amber-900 scale-105 z-10 animate-pulse font-extrabold shadow-md shadow-amber-500/10"
                          : isPlaced
                            ? "bg-amber-100 dark:bg-amber-500/90 border-amber-400 dark:border-amber-400 text-slate-900 dark:text-slate-950 font-bold font-display shadow-sm scale-[1.02] shadow-amber-500/10"
                            : isPreview
                              ? theme === "dark"
                                ? "border-2 border-dashed border-amber-400/80 bg-amber-500/15 text-amber-400 z-5 scale-100 shadow-sm animate-pulse font-bold"
                                : "border-2 border-dashed border-amber-500 bg-amber-50 text-amber-700 z-5 scale-100 shadow-sm animate-pulse font-bold"
                              : getCellStyles(cellType)
                      }`}
                      title={`${cols[cIdx]}${rows[rIdx]} - ${isPlaced ? "Tuile : " + displayValue : isPreview ? "Prévisualisation : " + displayValue : cellType}`}
                    >
                      {isPlaced || isPreview ? (
                        <span className="text-[9px] sm:text-xs font-bold leading-none tracking-tight font-display">
                          {displayValue.toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-[5px] sm:text-[8px] font-bold tracking-tighter uppercase leading-none opacity-80 scale-95 sm:scale-90">
                          {getCellLabel(cellType)}
                        </span>
                      )}

                      {isSelected && previewWord && previewWord.length > 0 && previewScore !== null && (
                        <div className="absolute -top-9 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-none select-none animate-bounce">
                          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-mono text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded shadow-md shadow-amber-500/20 whitespace-nowrap flex items-center gap-0.5 border border-amber-400/50">
                            <span>+{previewScore}</span>
                            <span className="text-[7px] sm:text-[8px] opacity-90 uppercase">PTS</span>
                          </div>
                          {/* Pin indicator bubble pointing down */}
                          <div className="w-1.5 h-1.5 bg-orange-500 rotate-45 -mt-[3px]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
