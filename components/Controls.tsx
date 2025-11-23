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
  // Classic layout order
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
    <div className="grid grid-cols-4 md:grid-cols-8 gap-3 p-4 bg-gradient-to-b from-gray-800 to-black rounded-b-xl shadow-inner border-t-2 border-gray-600">
      {buttonOrder.map((symbol) => {
        const config = SYMBOL_CONFIG[symbol];
        const currentBet = bets[symbol];
        const hasBet = currentBet > 0;

        return (
          <div key={symbol} className="flex flex-col items-center gap-1">
            {/* Bet Digital Readout */}
            <div className={`
                w-full text-center font-led text-sm md:text-lg h-6 flex items-center justify-center rounded border border-gray-700 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]
                ${hasBet ? 'bg-black text-red-500 shadow-[0_0_5px_rgba(239,68,68,0.4)]' : 'bg-black/50 text-red-900'}
            `}>
              {hasBet ? currentBet : '0'}
            </div>
            
            {/* Physical Button */}
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
                group relative w-full aspect-[1/1] md:aspect-[3/4]
                flex flex-col items-center justify-center
                rounded-lg border-b-4 border-r-4
                transition-all duration-75 active:border-b-0 active:border-r-0 active:translate-y-1 active:translate-x-1
                ${disabled 
                    ? 'bg-gray-700 border-gray-900 opacity-60 cursor-not-allowed' 
                    : 'bg-gradient-to-br from-white/90 to-gray-200 border-gray-400 hover:brightness-110 cursor-pointer shadow-[0_5px_15px_rgba(0,0,0,0.5)]'
                }
              `}
            >
              {/* Button Top Gloss */}
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/80 to-transparent rounded-t-lg opacity-50 pointer-events-none" />
              
              <div className={`${config.color} scale-75 md:scale-100 drop-shadow-sm`}>
                {config.icon}
              </div>
              
              {/* LED light inside button (turns on when bet placed) */}
              <div className={`
                 absolute bottom-2 w-8 h-1 rounded-full blur-[2px] transition-opacity
                 ${hasBet ? 'bg-yellow-400 opacity-100' : 'bg-transparent opacity-0'}
              `}></div>
            </button>
            
            {/* Label below button */}
            <span className="text-[9px] md:text-[10px] text-gray-400 font-bold tracking-widest uppercase font-arcade mt-1">
                {config.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};