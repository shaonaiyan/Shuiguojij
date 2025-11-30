import React, { useState, useRef, useCallback, useEffect } from 'react';
import { BOARD_LAYOUT, WEIGHTS } from './constants';
import { BetState, INITIAL_BETS, SymbolType } from './types';
import { LedDisplay } from './components/LedDisplay';
import { GridSquare } from './components/GridSquare';
import { Controls } from './components/Controls';
import { playSpinNote, playWinSound, playCoinSound, playErrorSound, playStopSound, playCreditCountSound, playCollectionSound, playBonusSound } from './utils/sound';
import { Coins, Flame, Trophy, RotateCw } from 'lucide-react';

// Animation Constants
const START_DELAY = 30; 
const END_DELAY = 600; 
const MIN_SPINS = 3;    

export default function App() {
  const [credits, setCredits] = useState<number>(1000); 
  const [displayedWinAmount, setDisplayedWinAmount] = useState<number>(0);
  const [targetWinAmount, setTargetWinAmount] = useState<number>(0);
  const [bets, setBets] = useState<BetState>(INITIAL_BETS);
  
  const [activeCellId, setActiveCellId] = useState<number | null>(null);
  const [trailIndices, setTrailIndices] = useState<number[]>([]); 
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("INSERT COIN");
  const [isBigWin, setIsBigWin] = useState<boolean>(false);
  
  const [rage, setRage] = useState<number>(0);
  const [freeSpins, setFreeSpins] = useState<number>(0);
  const [collectedItems, setCollectedItems] = useState<SymbolType[]>([]);
  const [consecutiveLosses, setConsecutiveLosses] = useState<number>(0);
  const [totalSpins, setTotalSpins] = useState<number>(0);

  const timeoutRef = useRef<number | null>(null);
  const currentCellRef = useRef<number>(0);

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

  const getRandomTarget = useCallback(() => {
    if (consecutiveLosses >= 10) {
        return Math.random() > 0.5 ? 9 : 4; 
    }
    const totalWeight = Object.values(WEIGHTS).reduce((a: number, b: number) => a + b, 0);
    let random = Math.random() * totalWeight;
    for (const [id, weight] of Object.entries(WEIGHTS)) {
      random -= weight;
      if (random <= 0) return parseInt(id);
    }
    return 0; 
  }, [consecutiveLosses]);

  const spin = useCallback(() => {
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
    
    if (betOnSymbol > 0 && landedCell.multiplier > 0) {
      win = betOnSymbol * landedCell.multiplier;
    } 
    
    if (landedCell.symbol === SymbolType.LUCK) {
      win = 50 * (Math.floor(Math.random() * 5) + 1);
      setMessage("LUCKY LIGHT!");
      setConsecutiveLosses(0); 
    }

    if (landedCell.isSmall && betOnSymbol > 0) {
        if (!collectedItems.includes(landedCell.symbol)) {
            const newCollection = [...collectedItems, landedCell.symbol];
            setCollectedItems(newCollection);
            playCollectionSound();
            if (newCollection.length >= 5) {
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

    if (win > 0) {
        if (isFreeSpinActive) {
            win *= 2; 
            setMessage("DOUBLE WIN!");
        }
        setConsecutiveLosses(0);
        
        if (landedCell.symbol === SymbolType.BAR && landedCell.multiplier >= 100) {
             if (Math.random() < 0.1) {
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
        if (!isFreeSpinActive) {
            setConsecutiveLosses(prev => prev + 1);
            setRage(prev => {
                const newRage = Math.min(prev + 5, 100);
                if (newRage === 100) {
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
    <div className={`
      min-h-[100dvh] w-full flex items-center justify-center 
      bg-[#050505] p-2 md:p-4 
      overflow-hidden 
      ${isBigWin ? 'animate-shake' : ''}
    `}>
      
      {/* Cabinet Body */}
      <div className={`
        relative w-full max-w-lg
        metal-gradient 
        rounded-2xl md:rounded-[40px] 
        shadow-[0_0_50px_rgba(0,0,0,0.8),0_10px_20px_rgba(0,0,0,0.5)] 
        border-[3px] md:border-4 
        transition-colors duration-500
        flex flex-col
        ${freeSpins > 0 ? 'border-red-600 shadow-[0_0_30px_red]' : 'border-[#222]'}
      `}>
        
        {/* Screw Details */}
        <div className="absolute top-3 left-3 w-2 h-2 md:w-4 md:h-4 rounded-full bg-[#555] shadow-inner flex items-center justify-center"><div className="w-full h-[1px] bg-[#222] rotate-45"></div></div>
        <div className="absolute top-3 right-3 w-2 h-2 md:w-4 md:h-4 rounded-full bg-[#555] shadow-inner flex items-center justify-center"><div className="w-full h-[1px] bg-[#222] rotate-45"></div></div>
        
        {/* Main Content Container */}
        <div className="p-2 md:p-5 flex-1 flex flex-col gap-2 md:gap-4">

            {/* Top Display Panel */}
            <div className="glass-panel p-2 md:p-3 rounded-lg border border-gray-700/50 flex justify-between items-center relative z-20">
                <LedDisplay label="WIN" value={displayedWinAmount} color={displayedWinAmount > 0 ? "text-green-400" : "text-red-500"} size="sm" />
                
                <div className="flex flex-col items-center flex-1 px-2">
                    <h1 className="text-yellow-500 font-arcade text-base md:text-3xl font-black italic tracking-widest drop-shadow-[0_0_5px_rgba(234,179,8,0.5)] text-center leading-tight">
                        <span className="text-white">SUPER</span> <span className="text-red-500">FRUIT</span>
                    </h1>
                    <div className={`
                        text-cyan-400 font-led text-[10px] md:text-sm mt-1
                        ${isSpinning ? 'animate-pulse' : ''}
                    `}>
                      {message}
                    </div>
                </div>
                
                <LedDisplay label="CREDITS" value={credits} color="text-red-500" size="sm" />
            </div>

            {/* Game Grid Board */}
            <div className={`
                relative bg-[#080808] 
                p-2 md:p-3 
                rounded-xl md:rounded-2xl 
                border border-gray-800 
                shadow-[inset_0_0_20px_black] 
                transition-colors duration-300
                ${freeSpins > 0 ? 'bg-red-950/20 border-red-900/50' : ''}
            `}>
                <div className="grid grid-cols-7 grid-rows-[repeat(7,1fr)] gap-1 md:gap-2 aspect-square w-full">
                    {BOARD_LAYOUT.map((cell) => {
                      const isActive = activeCellId === cell.id;
                      const isTrail = trailIndices.includes(cell.id);
                      
                      return (
                        <GridSquare 
                        key={cell.id} 
                        cell={cell} 
                        activeState={isActive ? 'active' : isTrail ? 'trail' : 'idle'}
                        isCollected={cell.isSmall && collectedItems.includes(cell.symbol)}
                        {...{style: getGridArea(cell.id)}}
                        />
                      );
                    })}

                    {/* CENTER DASHBOARD */}
                    <div className="
                        col-start-2 col-end-7 row-start-2 row-end-7 
                        m-0.5 md:m-1 
                        bg-[#111] rounded-lg border border-gray-800 
                        flex flex-col items-center justify-between 
                        relative overflow-hidden 
                        p-2 md:p-4
                    ">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                        
                        {/* Rage Meter */}
                        <div className="w-full flex items-center gap-1.5 md:gap-2 z-10">
                            <Flame size={12} className={`md:w-5 md:h-5 ${freeSpins > 0 ? 'text-red-500 animate-bounce' : 'text-gray-600'}`} />
                            <div className="flex-1 h-2 md:h-3 bg-gray-900 rounded-full overflow-hidden border border-gray-700 shadow-inner">
                                <div 
                                    className={`h-full transition-all duration-300 ${freeSpins > 0 ? 'bg-gradient-to-r from-red-600 to-yellow-500 animate-pulse' : 'bg-gradient-to-r from-orange-800 to-orange-500'}`}
                                    style={{ width: `${freeSpins > 0 ? 100 : rage}%` }}
                                ></div>
                            </div>
                            <span className="text-[9px] md:text-xs font-bold text-gray-400 tabular-nums">{Math.floor(rage)}%</span>
                        </div>

                        {/* BIG START BUTTON */}
                        <div className="relative z-10 flex-1 flex items-center justify-center py-2">
                             {/* Spinning Ring */}
                            <div className={`
                                absolute w-32 h-32 md:w-48 md:h-48 rounded-full border border-dashed border-gray-700/50
                                ${isSpinning ? 'animate-[spin_1s_linear_infinite] border-yellow-600/50' : 'animate-[spin_10s_linear_infinite]'}
                            `}></div>

                            <button 
                                onClick={spin}
                                disabled={isSpinning}
                                className={`
                                    w-24 h-24 md:w-36 md:h-36 rounded-full
                                    flex flex-col items-center justify-center gap-0.5 md:gap-1
                                    text-lg md:text-2xl font-black font-arcade tracking-widest
                                    shadow-[0_8px_15px_rgba(0,0,0,0.6),inset_0_2px_5px_rgba(255,255,255,0.2)]
                                    transition-all active:scale-95 active:shadow-[inset_0_5px_15px_black]
                                    border-[4px] md:border-[6px]
                                    group
                                    ${isSpinning 
                                        ? 'bg-[#1a1a1a] text-gray-600 border-[#333]' 
                                        : freeSpins > 0 
                                            ? 'bg-gradient-to-br from-yellow-500 to-red-600 text-white border-yellow-400 shadow-[0_0_30px_rgba(255,0,0,0.4)] animate-pulse'
                                            : 'bg-gradient-to-br from-[#c00] to-[#800] text-white border-[#f00] hover:brightness-110'
                                    }
                                `}
                            >
                                <span className="drop-shadow-md z-10">
                                    {isSpinning ? '...' : freeSpins > 0 ? 'FREE' : 'SPIN'}
                                </span>
                                {!isSpinning && <RotateCw size={16} className="text-white/30 md:w-6 md:h-6 group-hover:rotate-180 transition-transform duration-500" />}
                            </button>
                        </div>

                        {/* Collection Tray */}
                        <div className="w-full bg-[#080808] rounded p-1.5 md:p-2 border border-gray-800 z-10 shadow-inner">
                            <div className="flex justify-between items-center text-[8px] md:text-[10px] text-gray-500 mb-1">
                                <span className="flex items-center gap-1"><Trophy size={8} /> COLLECTION</span>
                                <span className={collectedItems.length >= 4 ? 'text-yellow-500 animate-pulse' : ''}>{collectedItems.length}/5</span>
                            </div>
                            <div className="flex justify-between gap-0.5 md:gap-1 h-1.5 md:h-2">
                                {[0,1,2,3,4].map(i => (
                                    <div key={i} className={`flex-1 rounded-sm transition-all duration-300 ${i < collectedItems.length ? 'bg-gradient-to-r from-green-400 to-green-600 shadow-[0_0_5px_lime]' : 'bg-[#222]'}`}></div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Current Bet Tag */}
                         <div className="absolute top-2 right-2 md:top-4 md:right-4 bg-black/60 backdrop-blur px-2 py-0.5 rounded border border-gray-700 text-red-500 font-led text-[10px] md:text-xs z-10">
                            BET: {totalBet}
                        </div>
                    </div>
                </div>
            </div>

            {/* Controls Section */}
            <Controls bets={bets} onPlaceBet={handlePlaceBet} disabled={isSpinning || freeSpins > 0} />

            {/* Bottom Actions */}
            <div className="flex justify-between items-center gap-2 pt-1">
                <button 
                    onClick={handleClearBets} 
                    disabled={isSpinning || freeSpins > 0}
                    className="
                        px-3 py-2 rounded text-[10px] md:text-xs font-arcade 
                        text-gray-500 bg-[#111] border border-gray-800 
                        active:bg-gray-800 hover:text-white transition-colors
                    "
                >
                    RESET BETS
                </button>
                
                <button 
                    onClick={handleAddCredits}
                    className="
                        flex-1 flex items-center justify-center gap-2 
                        bg-gradient-to-r from-yellow-700 to-yellow-600 
                        py-2 rounded-lg 
                        font-bold text-black shadow-lg 
                        active:scale-95 transition-transform
                        border-t border-yellow-500
                    "
                >
                    <div className="w-1 h-4 md:h-5 bg-black/30 rounded-full"></div>
                    <span className="font-arcade text-xs md:text-sm drop-shadow-sm text-yellow-100">INSERT COIN</span>
                    <Coins size={14} className="text-yellow-100" />
                </button>
            </div>
            
        </div>
        
        {/* Overlay Effects */}
        <div className="scanlines pointer-events-none opacity-20"></div>
        {freeSpins > 0 && <div className="absolute inset-0 bg-red-500/5 mix-blend-overlay pointer-events-none z-0 animate-pulse rounded-[inherit]"></div>}
      </div>
    </div>
  );
}