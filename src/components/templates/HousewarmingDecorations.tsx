import React from 'react';

export const GaneshSymbol = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M40 25 L45 12 L50 5 L55 12 L60 25 Z" fill="currentColor" stroke="none" />
    <path d="M35 28 L65 28 L60 25 L40 25 Z" fill="currentColor" stroke="none" />
    <path d="M35 38 C 15 25, 5 60, 30 65 C 33 66, 35 55, 35 50" fill="currentColor" fillOpacity="0.1"/>
    <path d="M65 38 C 85 25, 95 60, 70 65 C 67 66, 65 55, 65 50" fill="currentColor" fillOpacity="0.1"/>
    <path d="M35 38 C 35 38, 50 30, 65 38 C 65 55, 60 65, 50 65 C 43 65, 42 78, 52 85 C 62 92, 70 80, 63 72" />
    <line x1="61" y1="52" x2="70" y2="48" strokeWidth="3"/>
    <line x1="39" y1="52" x2="34" y2="50" strokeWidth="3"/>
    <path d="M40 45 Q 43 43 45 46" strokeWidth="2" />
    <path d="M60 45 Q 57 43 55 46" strokeWidth="2" />
    <path d="M48 33 L52 33 L50 40 Z" fill="currentColor" stroke="none" />
  </svg>
);

export const HangingMarigold = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" className="mx-auto my-0.5 drop-shadow-sm">
    <circle cx="10" cy="10" r="8" fill="#ea580c"/>
    <circle cx="10" cy="10" r="5" fill="#eab308"/>
    <circle cx="10" cy="10" r="2" fill="#ca8a04"/>
  </svg>
);

export const HangingLeaf = () => (
  <svg width="20" height="24" viewBox="0 0 20 30" className="mx-auto drop-shadow-sm">
    <path d="M10 0 C 20 10, 18 20, 10 30 C 2 20, 0 10, 10 0 Z" fill="#15803d" />
  </svg>
);

export const VerticalGarland = ({ length, delay, className }: { length: number; delay: string; className?: string }) => (
  <div className={`flex flex-col items-center animate-[swing_4s_ease-in-out_infinite] ${className}`} style={{ animationDelay: delay, transformOrigin: 'top center' }}>
    <div className="w-0.5 h-4 bg-amber-600/50"></div>
    {[...Array(length)].map((_, i) => <HangingMarigold key={i} />)}
    <HangingLeaf />
  </div>
);

export const FloralArch = () => (
  <div className="absolute top-0 left-0 w-full z-20 pointer-events-none">
    <div className="w-full h-12 sm:h-16 bg-gradient-to-r from-green-800 via-green-700 to-green-800 flex justify-around items-end overflow-hidden border-b-4 border-amber-500 shadow-md">
       {[...Array(30)].map((_, i) => (
          <div key={i} className="-mb-2">
            <HangingMarigold />
            <HangingMarigold />
          </div>
       ))}
    </div>
    <div className="flex justify-between px-4 sm:px-12 -mt-1">
      <VerticalGarland length={8} delay="0.1s" className="block" />
      <VerticalGarland length={5} delay="0.3s" className="hidden sm:block" />
      <VerticalGarland length={3} delay="0.5s" className="block" />
      <VerticalGarland length={4} delay="0.2s" className="hidden md:block" />
      <VerticalGarland length={3} delay="0.4s" className="block" />
      <VerticalGarland length={5} delay="0.6s" className="hidden sm:block" />
      <VerticalGarland length={8} delay="0.2s" className="block" />
    </div>
  </div>
);
