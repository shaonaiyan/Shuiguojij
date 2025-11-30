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
  
  let customColor = config.color;
  let customLabel = config.label;
  
  if (cell.symbol === SymbolType.BAR) {
      if (cell.multiplier >= 100) {
          customColor = 'text-red-500 drop-shadow-[0_0_2px_rgba(239,68,68,0.8)]'; 
          customLabel = 'JACKPOT';
      } else {
          customColor = 'text-cyan-400 drop-shadow-[0_0_2px_rgba(34,211,238,0.8)]'; 
      }
  }

  const isActive = activeState === 'active';
  const isTrail = activeState === 'trail';

  return (
    <div 
      className={`
        relative flex flex-col items-center justify-center 
        rounded-md md:rounded-lg 
        transition-all duration-75 ease-out
        ${isActive 
          ? 'bg-gradient-to-b from-white to-gray-200 z-20 scale-105 shadow-[0_0_15px_rgba(255,255,255,0.9),inset_0_0_10px_white]' 
          : isTrail
            ? 'bg-[#2a2a2a] z-10 border-[#444]'
            : 'bg-gradient-to-b from-[#1a1a1a] to-[#050505] border-[#222]' 
        }
        border md:border-2
        ${isCollected ? 'ring-2 ring-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]' : ''}
      `}
      style={{ 
        ...style,
        aspectRatio: '1/1',
      }}
    >
      {/* Gloss Effect */}
      <div className="absolute inset-0 rounded-[inherit] bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>

      {/* Multiplier Tag */}
      {cell.multiplier > 0 && (
        <div className={`
            absolute top-0 right-0.5 md:right-1 
            text-[7px] md:text-[10px] font-mono font-bold leading-none
            ${isActive ? 'text-black' : 'text-gray-500'}
        `}>
            x{cell.multiplier}
        </div>
      )}

      {/* Mini Tag */}
      {cell.isSmall && (
          <div className="absolute top-0 left-0.5 md:left-1 text-[7px] md:text-[9px] font-mono text-yellow-500/80 font-bold leading-none">MINI</div>
      )}

      {/* Main Icon */}
      <div className={`
        ${customColor} 
        ${cell.isSmall ? 'scale-75' : 'scale-90 md:scale-100'} 
        transform transition-transform duration-100
        flex items-center justify-center
        ${isActive ? 'drop-shadow-none' : isTrail ? 'opacity-60 grayscale-[0.5]' : 'opacity-80 grayscale-[0.8]'}
      `}>
        {config.icon}
      </div>

      {/* Label (Hidden on small screens for cleaner look unless active) */}
      {!cell.isSmall && (
        <div className={`
            absolute bottom-0.5 
            text-[7px] md:text-[9px] font-arcade tracking-wider 
            ${isActive ? 'text-black font-bold' : 'text-gray-600 hidden md:block'}
        `}>
            {customLabel}
        </div>
      )}
    </div>
  );
};