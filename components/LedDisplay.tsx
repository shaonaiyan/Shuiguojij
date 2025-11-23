import React from 'react';

interface LedDisplayProps {
  label: string;
  value: number;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LedDisplay: React.FC<LedDisplayProps> = ({ label, value, color = 'text-red-500', size = 'md' }) => {
  // Ensure we always show 4 digits or more
  const formattedValue = Math.min(value, 99999).toString().padStart(value > 9999 ? 5 : 4, '0');
  
  const sizeConfig = {
    sm: { text: 'text-2xl', height: 'h-10' },
    md: { text: 'text-4xl', height: 'h-16' },
    lg: { text: 'text-6xl', height: 'h-20' }
  };

  return (
    <div className="flex flex-col items-center group">
      <span className="text-yellow-500/80 text-[10px] md:text-xs font-arcade font-bold uppercase tracking-[0.2em] mb-1 drop-shadow-md">
        {label}
      </span>
      <div className={`relative bg-black border-4 border-gray-800 rounded-md shadow-[inset_0_2px_10px_rgba(0,0,0,1)] px-3 py-1 ${sizeConfig[size].height} flex items-center justify-center overflow-hidden`}>
         {/* Background "ghost" 8888s for realism */}
         <div className={`absolute inset-0 flex items-center justify-center font-led font-bold tracking-widest text-gray-900 ${sizeConfig[size].text} select-none z-0 opacity-20`}>
           8888
         </div>
         
         {/* Actual Value */}
         <div className={`relative z-10 font-led font-bold tracking-widest ${color} ${sizeConfig[size].text} drop-shadow-[0_0_8px_currentColor]`}>
          {formattedValue}
         </div>
         
         {/* Screen reflection glare */}
         <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-20"></div>
      </div>
    </div>
  );
};