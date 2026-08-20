import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface CountdownTimerProps {
  targetDate: string;
  theme?: 'royal' | 'minimal' | 'coastal' | 'traditional';
  className?: string;
}

export default function CountdownTimer({ targetDate, theme = 'royal', className = '' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      } else {
        setTimeLeft(null);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return null;

  const styles = {
    royal: {
      container: "flex gap-2 md:gap-8 justify-center px-4",
      box: "flex flex-col items-center bg-white shadow-lg border border-[#D4AF37]/20 rounded-xl p-2 md:p-5 w-16 md:w-28",
      value: "text-2xl md:text-4xl font-serif italic text-[#6B1E1E]",
      label: "text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-bold mt-1"
    },
    minimal: {
      container: "flex gap-2 md:gap-6 justify-center",
      box: "flex flex-col items-center border-b border-black/10 pb-2 w-16 md:w-20",
      value: "text-xl md:text-3xl font-light",
      label: "text-[7px] md:text-[9px] uppercase tracking-widest opacity-40 mt-1"
    },
    coastal: {
      container: "flex gap-3 md:gap-5 justify-center",
      box: "flex flex-col items-center bg-sky-50 rounded-full p-4 md:p-6 w-20 md:w-28 h-20 md:h-28 justify-center border border-sky-100",
      value: "text-lg md:text-2xl font-serif text-sky-900",
      label: "text-[8px] md:text-[9px] uppercase tracking-widest text-sky-800/50 mt-1"
    },
    traditional: {
      container: "flex gap-2 md:gap-8 justify-center px-4",
      box: "flex flex-col items-center bg-[#fdfaf5] border-2 border-[#2E7D32]/10 rounded-2xl p-2 md:p-5 w-16 md:w-28",
      value: "text-2xl md:text-4xl font-serif text-[#1B5E20]",
      label: "text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-[#2E7D32] font-bold mt-1"
    }
  }[theme];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${styles.container} ${className}`}
    >
      {[
        { label: 'Days', value: timeLeft.days },
        { label: 'Hours', value: timeLeft.hours },
        { label: 'Minutes', value: timeLeft.minutes },
        { label: 'Seconds', value: timeLeft.seconds },
      ].map((item, idx) => (
        <motion.div 
          key={item.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: idx * 0.1 }}
          className={styles.box}
        >
          <span className={styles.value}>{item.value.toString().padStart(2, '0')}</span>
          <span className={styles.label}>{item.label}</span>
        </motion.div>
      ))}
    </motion.div>
  );
}
