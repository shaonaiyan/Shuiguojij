import { GridCell, SymbolType } from './types';
import { Apple, Bell, Citrus, Star, Zap } from 'lucide-react';
import React from 'react';

// --- MATH MODEL SUMMARY (Total 10,000) ---
// Apple (x5): 4000
// Orange (x10): 1500
// Plum (x15): 800
// Bell (x20): 600
// Watermelon (x20): 500
// Star (x30): 300
// 77 (x40): 150
// Blue BAR (x50): 80
// Red BAR (x120): 20
// Small Fruits (x3): 1500 (Collection Items)
// Luck (Special): 550

export const BOARD_LAYOUT: GridCell[] = [
  // Top Row (Left to Right)
  { id: 0, symbol: SymbolType.ORANGE, multiplier: 10 },
  { id: 1, symbol: SymbolType.BELL, multiplier: 20 },
  { id: 2, symbol: SymbolType.BAR, multiplier: 50, isSpecial: true }, // Blue Bar
  { id: 3, symbol: SymbolType.BAR, multiplier: 120, isSpecial: true }, // Red Bar
  { id: 4, symbol: SymbolType.APPLE, multiplier: 5 },
  { id: 5, symbol: SymbolType.APPLE, multiplier: 3, isSmall: true }, // Small Apple
  { id: 6, symbol: SymbolType.PLUM, multiplier: 15 },
  
  // Right Column
  { id: 7, symbol: SymbolType.WATERMELON, multiplier: 20 },
  { id: 8, symbol: SymbolType.WATERMELON, multiplier: 20 },
  { id: 9, symbol: SymbolType.LUCK, multiplier: 0 }, // Special
  { id: 10, symbol: SymbolType.APPLE, multiplier: 5 },
  { id: 11, symbol: SymbolType.ORANGE, multiplier: 10 },
  
  // Bottom Row (Right to Left)
  { id: 12, symbol: SymbolType.ORANGE, multiplier: 3, isSmall: true }, // Small Orange
  { id: 13, symbol: SymbolType.BELL, multiplier: 3, isSmall: true }, // Small Bell
  { id: 14, symbol: SymbolType.SEVEN, multiplier: 3, isSmall: true }, // Small 77 (Collection)
  { id: 15, symbol: SymbolType.SEVEN, multiplier: 40 },
  { id: 16, symbol: SymbolType.APPLE, multiplier: 5 },
  { id: 17, symbol: SymbolType.PLUM, multiplier: 3, isSmall: true }, // Small Plum (Collection)
  { id: 18, symbol: SymbolType.PLUM, multiplier: 15 },
  
  // Left Column (Bottom to Top)
  { id: 19, symbol: SymbolType.STAR, multiplier: 30 },
  { id: 20, symbol: SymbolType.STAR, multiplier: 30 },
  { id: 21, symbol: SymbolType.LUCK, multiplier: 0 }, // Special
  { id: 22, symbol: SymbolType.APPLE, multiplier: 5 },
  { id: 23, symbol: SymbolType.PLUM, multiplier: 15 }, // Extra Plum to balance layout
];

// Weighted probabilities mapped to Cell IDs
export const WEIGHTS: Record<number, number> = {
  // Apple (x5) - Total ~4000
  4: 1000, 10: 1000, 16: 1000, 22: 1000,
  
  // Orange (x10) - Total ~1500
  0: 750, 11: 750,
  
  // Plum (x15) - Total ~800
  6: 266, 18: 266, 23: 268,
  
  // Bell (x20) - Total ~600
  1: 600,
  
  // Watermelon (x20) - Total ~500
  7: 250, 8: 250,
  
  // Star (x30) - Total ~300
  19: 150, 20: 150,
  
  // 77 (x40) - Total ~150
  15: 150,
  
  // Blue Bar (x50) - Total ~80
  2: 80,
  
  // Red Bar (x120) - Total ~20 (Jackpot Chance)
  3: 20,
  
  // Small Fruits (x3) - Total ~1500 (300 each)
  5: 300, // Small Apple
  12: 300, // Small Orange
  13: 300, // Small Bell
  14: 300, // Small 77
  17: 300, // Small Plum

  // Luck/Special - Total ~550
  9: 275, 21: 275
};

// Map Symbol to Visual Icon/Color
export const SYMBOL_CONFIG: Record<SymbolType, { color: string, icon: React.ReactNode, label: string }> = {
  [SymbolType.BAR]: { color: 'text-blue-500', icon: <div className="font-black text-xs md:text-sm tracking-tighter border-2 border-current px-1">BAR</div>, label: 'BAR' },
  [SymbolType.SEVEN]: { color: 'text-red-600', icon: <div className="font-bold text-lg md:text-xl font-serif">77</div>, label: '77' },
  [SymbolType.STAR]: { color: 'text-yellow-400', icon: <Star fill="currentColor" size={24} />, label: 'STAR' },
  [SymbolType.WATERMELON]: { color: 'text-green-600', icon: <div className="w-6 h-6 rounded-full bg-green-600 border-4 border-green-800 overflow-hidden relative"><div className="absolute bg-red-500 w-full h-full top-1/2 left-0" /></div>, label: 'MELON' },
  [SymbolType.BELL]: { color: 'text-yellow-500', icon: <Bell fill="currentColor" size={24} />, label: 'BELL' },
  [SymbolType.PLUM]: { color: 'text-purple-500', icon: <div className="w-5 h-5 rounded-full bg-purple-600 relative"><div className="absolute top-0 right-1 w-2 h-2 bg-purple-400 rounded-full"/></div>, label: 'PLUM' },
  [SymbolType.ORANGE]: { color: 'text-orange-500', icon: <Citrus size={24} />, label: 'ORANGE' },
  [SymbolType.APPLE]: { color: 'text-green-500', icon: <Apple fill="currentColor" size={24} />, label: 'APPLE' },
  [SymbolType.LUCK]: { color: 'text-pink-500', icon: <Zap fill="currentColor" size={24} />, label: 'LUCK' },
};