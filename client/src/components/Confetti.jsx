import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function Confetti({ trigger = false }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (trigger) {
      // Generate 50 confetti particles
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * window.innerWidth,
        y: -20,
        rotation: Math.random() * 360,
        color: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'][Math.floor(Math.random() * 6)],
        size: Math.random() * 10 + 5,
        delay: Math.random() * 0.3
      }));
      setParticles(newParticles);

      // Clear after animation
      setTimeout(() => setParticles([]), 3000);
    }
  }, [trigger]);

  if (particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute"
          style={{
            left: particle.x,
            top: particle.y,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '0%',
          }}
          initial={{
            y: -20,
            x: particle.x,
            rotate: 0,
            opacity: 1
          }}
          animate={{
            y: window.innerHeight + 100,
            x: particle.x + (Math.random() - 0.5) * 200,
            rotate: particle.rotation + 720,
            opacity: [1, 1, 0]
          }}
          transition={{
            duration: 2 + Math.random(),
            delay: particle.delay,
            ease: "easeOut"
          }}
        />
      ))}
    </div>
  );
}
