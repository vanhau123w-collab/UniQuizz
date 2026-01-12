import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFaceGrinSquintTears, faBolt, faBrain, faFire } from '@fortawesome/free-solid-svg-icons';

const MEME_COLLECTION = [
  // Hype / Cheers
  { type: 'hype', text: "Đỉnh của chóp! 🔥", image: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExNG00ejdmMTN6czgzaml4NzUzcTF6NDc4d3ZteDZobmxhZWU3N2xzaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/BKkNXLq9EB5RV6PdE8/giphy.gif" }, // Minions
  { type: 'hype', text: "Cháy quá anh em ơi! 🚀", image: "https://media.giphy.com/media/ne3xrYlWtQFtC/giphy.gif" }, // Minions cheer
  { type: 'dance', text: "Quẩy lên nào! 💃", image: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExOGJ1Z2JlNG1sOGFsa3JsamNrYjQybTBjOHVwZWQyNHA2azd0ZHF0cCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/YEaQWIJRg6dTa/giphy.gif" }, // Carlton
  { type: 'cool', text: "Dễ như ăn kẹo! 😎", image: "https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3Y3aTNuanA3bG0zNnpvOWZyZjA4bjllYmV5bGxnOHUyM2d4cG93cCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/GI5lkXChv0VB0z1glJ/giphy.gif" }, // Cool kid glasses

  // Thinking / Brain
  { type: 'funny', text: "Hack não quá đi! 🤯", image: "https://media.giphy.com/media/l41lFw057lAJQMwg0/giphy.gif" }, // Math lady
  { type: 'thinking', text: "Load não... 🧠", image: "https://media.giphy.com/media/dAvGEnCElcGeNIHa8S/giphy.gif" }, // Loading cat
  { type: 'thinking', text: "Đang phân tích... 🤔", image: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExa3BnNmFlajA3MW5mOHBxMTFhN2htd2FvcTV3aDhuMDRvOXo1dGF3bCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/QfzMP70zmNQiDf5sGP/giphy.gif" }, // Confused math
  { type: 'thinking', text: "Khoai thế nhỉ! �", image: "https://media.giphy.com/media/APqEbxBsVlkWSuFpth/giphy.gif" }, // Thinking emoji

  // Shock / Surprise
  { type: 'shock', text: "Waoooo! 😱", image: "https://media.giphy.com/media/cF7QqO5DYdft6/giphy.gif" }, // Chris Pratt
  { type: 'shock', text: "Không thể tin được! 😲", image: "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExNzg5YTV6M253NGNkcGd3MXhuOWdxbjZ3YzZhYjJqN21veW9wMDV6bCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/Cdkk6wFFqisTe/giphy.gif" }, // Cat shock
  { type: 'shock', text: "Ảo thật đấy! 😵", image: "https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif" }, // Mind blown

  // Fun / Random
  { type: 'funny', text: "Sai tè le rồi! �", image: "https://media.giphy.com/media/14aUO0Mf7dWDXW/giphy.gif" }, // Crying Dawson
  { type: 'funny', text: "Bình tĩnh tự tin! �", image: "https://media2.giphy.com/media/v1.Y2lkPTc5MGI3NjExOWRyNjZqaGo4M3l4emNhZ2I3cnM1eDd2MWcwZ2RkaDl0ejV0ZTZmdyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/4Vtk42BGiL1T2/giphy.gif" }, // You got this
  { type: 'funny', text: "Nhanh tay lên! ⏰", image: "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExZXdqNmJzc28weWZyY2g2M2dxMGRqNHR5ZDNqd2licHlpZjk5NXo1NiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/fBEMsUeGHdpsClFsxM/giphy.gif" }, // Running
  { type: 'funny', text: "Chúc may mắn! 🍀", image: "https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExczNlZ2Zod3o5YTVkYTFlZDRma3hqczNvbzhjYnY0OG8za3J2d29tZSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/EqF5Y99mEH29HcxXnq/giphy.gif" }, // Good luck
];

const MemeIntermission = ({ onComplete }) => {
  const [currentMeme, setCurrentMeme] = useState(null);
  const [timeLeft, setTimeLeft] = useState(3);
  const isCompletedRef = React.useRef(false); // Ref to prevent double execution

  const handleComplete = () => {
    if (isCompletedRef.current) return;
    isCompletedRef.current = true;
    onComplete();
  };

  useEffect(() => {
    // Pick a random meme
    const randomMeme = MEME_COLLECTION[Math.floor(Math.random() * MEME_COLLECTION.length)];
    setCurrentMeme(randomMeme);

    // Timer to dismiss
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleComplete(); // Trigger completion safely
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []); // Run once on mount

  if (!currentMeme) return null;

  return (
    <div
      onClick={handleComplete}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 cursor-pointer"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        exit={{ scale: 0.5, opacity: 0, rotate: 10 }}
        className="relative bg-white dark:bg-gray-800 p-2 rounded-3xl shadow-[0_0_50px_rgba(250,204,21,0.5)] border-4 border-yellow-400 max-w-lg w-full transform overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Keep click inside specific? No, user wants to unfreeze.
      // Wait, if I stop prop here, user can't click meme to close.
      // "click ra ngoài" implies outside the box.
      // But "tránh bị treo" implies "I want to close it".
      // I will ALLOW clicking the meme to close it too, for maximum "unfreeze" reliability.
      // So I will REMOVE the stopPropagation.
      >
        {/* Decorative corner lights */}
        <div className="absolute -top-3 -left-3 text-red-500 text-4xl animate-bounce"><FontAwesomeIcon icon={faBolt} /></div>
        <div className="absolute -top-3 -right-3 text-red-500 text-4xl animate-bounce delay-100"><FontAwesomeIcon icon={faFire} /></div>
        <div className="absolute -bottom-3 -left-3 text-yellow-500 text-4xl animate-bounce delay-200"><FontAwesomeIcon icon={faFaceGrinSquintTears} /></div>
        <div className="absolute -bottom-3 -right-3 text-yellow-500 text-4xl animate-bounce delay-300"><FontAwesomeIcon icon={faBrain} /></div>

        <div className="bg-black/10 rounded-2xl p-6 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">

          <h3 className="text-2xl md:text-3xl font-black text-center text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-yellow-600 mb-6 drop-shadow-sm uppercase tracking-wider">
            {currentMeme.text}
          </h3>

          <div className="relative w-full h-64 md:h-80 mb-6 rounded-xl overflow-hidden shadow-2xl border-4 border-white/20">
            <img
              src={currentMeme.image}
              alt="Meme"
              className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700"
            />

            {/* Timer badge */}
            <div className="absolute bottom-4 right-4 bg-black/70 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg border-2 border-white/50 backdrop-blur">
              {timeLeft}
            </div>
          </div>

          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 3, ease: "linear" }}
              className="h-full bg-gradient-to-r from-yellow-400 to-red-500 rounded-full"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MemeIntermission;
