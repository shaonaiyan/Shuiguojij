import React, { useState, useRef, useCallback, useEffect } from 'react';
import { BOARD_LAYOUT, WEIGHTS } from './constants';
import { BetState, INITIAL_BETS, SymbolType } from './types';
import { LedDisplay } from './components/LedDisplay';
import { GridSquare } from './components/GridSquare';
import { Controls } from './components/Controls';
import { playSpinNote, playWinSound, playCoinSound, playErrorSound, playStopSound, playCreditCountSound, playCollectionSound, playBonusSound } from './utils/sound';
import { Coins, Flame, Gift, Skull } from 'lucide-react';

// Animation Constants
const START_DELAY = 30; 
const END_DELAY = 600; 
const MIN_SPINS = 3;    

export default function App() {
  const [credits, setCredits] = useState<number>(1000); // Higher start credits for testing
  const [displayedWinAmount, setDisplayedWinAmount] = useState<number>(0);
  const [targetWinAmount, setTargetWinAmount] = useState<number>(0);
  const [bets, setBets] = useState<BetState>(INITIAL_BETS);
  
  // Game Logic State
  const [activeCellId, setActiveCellId] = useState<number | null>(null);
  const [trailIndices, setTrailIndices] = useState<number[]>([]); 
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("INSERT COIN");
  const [isBigWin, setIsBigWin] = useState<boolean>(false);
  
  // NEW MECHANICS STATE
  const [rage, setRage] = useState<number>(0); // 0 to 100
  const [freeSpins, setFreeSpins] = useState<number>(0);
  const [collectedItems, setCollectedItems] = useState<SymbolType[]>([]);
  const [consecutiveLosses, setConsecutiveLosses] = useState<number>(0);
  const [totalSpins, setTotalSpins] = useState<number>(0);

  const timeoutRef = useRef<number | null>(null);
  const currentCellRef = useRef<number>(0);

  // Score Ticking Effect
  useEffect(() => {
    if (displayedWinAmount < targetWinAmount) {
      const diff = targetWinAmount - displayedWinAmount;
      const step = Math.ceil(diff / 10); 
      
      const timer = setTimeout(() => {
        setDisplayedWinAmount(prev => Math.min(prev + step, targetWinAmount));
        playCreditCountSound();
      }, 50);
      return () => clearTimeout(timer);
    } else if (displayedWinAmount > targetWinAmount) {
        setDisplayedWinAmount(targetWinAmount);
    }
  }, [displayedWinAmount, targetWinAmount]);

  const totalBet = (Object.values(bets) as number[]).reduce((a: number, b: number) => a + b, 0);

  // DDA (Dynamic Difficulty) & RNG
  const getRandomTarget = useCallback(() => {
    // DDA: Protection for consecutive losses
    if (consecutiveLosses >= 10) {
        // Force a Luck or Apple hit
        return Math.random() > 0.5 ? 9 : 4; 
    }
    
    // DDA: Newbie Boost (first 500 spins)
    // We stick to the weights which are already generous for Apple (40%)
    
    const totalWeight = Object.values(WEIGHTS).reduce((a: number, b: number) => a + b, 0);
    let random = Math.random() * totalWeight;
    for (const [id, weight] of Object.entries(WEIGHTS)) {
      random -= weight;
      if (random <= 0) return parseInt(id);
    }
    return 0; 
  }, [consecutiveLosses]);

  const spin = useCallback(() => {
    // Free Spin doesn't cost credits
    if (freeSpins === 0) {
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
        setCredits(prev => prev - totalBet);
    } else {
        setFreeSpins(prev => prev - 1);
        setMessage(`FREE SPIN (${freeSpins - 1})`);
    }

    setTargetWinAmount(0);
    setDisplayedWinAmount(0);
    setIsSpinning(true);
    setIsBigWin(false);
    
    if (freeSpins === 0) setMessage("SPINNING...");

    const targetId = getRandomTarget();
    const currentPos = currentCellRef.current;
    
    const distance = (targetId - currentPos + 24) % 24;
    const extraSpins = 24 * (MIN_SPINS + Math.floor(Math.random() * 2)); 
    const totalSteps = extraSpins + distance;
    
    let currentStep = 0;
    
    const runStep = () => {
      currentCellRef.current = (currentCellRef.current + 1) % 24;
      const currentId = currentCellRef.current;
      setActiveCellId(currentId);

      const prev1 = (currentId - 1 + 24) % 24;
      const prev2 = (currentId - 2 + 24) % 24;
      setTrailIndices([prev1, prev2]);

      currentStep++;

      let delay = START_DELAY;
      const stepsRemaining = totalSteps - currentStep;
      let speedRatio = 1;

      if (stepsRemaining < 20) {
         const t = (20 - stepsRemaining) / 20; 
         delay = START_DELAY + (END_DELAY - START_DELAY) * (t * t); 
         speedRatio = 1 - t;
         if (stepsRemaining < 5) setTrailIndices([]);
      }

      playSpinNote(currentId, speedRatio);

      if (currentStep < totalSteps) {
        timeoutRef.current = window.setTimeout(runStep, delay);
      } else {
        playStopSound();
        setTrailIndices([]); 
        handleSpinEnd(targetId);
      }
    };

    setTotalSpins(prev => prev + 1);
    runStep();
  }, [bets, credits, totalBet, freeSpins, getRandomTarget]);

  const handleSpinEnd = (landedId: number) => {
    setIsSpinning(false);
    const landedCell = BOARD_LAYOUT.find(c => c.id === landedId);
    if (!landedCell) return;

    const betOnSymbol = bets[landedCell.symbol];
    let win = 0;
    const isFreeSpinActive = freeSpins > 0;
    
    // 1. Calculate Base Win
    if (betOnSymbol > 0 && landedCell.multiplier > 0) {
      win = betOnSymbol * landedCell.multiplier;
    } 
    
    // 2. Special Rules
    if (landedCell.symbol === SymbolType.LUCK) {
      // Send Light Logic: Randomly give 20-100 credits
      win = 50 * (Math.floor(Math.random() * 5) + 1);
      setMessage("LUCKY LIGHT!");
      setConsecutiveLosses(0); // Reset bad luck
    }

    // 3. Collection Mechanics (Small Fruits)
    if (landedCell.isSmall && betOnSymbol > 0) {
        // Add to collection
        if (!collectedItems.includes(landedCell.symbol)) {
            const newCollection = [...collectedItems, landedCell.symbol];
            setCollectedItems(newCollection);
            playCollectionSound();
            
            // Check for Full Collection
            if (newCollection.length >= 5) {
                // BONUS TRIGGER
                setTimeout(() => {
                    playBonusSound();
                    setMessage("COLLECTION BONUS!");
                    setTargetWinAmount(w => w + 500);
                    setCredits(c => c + 500);
                    setCollectedItems([]);
                }, 1000);
            }
        }
    }

    // 4. Rage Mechanics & Free Spin Multiplier
    if (win > 0) {
        // Winning
        if (isFreeSpinActive) {
            win *= 2; // Double win in Free Spin
            setMessage("DOUBLE WIN!");
        }
        setConsecutiveLosses(0);
        
        // Jackpot Chance on Red BAR
        if (landedCell.symbol === SymbolType.BAR && landedCell.multiplier >= 100) {
             if (Math.random() < 0.1) { // 10% chance for extra Jackpot if hit
                 win += 5000;
                 setMessage("JACKPOT!!!");
             }
        }

        playWinSound(landedCell.multiplier);
        setTargetWinAmount(prev => prev + win);
        setCredits(prev => prev + win);
        
        if (landedCell.multiplier >= 20 || win > 500) setIsBigWin(true);
        if (!isFreeSpinActive && win < 100) setMessage("WINNER!");

    } else {
        // Losing
        if (!isFreeSpinActive) {
            setConsecutiveLosses(prev => prev + 1);
            setRage(prev => {
                const newRage = Math.min(prev + 5, 100);
                if (newRage === 100) {
                    // Trigger Free Spins
                    setTimeout(() => {
                        playBonusSound();
                        setFreeSpins(5);
                        setRage(0);
                        setMessage("LEOPARD RAGE MODE!");
                    }, 500);
                }
                return newRage;
            });
            setMessage("TRY AGAIN");
        }
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
      setCredits(c => c + 100);
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
      
      {/* Visual Cabinet */}
      <div className={`relative metal-gradient p-4 md:p-6 rounded-[40px] shadow-[0_0_50px_rgba(0,0,0,0.8)] border-4 ${freeSpins > 0 ? 'border-red-500 shadow-[0_0_50px_red]' : 'border-[#222]'}`}>
        
        {/* Main Interface Area */}
        <div className="bg-black rounded-[20px] p-2 md:p-4 border-[6px] border-gray-800 shadow-inner relative overflow-hidden max-w-2xl w-full mx-auto">
            
            {/* Top Display Panel */}
            <div className="glass-panel p-3 mb-3 rounded-lg border border-gray-700 flex justify-between items-center relative z-10">
                <LedDisplay label="WIN" value={displayedWinAmount} color={displayedWinAmount > 0 ? "text-green-400" : "text-red-500"} size="md" />
                <div className="flex flex-col items-center z-10">
                    <h1 className="text-yellow-500 font-arcade text-lg md:text-3xl font-black italic tracking-widest drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                        LEOPARD <span className="text-red-500">RAGE</span>
                    </h1>
                    <div className={`text-blue-400 font-led text-sm ${isSpinning ? 'animate-pulse' : ''}`}>
                      {message}
                    </div>
                </div>
                <LedDisplay label="CREDIT" value={credits} color="text-red-500" size="md" />
            </div>

            {/* Main Game Grid */}
            <div className={`relative bg-[#0a0a0a] p-2 md:p-3 rounded-xl border-2 border-gray-800 shadow-[inset_0_0_30px_black] mb-3 transition-colors duration-100 ${freeSpins > 0 ? 'bg-red-900/20' : ''}`}>
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
                        // Show collected state for small items
                        isCollected={cell.isSmall && collectedItems.includes(cell.symbol)}
                        {...{style: getGridArea(cell.id)}}
                        />
                      );
                    })}

                    {/* Center Decoration & Info */}
                    <div className="col-start-2 col-end-7 row-start-2 row-end-7 m-1 bg-gray-900 rounded-lg border border-gray-700 flex flex-col items-center justify-between relative overflow-hidden p-4">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                        
                        {/* Rage Bar (Top) */}
                        <div className="w-full flex items-center gap-2 mb-2 z-10">
                            <span className="text-xs font-bold text-red-500">RAGE</span>
                            <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-600">
                                <div 
                                    className={`h-full transition-all duration-300 ${freeSpins > 0 ? 'bg-red-500 animate-pulse' : 'bg-orange-600'}`}
                                    style={{ width: `${freeSpins > 0 ? 100 : rage}%` }}
                                ></div>
                            </div>
                            {freeSpins > 0 && <Flame size={16} className="text-red-500 animate-bounce" />}
                        </div>

                        {/* Start Button */}
                        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-b from-gray-800 to-black p-2 shadow-[0_10px_20px_black] flex items-center justify-center border-4 border-gray-700 z-10">
                            <div className={`absolute inset-2 rounded-full border-2 border-dashed border-yellow-600/30 ${isSpinning ? 'animate-[spin_2s_linear_infinite]' : 'animate-[spin_20s_linear_infinite]'}`}></div>
                            <button 
                                onClick={spin}
                                disabled={isSpinning}
                                className={`
                                    w-24 h-24 md:w-32 md:h-32 rounded-full
                                    flex flex-col items-center justify-center gap-1
                                    text-xl font-black font-arcade tracking-wider
                                    shadow-[0_5px_10px_black,inset_0_2px_5px_rgba(255,255,255,0.3)]
                                    transition-all active:scale-95
                                    ${isSpinning 
                                        ? 'bg-red-950 text-gray-500 cursor-not-allowed border-4 border-red-900' 
                                        : freeSpins > 0 
                                            ? 'bg-gradient-to-br from-yellow-600 to-red-600 text-white border-4 border-yellow-400 animate-pulse'
                                            : 'bg-gradient-to-br from-red-600 to-red-800 text-white hover:brightness-110 border-4 border-red-500'
                                    }
                                `}
                            >
                                <span className="drop-shadow-md">{isSpinning ? '...' : freeSpins > 0 ? 'FREE' : 'SPIN'}</span>
                            </button>
                        </div>

                        {/* Collection Tray (Bottom) */}
                        <div className="w-full bg-black/50 rounded-lg p-2 border border-gray-800 z-10">
                            <div className="flex justify-between items-center text-[10px] text-gray-400 mb-1">
                                <span>FRUIT COLLECTION</span>
                                <span>{collectedItems.length}/5</span>
                            </div>
                            <div className="flex justify-between gap-1">
                                {[0,1,2,3,4].map(i => (
                                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < collectedItems.length ? 'bg-green-500 shadow-[0_0_5px_lime]' : 'bg-gray-700'}`}></div>
                                ))}
                            </div>
                        </div>

                        {/* Bet Indicator */}
                        <div className="absolute bottom-4 right-4 bg-black/80 px-3 py-1 rounded border border-gray-600 text-red-500 font-led z-10">
                            BET: {totalBet}
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <Controls bets={bets} onPlaceBet={handlePlaceBet} disabled={isSpinning || freeSpins > 0} />

            {/* Bottom Utility Bar */}
            <div className="mt-3 flex justify-between items-center px-2">
                <button 
                    onClick={handleClearBets} 
                    disabled={isSpinning || freeSpins > 0}
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
            
             <div className="scanlines pointer-events-none opacity-30"></div>
             {freeSpins > 0 && <div className="absolute inset-0 bg-red-500/10 mix-blend-overlay pointer-events-none z-0 animate-pulse"></div>}
        </div>
      </div>
    </div>
  );
}