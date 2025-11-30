import React from 'react';
import { SymbolType, BetState } from '../types';
import { SYMBOL_CONFIG } from '../constants';
import { playBetSound, playErrorSound } from '../utils/sound';

interface ControlsProps {
  bets: BetState;
  onPlaceBet: (symbol: SymbolType) => void;
  disabled: boolean;
}

export const Controls: React.FC<ControlsProps> = ({ bets, onPlaceBet, disabled }) => {
  const buttonOrder = [
    SymbolType.BAR,
    SymbolType.SEVEN,
    SymbolType.STAR,
    SymbolType.WATERMELON,
    SymbolType.BELL,
    SymbolType.PLUM,
    SymbolType.ORANGE,
    SymbolType.APPLE
  ];

  return (
    <div className="
        grid grid-cols-4 md:grid-cols-8 gap-2 md:gap-4 
        p-3 md:p-5 
        bg-[#111] 
        rounded-b-2xl md:rounded-b-[24px] 
        border-t border-gray-800
        relative
    ">
      {/* Panel Texture */}
      <div className="absolute inset-0 rounded-b-2xl bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-50 pointer-events-none"></div>

      {buttonOrder.map((symbol) => {
        const config = SYMBOL_CONFIG[symbol];
        const currentBet = bets[symbol];
        const hasBet = currentBet > 0;

        return (
          <div key={symbol} className="flex flex-col items-center gap-1 md:gap-2 relative z-10">
            {/* Digital Bet Counter */}
            <div className={`
                w-full text-center font-led text-xs md:text-base h-5 md:h-7 
                flex items-center justify-center rounded 
                border border-gray-800 shadow-[inset_0_2px_4px_black]
                transition-colors duration-200
                ${hasBet ? 'bg-black text-red-500 shadow-[0_0_4px_rgba(239,68,68,0.3)]' : 'bg-[#050505] text-red-900/50'}
            `}>
              {hasBet ? currentBet : '0'}
            </div>
            
            {/* Physical Arcade Button */}
            <button
              onClick={() => {
                if (!disabled) {
                    playBetSound();
                    onPlaceBet(symbol);
                } else {
                    playErrorSound();
                }
              }}
              className={`
                group relative w-full aspect-square md:aspect-[4/5]
                flex flex-col items-center justify-center
                rounded-lg md:rounded-xl 
                transition-all duration-75 
                active:scale-95 active:shadow-none
                ${disabled 
                    ? 'opacity-50 cursor-not-allowed grayscale' 
                    : 'cursor-pointer hover:brightness-110 active:brightness-90'
                }
              `}
            >
                {/* Button Base (Depth) */}
                <div className="absolute inset-0 bg-[#0a0a0a] rounded-lg md:rounded-xl translate-y-1 shadow-lg"></div>
                
                {/* Button Top */}
                <div className={`
                    absolute inset-0 bg-gradient-to-b from-[#e5e5e5] to-[#999] 
                    rounded-lg md:rounded-xl 
                    shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_1px_2px_rgba(0,0,0,0.5)]
                    border-b border-[#666]
                    flex flex-col items-center justify-center
                `}>
                    {/* Icon */}
                    <div className={`${config.color} scale-75 md:scale-110 drop-shadow-sm`}>
                        {config.icon}
                    </div>
                </div>

                {/* Indicator Light */}
                <div className={`
                    absolute top-1 right-1 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full 
                    shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] border border-gray-400
                    ${hasBet ? 'bg-yellow-400 shadow-[0_0_4px_yellow]' : 'bg-gray-600'}
                `}></div>
            </button>
            
            {/* Label */}
            <span className="text-[8px] md:text-[10px] text-gray-500 font-bold tracking-wider uppercase font-arcade">
                {config.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};