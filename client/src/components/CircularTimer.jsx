import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function CircularTimer({ 
  duration = 30, 
  onTimeUp, 
  isActive = true,
  size = 80,
  resetKey = 0
}) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isWarning, setIsWarning] = useState(false);

  useEffect(() => {
    setTimeLeft(duration);
    setIsWarning(false);
  }, [resetKey, duration]);

  useEffect(() => {
    if (!isActive) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onTimeUp?.();
          return 0;
        }
        
        if (prev <= 10) {
          setIsWarning(true);
        } else {
          setIsWarning(false);
        }
        
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, onTimeUp, resetKey]);

  const percentage = (timeLeft / duration) * 100;
  const circumference = 2 * Math.PI * (size / 2 - 10);
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getGradient = () => {
    if (timeLeft <= 5) return { from: '#dc2626', to: '#ef4444', glow: '#fca5a5' }; // red
    if (timeLeft <= 10) return { from: '#ea580c', to: '#f97316', glow: '#fdba74' }; // orange
    return { from: '#dc2626', to: '#f97316', glow: '#fcd34d' }; // red-orange gradient (Tết colors)
  };

  const colors = getGradient();

  return (
    <div className="relative inline-flex items-center justify-center flex-shrink-0">
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${colors.glow}20 0%, transparent 70%)`,
          filter: 'blur(8px)'
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Decorative outer ring */}
      <svg width={size} height={size} className="absolute transform -rotate-90">
        <defs>
          <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.from} />
            <stop offset="100%" stopColor={colors.to} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Background circle with pattern */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 10}
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          className="text-gray-200 dark:text-gray-700"
          opacity="0.3"
        />
        
        {/* Progress circle with gradient */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 10}
          stroke="url(#timerGradient)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          filter="url(#glow)"
          initial={{ strokeDashoffset: 0 }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: "linear" }}
        />
      </svg>

      {/* Center decoration - Lantern style */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {/* Background circle */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `linear-gradient(135deg, ${colors.from}15, ${colors.to}15)`,
              boxShadow: `0 0 20px ${colors.glow}40`
            }}
            animate={{
              boxShadow: [
                `0 0 20px ${colors.glow}40`,
                `0 0 30px ${colors.glow}60`,
                `0 0 20px ${colors.glow}40`
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity
            }}
          />
          
          {/* Time text */}
          <motion.div
            className="relative z-10 flex flex-col items-center justify-center"
            style={{ width: size * 0.6, height: size * 0.6 }}
            animate={isWarning ? {
              scale: [1, 1.08, 1],
            } : {}}
            transition={{
              duration: 0.5,
              repeat: isWarning ? Infinity : 0
            }}
          >
            <span 
              className="font-bold leading-none"
              style={{
                fontSize: timeLeft < 10 ? '1.75rem' : '1.5rem',
                color: colors.from,
                background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textFillColor: 'transparent',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
              }}
            >
              {timeLeft}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">giây</span>
          </motion.div>
        </div>
      </div>

      {/* Warning sparkles */}
      {isWarning && (
        <>
          {[...Array(4)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: colors.to,
                top: '50%',
                left: '50%',
                boxShadow: `0 0 10px ${colors.glow}`
              }}
              animate={{
                x: [0, Math.cos(i * Math.PI / 2) * size * 0.6],
                y: [0, Math.sin(i * Math.PI / 2) * size * 0.6],
                scale: [1, 0],
                opacity: [1, 0]
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </>
      )}
    </div>
  );
}
