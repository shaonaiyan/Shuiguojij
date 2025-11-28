import React, { useState, useRef, useCallback, useEffect } from 'react';
import { BOARD_LAYOUT, WEIGHTS } from './constants';
import { BetState, INITIAL_BETS, SymbolType } from './types';
import { LedDisplay } from './components/LedDisplay';
import { GridSquare } from './components/GridSquare';
import { Controls } from './components/Controls';
import { playSpinNote, playWinSound, playCoinSound, playErrorSound, playStopSound, playCreditCountSound } from './utils/sound';
import { Coins, Zap } from 'lucide-react';

// Animation Constants
const START_DELAY = 30; // Faster start
const END_DELAY = 600;  // Slower end for tension
const MIN_SPINS = 3;    

export default function App() {
  const [credits, setCredits] = useState<number>(100);
  const [displayedWinAmount, setDisplayedWinAmount] = useState<number>(0);
  const [targetWinAmount, setTargetWinAmount] = useState<number>(0);
  const [bets, setBets] = useState<BetState>(INITIAL_BETS);
  
  // Game State
  const [activeCellId, setActiveCellId] = useState<number | null>(null);
  const [trailIndices, setTrailIndices] = useState<number[]>([]); // For the "comet" trail effect
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("INSERT COIN");
  const [isBigWin, setIsBigWin] = useState<boolean>(false); // Triggers screen shake
  
  const timeoutRef = useRef<number | null>(null);
  const currentCellRef = useRef<number>(0);

  // Score Ticking Effect
  useEffect(() => {
    if (displayedWinAmount < targetWinAmount) {
      const diff = targetWinAmount - displayedWinAmount;
      const step = Math.ceil(diff / 10); // Dynamic step size for speed
      
      const timer = setTimeout(() => {
        setDisplayedWinAmount(prev => Math.min(prev + step, targetWinAmount));
        playCreditCountSound();
      }, 50);
      return () => clearTimeout(timer);
    } else if (displayedWinAmount > targetWinAmount) {
        // Reset case
        setDisplayedWinAmount(targetWinAmount);
    }
  }, [displayedWinAmount, targetWinAmount]);

  const totalBet = (Object.values(bets) as number[]).reduce((a: number, b: number) => a + b, 0);

  const getRandomTarget = () => {
    const totalWeight = Object.values(WEIGHTS).reduce((a: number, b: number) => a + b, 0);
    let random = Math.random() * totalWeight;
    for (const [id, weight] of Object.entries(WEIGHTS)) {
      random -= weight;
      if (random <= 0) return parseInt(id);
    }
    return 0; 
  };

  const spin = useCallback(() => {
    if (totalBet === 0) {
      setMessage("PLACE BET");
      playErrorSound();
      return;
    }
    if (totalBet > credits) {
      setMessage("NO COINS");
      playErrorSound();
      return;
    }

    // Deduct and Reset
    setCredits(prev => prev - totalBet);
    setTargetWinAmount(0);
    setDisplayedWinAmount(0);
    setIsSpinning(true);
    setIsBigWin(false);
    setMessage("SPINNING...");

    const targetId = getRandomTarget();
    const currentPos = currentCellRef.current;
    
    // Ensure we spin enough times to make it exciting
    const distance = (targetId - currentPos + 24) % 24;
    // Add randomness to total spins for variance in duration
    const extraSpins = 24 * (MIN_SPINS + Math.floor(Math.random() * 2)); 
    const totalSteps = extraSpins + distance;
    
    let currentStep = 0;
    
    const runStep = () => {
      // Move 1 step forward
      currentCellRef.current = (currentCellRef.current + 1) % 24;
      const currentId = currentCellRef.current;
      setActiveCellId(currentId);

      // Calculate Trail (last 2 positions)
      // Only show trail if we are moving relatively fast
      const prev1 = (currentId - 1 + 24) % 24;
      const prev2 = (currentId - 2 + 24) % 24;
      setTrailIndices([prev1, prev2]);

      currentStep++;

      // Calculate Speed/Delay
      let delay = START_DELAY;
      const stepsRemaining = totalSteps - currentStep;
      
      // Calculate speed ratio for sound (0 = slow, 1 = fast)
      let speedRatio = 1;

      if (stepsRemaining < 20) {
         // Exponential Slowdown
         const t = (20 - stepsRemaining) / 20; // 0 to 1
         delay = START_DELAY + (END_DELAY - START_DELAY) * (t * t); // Quadratic ease out
         speedRatio = 1 - t;
         
         // Remove trail at very end for precision feel
         if (stepsRemaining < 5) setTrailIndices([]);
      }

      playSpinNote(currentId, speedRatio);

      if (currentStep < totalSteps) {
        timeoutRef.current = window.setTimeout(runStep, delay);
      } else {
        // FINISHED
        playStopSound();
        setTrailIndices([]); // Clear trail
        handleSpinEnd(targetId);
      }
    };

    runStep();
  }, [bets, credits, totalBet]);

  const handleSpinEnd = (landedId: number) => {
    setIsSpinning(false);
    const landedCell = BOARD_LAYOUT.find(c => c.id === landedId);
    
    if (!landedCell) return;

    const betOnSymbol = bets[landedCell.symbol];
    let win = 0;

    if (betOnSymbol > 0 && landedCell.multiplier > 0) {
      win = betOnSymbol * landedCell.multiplier;
    } 
    else if (landedCell.symbol === SymbolType.LUCK) {
      // Special Luck Rules: Random Bonus
      win = Math.max(totalBet * 10, 100); 
      setMessage("JACKPOT!");
    }

    if (win > 0) {
      playWinSound(landedCell.multiplier > 0 ? landedCell.multiplier : 0);
      setTargetWinAmount(win);
      setCredits(prev => prev + win);
      setMessage(win > 50 ? "BIG WIN!!" : "WINNER!");
      
      // Trigger Big Win visual effects if multiplier is high
      if (landedCell.multiplier >= 20 || landedCell.symbol === SymbolType.LUCK) {
          setIsBigWin(true);
      }
    } else {
      setMessage("TRY AGAIN");
    }
  };

  const handlePlaceBet = (symbol: SymbolType) => {
    if (credits - totalBet > 0) {
      setBets(prev => ({
        ...prev,
        [symbol]: prev[symbol] + 1
      }));
    } else {
        playErrorSound();
    }
  };

  const handleClearBets = () => {
    setBets(INITIAL_BETS);
  };
  
  const handleAddCredits = () => {
      playCoinSound();
      setCredits(c => c + 10);
      setMessage("COIN IN");
  }

  const getGridArea = (id: number): React.CSSProperties => {
    if (id >= 0 && id <= 6) return { gridRow: 1, gridColumn: id + 1 };
    if (id >= 7 && id <= 11) return { gridRow: id - 5, gridColumn: 7 };
    if (id >= 12 && id <= 18) return { gridRow: 7, gridColumn: 7 - (id - 12) };
    if (id >= 19 && id <= 23) return { gridRow: 7 - (id - 18), gridColumn: 1 };
    return {};
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-2 font-sans overflow-hidden transition-transform ${isBigWin ? 'animate-shake' : ''}`}>
      
      {/* Visual Cabinet Wrapper */}
      <div className="relative metal-gradient p-4 md:p-6 rounded-[40px] shadow-[0_0_50px_rgba(0,0,0,0.8),inset_0_0_20px_rgba(255,255,255,0.1)] border-4 border-[#222]">
        
        {/* Decorative Screws */}
        <div className="absolute top-4 left-4 w-4 h-4 rounded-full bg-gray-400 shadow-inner flex items-center justify-center"><div className="w-full h-0.5 bg-gray-600 rotate-45"></div></div>
        <div className="absolute top-4 right-4 w-4 h-4 rounded-full bg-gray-400 shadow-inner flex items-center justify-center"><div className="w-full h-0.5 bg-gray-600 rotate-45"></div></div>
        <div className="absolute bottom-4 left-4 w-4 h-4 rounded-full bg-gray-400 shadow-inner flex items-center justify-center"><div className="w-full h-0.5 bg-gray-600 rotate-45"></div></div>
        <div className="absolute bottom-4 right-4 w-4 h-4 rounded-full bg-gray-400 shadow-inner flex items-center justify-center"><div className="w-full h-0.5 bg-gray-600 rotate-45"></div></div>

        {/* Main Interface Area */}
        <div className="bg-black rounded-[20px] p-2 md:p-4 border-[6px] border-gray-800 shadow-inner relative overflow-hidden max-w-2xl w-full mx-auto">
            
            {/* Top Display Panel */}
            <div className="glass-panel p-3 mb-3 rounded-lg border border-gray-700 flex justify-between items-center relative z-10">
                <LedDisplay label="WIN" value={displayedWinAmount} color={displayedWinAmount > 0 ? "text-green-400" : "text-red-500"} size="md" />
                <div className="flex flex-col items-center">
                    <h1 className="text-yellow-500 font-arcade text-lg md:text-3xl font-black italic tracking-widest drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                        SUPER <span className="text-red-500">FRUIT</span>
                    </h1>
                    <div className={`text-blue-400 font-led text-sm ${isSpinning ? 'animate-pulse' : ''}`}>
                      {message}
                    </div>
                </div>
                <LedDisplay label="CREDIT" value={credits} color="text-red-500" size="md" />
            </div>

            {/* Main Game Grid */}
            <div className={`relative bg-[#0a0a0a] p-2 md:p-3 rounded-xl border-2 border-gray-800 shadow-[inset_0_0_30px_black] mb-3 transition-colors duration-100 ${isBigWin ? 'border-red-500/50 bg-red-900/10' : ''}`}>
                <div className="grid grid-cols-7 grid-rows-[repeat(7,minmax(0,1fr))] gap-1.5 md:gap-2 aspect-square max-h-[50vh] mx-auto">
                    {/* Board Loop */}
                    {BOARD_LAYOUT.map((cell) => {
                      const isActive = activeCellId === cell.id;
                      const isTrail = trailIndices.includes(cell.id);
                      
                      return (
                        <GridSquare 
                        key={cell.id} 
                        cell={cell} 
                        activeState={isActive ? 'active' : isTrail ? 'trail' : 'idle'}
                        {...{style: getGridArea(cell.id)}}
                        />
                      );
                    })}

                    {/* Center Decoration */}
                    <div className="col-start-2 col-end-7 row-start-2 row-end-7 m-1 bg-gray-900 rounded-lg border border-gray-700 flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                        
                        {/* Circular Start Button Area */}
                        <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full bg-gradient-to-b from-gray-800 to-black p-2 shadow-[0_10px_20px_black] flex items-center justify-center border-4 border-gray-700">
                             {/* Decorative ring */}
                            <div className={`absolute inset-2 rounded-full border-2 border-dashed border-yellow-600/30 ${isSpinning ? 'animate-[spin_2s_linear_infinite]' : 'animate-[spin_20s_linear_infinite]'}`}></div>
                            
                            <button 
                                onClick={spin}
                                disabled={isSpinning}
                                className={`
                                    w-32 h-32 md:w-40 md:h-40 rounded-full
                                    flex flex-col items-center justify-center gap-1
                                    text-2xl font-black font-arcade tracking-wider
                                    shadow-[0_5px_10px_black,inset_0_2px_5px_rgba(255,255,255,0.3)]
                                    transition-all active:scale-95 active:shadow-[inset_0_5px_15px_black]
                                    ${isSpinning 
                                        ? 'bg-red-950 text-gray-500 cursor-not-allowed border-4 border-red-900' 
                                        : 'bg-gradient-to-br from-red-600 to-red-800 text-white hover:brightness-110 border-4 border-red-500 cursor-pointer pointer-events-auto'
                                    }
                                `}
                            >
                                <span className="drop-shadow-md">{isSpinning ? '...' : 'START'}</span>
                            </button>
                        </div>

                        {/* Bet Indicator */}
                        <div className="absolute bottom-4 right-4 bg-black/80 px-3 py-1 rounded border border-gray-600 text-red-500 font-led">
                            BET: {totalBet}
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <Controls bets={bets} onPlaceBet={handlePlaceBet} disabled={isSpinning} />

            {/* Bottom Utility Bar */}
            <div className="mt-3 flex justify-between items-center px-2">
                <button 
                    onClick={handleClearBets} 
                    disabled={isSpinning}
                    className="text-gray-500 text-xs font-arcade hover:text-white transition-colors uppercase tracking-widest"
                >
                    Reset Bets
                </button>
                
                <button 
                    onClick={handleAddCredits}
                    className="group flex items-center gap-2 bg-yellow-600 px-4 py-2 rounded-full font-bold text-black shadow-lg hover:bg-yellow-500 active:translate-y-1 transition-all"
                >
                    <div className="w-1 h-6 bg-black/20 rounded-full"></div> {/* Coin slot visual */}
                    <span className="font-arcade text-sm">INSERT COIN</span>
                    <Coins size={16} className="group-hover:rotate-12 transition-transform" />
                </button>
            </div>
            
             {/* Scanlines Overlay */}
             <div className="scanlines pointer-events-none opacity-30"></div>
             
             {/* Red Flash Overlay for Big Wins */}
             {isBigWin && <div className="absolute inset-0 bg-red-500/20 mix-blend-overlay animate-pulse pointer-events-none z-50"></div>}
        </div>
      </div>
    </div>
  );
}