import React from 'react';

export const TraditionalDoor = ({ side, isOpen }: { side: 'left' | 'right'; isOpen: boolean }) => {
  const isLeft = side === 'left';
  
  return (
    <div 
      className={`absolute top-0 ${isLeft ? 'left-0' : 'right-0'} w-1/2 h-full z-50 overflow-hidden shadow-2xl bg-gradient-to-r from-[#3e1a04] via-[#5c2605] to-[#3e1a04] border-x-4 border-y-8 border-[#290f02] flex flex-col items-center justify-around py-12`}
      style={{ 
        transform: isOpen ? `rotateY(${isLeft ? '-110deg' : '110deg'})` : 'rotateY(0deg)', 
        transformOrigin: isLeft ? 'left center' : 'right center', 
        transition: 'transform 2.5s cubic-bezier(0.4, 0, 0.2, 1) 0.5s',
        pointerEvents: isOpen ? 'none' : 'auto' 
      }}
    >
      {[...Array(3)].map((_, i) => (
        <div key={i} className="w-2/3 h-1/4 bg-[#451a03] border-4 border-[#78350f] rounded-sm shadow-inner flex items-center justify-center relative overflow-hidden">
          <div className="w-5/6 h-5/6 border border-[#92400e]/50 absolute"></div>
          <div className="grid grid-cols-2 gap-4">
             <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-300 to-amber-700 shadow-md"></div>
             <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-300 to-amber-700 shadow-md"></div>
             <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-300 to-amber-700 shadow-md"></div>
             <div className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-300 to-amber-700 shadow-md"></div>
          </div>
        </div>
      ))}
      <div className={`absolute top-1/2 -translate-y-1/2 ${isLeft ? 'right-4' : 'left-4'} w-12 h-12 rounded-full border-4 border-amber-500 shadow-xl flex items-center justify-center bg-[#5c2605]/50`}>
         <div className="w-6 h-6 rounded-full border-4 border-amber-400"></div>
      </div>
      {isLeft && <div className="absolute right-0 top-0 w-2 h-full bg-black/50 z-10"></div>}
    </div>
  );
};
