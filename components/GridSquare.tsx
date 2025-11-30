import React from 'react';
import { GridCell, SymbolType } from '../types';
import { SYMBOL_CONFIG } from '../constants';

interface GridSquareProps {
  cell: GridCell;
  activeState: 'active' | 'trail' | 'idle';
  isCollected?: boolean;
  gridArea?: string;
  style?: React.CSSProperties;
}

export const GridSquare: React.FC<GridSquareProps> = ({ cell, activeState, isCollected, style }) => {
  const config = SYMBOL_CONFIG[cell.symbol];
  
  // Custom visual overrides for BARs based on multiplier
  let customColor = config.color;
  let customLabel = config.label;
  
  if (cell.symbol === SymbolType.BAR) {
      if (cell.multiplier >= 100) {
          customColor = 'text-red-600'; // RED BAR
          customLabel = 'JACKPOT';
      } else {
          customColor = 'text-blue-500'; // BLUE BAR
      }
  }

  const isActive = activeState === 'active';
  const isTrail = activeState === 'trail';

  return (
    <div 
      className={`
        relative flex flex-col items-center justify-center 
        rounded-lg border-2 transition-all duration-75
        ${isActive 
          ? 'bg-gradient-to-br from-white to-gray-200 ring-2 ring-white/50 z-20 scale-110' 
          : isTrail
            ? 'bg-[#222] z-10'
            : 'bg-[#121212] border-gray-800 opacity-80' 
        }
        ${isCollected ? 'ring-2 ring-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : ''}
      `}
      style={{ 
        ...style,
        aspectRatio: '1/1',
      }}
    >
      {/* Multiplier Indicator */}
      <div className={`absolute top-0.5 right-1 text-[8px] md:text-[10px] font-mono font-bold ${isActive ? 'text-black' : 'text-gray-600'}`}>
        {cell.multiplier > 0 ? `x${cell.multiplier}` : ''}
      </div>

      {/* Small Indicator */}
      {cell.isSmall && (
          <div className="absolute top-0.5 left-1 text-[8px] font-mono text-yellow-500 font-bold">MINI</div>
      )}

      {/* Icon Container */}
      <div className={`
        ${customColor} 
        ${cell.isSmall ? 'scale-75' : 'scale-100'} 
        transform transition-transform duration-100
        ${isActive ? 'drop-shadow-[0_0_5px_currentColor]' : isTrail ? 'grayscale-[0.3] brightness-75' : 'grayscale brightness-75'}
      `}>
        {config.icon}
      </div>

      {/* Label */}
      {!cell.isSmall && (
        <div className={`absolute bottom-0.5 text-[8px] font-arcade tracking-wider ${isActive ? 'text-black' : 'text-gray-600'}`}>
            {customLabel}
        </div>
      )}
      
      {/* Glass Gloss Overlay */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
    </div>
  );
};