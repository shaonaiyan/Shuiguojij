import { GridCell, SymbolType } from './types';
import { Apple, Banana, Bell, Cherry, Citrus, Clover, Coins, Diamond, Star, Zap } from 'lucide-react';
import React from 'react';

// Mapping the outer square loop of the machine (0-23)
// Starting Top Left (0), moving Clockwise.
export const BOARD_LAYOUT: GridCell[] = [
  { id: 0, symbol: SymbolType.ORANGE, multiplier: 10 },
  { id: 1, symbol: SymbolType.BELL, multiplier: 20 },
  { id: 2, symbol: SymbolType.BAR, multiplier: 50, isSmall: true },
  { id: 3, symbol: SymbolType.BAR, multiplier: 100 },
  { id: 4, symbol: SymbolType.APPLE, multiplier: 5 },
  { id: 5, symbol: SymbolType.APPLE, multiplier: 5, isSmall: true },
  { id: 6, symbol: SymbolType.PLUM, multiplier: 20 },
  
  // Right Column
  { id: 7, symbol: SymbolType.WATERMELON, multiplier: 20 },
  { id: 8, symbol: SymbolType.WATERMELON, multiplier: 20 },
  { id: 9, symbol: SymbolType.LUCK, multiplier: 0 }, // Special
  { id: 10, symbol: SymbolType.APPLE, multiplier: 5 },
  { id: 11, symbol: SymbolType.ORANGE, multiplier: 10 },
  
  // Bottom Row (Right to Left)
  { id: 12, symbol: SymbolType.ORANGE, multiplier: 10, isSmall: true },
  { id: 13, symbol: SymbolType.BELL, multiplier: 20, isSmall: true },
  { id: 14, symbol: SymbolType.SEVEN, multiplier: 20, isSmall: true },
  { id: 15, symbol: SymbolType.SEVEN, multiplier: 40 },
  { id: 16, symbol: SymbolType.APPLE, multiplier: 5 },
  { id: 17, symbol: SymbolType.APPLE, multiplier: 5, isSmall: true },
  { id: 18, symbol: SymbolType.PLUM, multiplier: 20 },
  
  // Left Column (Bottom to Top)
  { id: 19, symbol: SymbolType.STAR, multiplier: 20 },
  { id: 20, symbol: SymbolType.STAR, multiplier: 20 },
  { id: 21, symbol: SymbolType.LUCK, multiplier: 0 }, // Special
  { id: 22, symbol: SymbolType.APPLE, multiplier: 5 },
  { id: 23, symbol: SymbolType.PLUM, multiplier: 10 },
];

// Weighted probabilities for the random number generator to mimic "Rigged/Casino" feel
// Higher weight = more likely to stop there.
// Apples are very common. BARs are very rare.
export const WEIGHTS: Record<number, number> = {
  0: 10,  // Orange
  1: 5,   // Bell
  2: 2,   // Bar Small
  3: 1,   // Bar Big
  4: 40,  // Apple
  5: 10,  // Apple Small
  6: 8,   // Plum
  7: 5,   // Watermelon
  8: 5,   // Watermelon
  9: 2,   // Luck
  10: 40, // Apple
  11: 10, // Orange
  12: 5,  // Orange Small
  13: 5,  // Bell Small
  14: 2,  // 77 Small
  15: 1,  // 77 Big
  16: 40, // Apple
  17: 10, // Apple Small
  18: 8,  // Plum
  19: 5,  // Star
  20: 5,  // Star
  21: 2,  // Luck
  22: 40, // Apple
  23: 10  // Plum
};

// Map Symbol to Visual Icon/Color
export const SYMBOL_CONFIG: Record<SymbolType, { color: string, icon: React.ReactNode, label: string }> = {
  [SymbolType.BAR]: { color: 'text-blue-500', icon: <div className="font-black text-xs md:text-sm tracking-tighter border-2 border-blue-500 px-1">BAR</div>, label: 'BAR' },
  [SymbolType.SEVEN]: { color: 'text-blue-600', icon: <div className="font-bold text-lg md:text-xl font-serif">77</div>, label: '77' },
  [SymbolType.STAR]: { color: 'text-yellow-400', icon: <Star fill="currentColor" size={24} />, label: 'STAR' },
  [SymbolType.WATERMELON]: { color: 'text-green-600', icon: <div className="w-6 h-6 rounded-full bg-green-600 border-4 border-green-800 overflow-hidden relative"><div className="absolute bg-red-500 w-full h-full top-1/2 left-0" /></div>, label: 'MELON' },
  [SymbolType.BELL]: { color: 'text-yellow-600', icon: <Bell fill="currentColor" size={24} />, label: 'BELL' },
  [SymbolType.PLUM]: { color: 'text-purple-600', icon: <div className="w-5 h-5 rounded-full bg-purple-600 relative"><div className="absolute top-0 right-1 w-2 h-2 bg-purple-400 rounded-full"/></div>, label: 'PLUM' },
  [SymbolType.ORANGE]: { color: 'text-orange-500', icon: <Citrus size={24} />, label: 'ORANGE' },
  [SymbolType.APPLE]: { color: 'text-red-500', icon: <Apple fill="currentColor" size={24} />, label: 'APPLE' },
  [SymbolType.LUCK]: { color: 'text-pink-500', icon: <Zap fill="currentColor" size={24} />, label: 'LUCK' },
};
