import React from 'react';

interface LedDisplayProps {
  label: string;
  value: number;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LedDisplay: React.FC<LedDisplayProps> = ({ label, value, color = 'text-red-500', size = 'md' }) => {
  const formattedValue = Math.min(value, 99999).toString().padStart(value > 9999 ? 5 : 4, '0');
  
  const sizeConfig = {
    sm: { text: 'text-xl md:text-2xl', height: 'h-8 md:h-10' },
    md: { text: 'text-2xl md:text-4xl', height: 'h-12 md:h-16' },
    lg: { text: 'text-4xl md:text-6xl', height: 'h-16 md:h-20' }
  };

  return (
    <div className="flex flex-col items-center">
      <span className="text-gray-400 text-[9px] md:text-[10px] font-arcade font-bold uppercase tracking-widest mb-0.5 text-shadow-sm">
        {label}
      </span>
      <div className={`
          relative bg-black rounded md:rounded-md 
          border-b border-r border-gray-700
          shadow-[inset_0_2px_6px_black] 
          px-2 md:px-3 py-0.5 
          ${sizeConfig[size].height} flex items-center justify-center 
          overflow-hidden min-w-[80px] md:min-w-[120px]
      `}>
         {/* Ghost Segments */}
         <div className={`absolute inset-0 flex items-center justify-center font-led tracking-[0.1em] text-[#1a1a1a] ${sizeConfig[size].text} select-none z-0`}>
           8888
         </div>
         
         {/* Active Value */}
         <div className={`relative z-10 font-led tracking-[0.1em] ${color} ${sizeConfig[size].text} drop-shadow-[0_0_5px_currentColor]`}>
          {formattedValue}
         </div>
         
         {/* Glass Reflection */}
         <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none z-20"></div>
      </div>
    </div>
  );
};