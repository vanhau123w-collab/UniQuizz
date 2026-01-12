import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CharacterAvatar from './CharacterAvatar';
import characterManifest from '../assets/characterManifest.json';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faDice, faSave, faUser, faTshirt, faShoePrints, faSmile, faHatCowboy, faBoxOpen } from '@fortawesome/free-solid-svg-icons';

const TABS = [
  { id: 'bundle', icon: faBoxOpen, label: 'Set đồ' },
  { id: 'hat', icon: faHatCowboy, label: 'Mũ' },
  { id: 'shirts', icon: faTshirt, label: 'Áo' },
  { id: 'pants', icon: 'P', label: 'Quần' },
  { id: 'shoes', icon: faShoePrints, label: 'Giày' },
];

const CharacterCustomizerModal = ({ isOpen, onClose, initialConfig, onSave }) => {
  const [config, setConfig] = useState(initialConfig || {
    skin: 0, face: 0, hat: -1, shirts: 0, pants: -1, shoes: -1, bundle: -1
  });
  const [activeTab, setActiveTab] = useState('shirts');

  // Load default if needed
  useEffect(() => {
    // Ensure 'aohub' is active shirt if nothing else, handled by Avatar render but keeping state consistent is good.
    // But we allow state to be anything.
  }, []);

  if (!isOpen) return null;

  const handleSelectItem = (index) => {
    if (activeTab === 'bundle') {
      // Select bundle, clear clothes
      setConfig(prev => ({
        ...prev,
        bundle: index,
        shirts: -1,
        pants: -1,
        shoes: -1
      }));
    } else if (['shirts', 'pants', 'shoes'].includes(activeTab)) {
      // Select clothes, clear bundle
      setConfig(prev => ({
        ...prev,
        [activeTab]: index,
        bundle: -1
      }));
    } else {
      // Others (Skin, Face, Hat)
      setConfig(prev => ({ ...prev, [activeTab]: index }));
    }
  };

  const handleRandomize = () => {
    // Logic: Randomize everything. 
    // 20% chance for Bundle?
    const useBundle = Math.random() < 0.2;
    const newConfig = {
      skin: 0, // Fixed
      face: 0, // Fixed
      hat: Math.random() < 0.5 ? -1 : Math.floor(Math.random() * (characterManifest.hat?.length || 1)),
    };

    if (useBundle && characterManifest.bundle?.length > 0) {
      newConfig.bundle = Math.floor(Math.random() * characterManifest.bundle.length);
      newConfig.shirts = -1;
      newConfig.pants = -1;
      newConfig.shoes = -1;
    } else {
      newConfig.bundle = -1;
      newConfig.shirts = Math.floor(Math.random() * (characterManifest.shirts?.length || 1));
      newConfig.pants = Math.random() < 0.3 ? -1 : Math.floor(Math.random() * (characterManifest.pants?.length || 1));
      newConfig.shoes = Math.random() < 0.3 ? -1 : Math.floor(Math.random() * (characterManifest.shoes?.length || 1));
    }
    setConfig(newConfig);
  };

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  const items = characterManifest[activeTab] || [];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-0 md:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-[#1a1a1a] md:rounded-3xl shadow-2xl w-full md:max-w-4xl overflow-hidden flex flex-col md:flex-row h-full md:h-[550px] border-none md:border border-gray-700"
      >
        {/* RIGHT PANEL (Preview) - Mobile: Top (Order 1) | Desktop: Right (Order 2) */}
        <div className="order-1 md:order-2 w-full md:w-[400px] bg-gradient-to-b from-gray-900 to-black relative flex flex-col items-center justify-center p-4 md:p-8 shrink-0 border-b md:border-b-0 md:border-l border-gray-700">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-20"
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>

          {/* Spotlight Effect */}
          <div className="absolute top-0 inset-x-0 h-32 md:h-64 bg-gradient-to-b from-purple-500/20 to-transparent blur-3xl pointer-events-none"></div>

          {/* BACKGROUND PODIUM */}
          <div className="absolute top-[60%] md:top-[50%] left-1/2 -translate-x-1/2 w-[160px] md:w-[200px] pointer-events-none opacity-90 z-10">
            <img src="/backgrounds/bgBuc.png" alt="Podium" className="w-full h-auto object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]" />
          </div>

          {/* VOLUMETRIC LIGHT BEAM */}
          <div
            className="absolute left-1/2 -translate-x-1/2 pointer-events-none z-0"
            style={{
              top: 'auto',
              bottom: '36%', // Align perfectly with podium top
              width: '236px',
              height: '400px',
              background: 'linear-gradient(to top, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 100%)',
              clipPath: 'polygon(30% 100%, 70% 100%, 100% 0, 0 0)', // Narrower base to fit INSIDE podium
              filter: 'blur(8px)',
            }}
          ></div>

          {/* Custom Float Animation */}
          <style>{`
            @keyframes float {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-15px); }
            }
            .animate-float {
              animation: float 3s ease-in-out infinite;
            }
          `}</style>

          {/* AVATAR DISPLAY - FLOATING ANIMATION */}
          <div className="relative z-20 mb-4 md:mb-8 mt-4 md:mt-0 animate-float">
            {/* 
              Scale Width Fixed Logic:
              Mobile (<768): 180px
              Tablet (<1024): 220px
              PC (>1024): 240px
            */}
            <CharacterAvatar
              config={config}
              size={
                window.innerWidth < 768 ? 180 :
                  window.innerWidth < 1024 ? 220 : 240
              }
            />
          </div>

          <div className="flex gap-3 w-full px-4 md:px-8 mt-auto md:mt-16 mb-4 md:mb-0">
            <button
              onClick={handleRandomize}
              className="px-4 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors"
              title="Ngẫu nhiên"
            >
              <FontAwesomeIcon icon={faDice} size="lg" />
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 shadow-lg shadow-purple-500/30 transition-all flex items-center justify-center gap-2 text-sm md:text-base z-99"
            >
              <FontAwesomeIcon icon={faSave} /> <span className="hidden md:inline">Lưu Qbit của tôi</span><span className="md:hidden">Lưu</span>
            </button>
          </div>

          <p className="mt-2 text-xs text-gray-500 text-center hidden md:block">
            Qbit sẽ đại diện cho bạn trong phòng chơi.
          </p>
        </div>

        {/* LEFT PANEL (Controls) - Mobile: Bottom (Order 2) | Desktop: Left (Order 1) */}
        <div className="order-2 md:order-1 flex-1 flex flex-col bg-[#222] min-h-0">
          {/* Tabs */}
          <div className="flex p-2 gap-2 bg-[#2a2a2a] overflow-x-auto scrollbar-hide shrink-0">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-3 rounded-xl flex items-center justify-center min-w-[50px] flex-1 md:flex-none transition-all
                  ${activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                title={tab.label}
              >
                {typeof tab.icon === 'string' ? <span className="font-bold text-lg">{tab.icon}</span> : <FontAwesomeIcon icon={tab.icon} className="text-lg" />}
                <span className="ml-2 text-xs font-medium md:hidden">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Grid Selection */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 gap-4 content-start auto-rows-min pb-20 md:pb-8">
            {/* None Option */}
            {(activeTab === 'hat' || activeTab === 'pants' || activeTab === 'shoes' || activeTab === 'bundle') && (
              <button
                onClick={() => handleSelectItem(-1)}
                className={`aspect-square rounded-xl flex items-center justify-center border-2 border-dashed border-gray-600 text-gray-500 hover:border-gray-400 hover:text-white p-2
                    ${config[activeTab] === -1 ? 'bg-gray-700 border-solid border-purple-500 text-purple-400' : ''}`}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            )}

            {items.map((item, index) => (
              <button
                key={index}
                onClick={() => handleSelectItem(index)}
                className={`aspect-square rounded-xl flex items-center justify-center relative overflow-hidden group transition-all p-2
                    ${config[activeTab] === index
                    ? 'bg-purple-900/50 border-2 border-purple-500'
                    : 'bg-gray-800 border border-gray-700 hover:border-gray-500'}`}
              >
                <img
                  src={activeTab === 'skin' ? item.parts.head : item.path}
                  alt={item.id}
                  className="w-full h-full object-contain drop-shadow-md"
                />
              </button>
            ))}
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default CharacterCustomizerModal;
