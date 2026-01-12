import React from 'react';
import { motion } from 'framer-motion';

const ParticipantAvatar = ({ name, isSelf, index, className }) => {
  // Safe name check
  const displayName = name || 'User';
  
  // Generate random variation based on name
  const hash = displayName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
  const shirtColor = colors[hash % colors.length];
  
  return (
    <motion.div
      initial={{ scale: 0, y: 50 }}
      animate={{ scale: 1, y: 0 }}
      transition={{ 
        type: "spring",
        stiffness: 260,
        damping: 20,
        delay: index * 0.1 
      }}
      className="flex flex-col items-center group relative cursor-pointer hover:z-50"
      whileHover={{ scale: 1.1, y: -10 }}
    >
      {/* Name Tag */}
      <div className={`mb-2 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-lg transition-all
        ${isSelf 
          ? 'bg-yellow-400 text-red-900 border-2 border-yellow-200' 
          : 'bg-black/50 text-white backdrop-blur-sm group-hover:bg-white group-hover:text-black'
        }`}>
        {name} {isSelf && '(Bạn)'}
      </div>

      {/* Avatar Character */}
      <div className="relative w-24 h-32">
        <svg viewBox="0 0 100 130" className="w-full h-full drop-shadow-xl">
          {/* Shadow */}
          <ellipse cx="50" cy="125" rx="30" ry="5" fill="black" opacity="0.3" />

          {/* Body Group - Bobbing Animation */}
          <motion.g
            animate={{ y: [0, -3, 0] }}
            transition={{ 
              duration: 2 + (hash % 10) / 10, 
              repeat: Infinity, 
              ease: "easeInOut",
              delay: (hash % 10) / 5
            }}
          >
            {/* Legs */}
            <path d="M35,100 L35,120 M65,100 L65,120" stroke="#333" strokeWidth="6" strokeLinecap="round" />
            
            {/* Body */}
            <rect x="25" y="60" width="50" height="45" rx="10" fill={shirtColor} />
            {/* Shirt Detail */}
            <circle cx="50" cy="80" r="12" fill="white" opacity="0.2" />
            <path d="M25,60 Q50,90 75,60" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="2" />

            {/* Arms - Wave on Hover */}
            <motion.path 
              d="M25,65 Q10,80 25,95" 
              fill="none" 
              stroke={shirtColor} 
              strokeWidth="8" 
              strokeLinecap="round"
            />
             <motion.path 
              d="M75,65 Q90,80 75,95" 
              fill="none" 
              stroke={shirtColor} 
              strokeWidth="8" 
              strokeLinecap="round"
              whileHover={{ d: "M75,65 Q100,40 110,20" }} // Wave arm up
            />

            {/* Head */}
            <circle cx="50" cy="35" r="28" fill="#ffdbac" /> {/* Skin */}
            
            {/* Hair - Simple */}
            <path d="M20,30 Q50,-10 80,30" fill="#333" stroke="#333" strokeWidth="3" />
            
            {/* Face */}
            <circle cx="40" cy="35" r="3" fill="#333" /> {/* Left Eye */}
            <circle cx="60" cy="35" r="3" fill="#333" /> {/* Right Eye */}
            <path d="M45,45 Q50,48 55,45" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" /> {/* Smile */}
            
            {/* Cheeks */}
            <circle cx="35" cy="40" r="3" fill="#ffaaaa" opacity="0.6" />
            <circle cx="65" cy="40" r="3" fill="#ffaaaa" opacity="0.6" />
          </motion.g>
        </svg>

        {/* Edit Icon (Shows on hover for self) */}
        {isSelf && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5 }}
            whileHover={{ opacity: 1, scale: 1 }}
            className="absolute top-0 right-0 bg-white text-gray-800 p-1.5 rounded-full shadow-lg cursor-pointer hover:bg-yellow-400"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default ParticipantAvatar;
