import React from 'react';
import { GridCell } from '../types';
import { SYMBOL_CONFIG } from '../constants';

interface GridSquareProps {
  cell: GridCell;
  activeState: 'active' | 'trail' | 'idle';
  gridArea?: string;
  style?: React.CSSProperties;
}

export const GridSquare: React.FC<GridSquareProps> = ({ cell, activeState, style }) => {
  const config = SYMBOL_CONFIG[cell.symbol];
  
  const getGlowColor = (opacity: number) => {
    // Helper to get RGB values for custom opacity rgba strings
    const baseColors: Record<string, string> = {
      'text-red-500': '239, 68, 68',
      'text-blue-500': '59, 130, 246',
      'text-blue-600': '37, 99, 235',
      'text-green-600': '22, 163, 74',
      'text-yellow-600': '202, 138, 4',
      'text-yellow-400': '250, 204, 21',
      'text-purple-600': '147, 51, 234',
      'text-orange-500': '249, 115, 22',
      'text-pink-500': '236, 72, 153',
    };
    
    // Find the matching color key or default to white
    const colorKey = Object.keys(baseColors).find(key => config.color.includes(key)) || '255, 255, 255';
    const rgb = baseColors[colorKey] || '255, 255, 255';
    
    return `rgba(${rgb}, ${opacity})`;
  };

  const isActive = activeState === 'active';
  const isTrail = activeState === 'trail';

  const glowStyle = isActive ? {
    boxShadow: `inset 0 0 30px ${getGlowColor(0.8)}, 0 0 20px ${getGlowColor(0.6)}`,
    borderColor: 'white',
    zIndex: 20,
    transform: 'scale(1.1)',
  } : isTrail ? {
    boxShadow: `inset 0 0 10px ${getGlowColor(0.3)}`,
    borderColor: 'rgba(255,255,255,0.3)',
    zIndex: 10,
    transform: 'scale(1.0)',
  } : {};

  return (
    <div 
      className={`
        relative flex flex-col items-center justify-center 
        rounded-lg border-2 transition-all duration-75
        ${isActive 
          ? 'bg-gradient-to-br from-white to-gray-200 ring-2 ring-white/50' 
          : isTrail
            ? 'bg-[#222]' // Slightly lighter than idle
            : 'bg-[#121212] border-gray-800 opacity-60' 
        }
      `}
      style={{ 
        ...style,
        aspectRatio: '1/1',
        ...glowStyle
      }}
    >
      {/* Multiplier Indicator */}
      <div className={`absolute top-0.5 right-1 text-[8px] md:text-[10px] font-mono font-bold ${isActive ? 'text-black' : 'text-gray-600'}`}>
        {cell.multiplier > 0 ? cell.multiplier : ''}
      </div>

      {/* Icon Container */}
      <div className={`
        ${config.color} 
        ${cell.isSmall ? 'scale-75' : 'scale-100'} 
        transform transition-transform duration-100
        ${isActive ? 'drop-shadow-[0_0_5px_currentColor]' : isTrail ? 'grayscale-[0.3] brightness-75' : 'grayscale brightness-50 blur-[0.5px]'}
      `}>
        {config.icon}
      </div>
      
      {/* Glass Gloss Overlay */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
    </div>
  );
};