// Sound effects and background music for multiplayer
class SoundManager {
  constructor() {
    this.sounds = {};
    this.bgMusic = null;
    this.bgMusicAudio = null;
    this.isMuted = localStorage.getItem('soundMuted') === 'true';
  }

  // Initialize sounds
  init() {
    // Background music from file
    this.bgMusicAudio = new Audio('/BG_MultiPlay.mp3');
    this.bgMusicAudio.loop = true;
    this.bgMusicAudio.volume = 0.3;
    
    // Sound effects using Audio API with data URIs (simple beeps)
    this.sounds = {
      join: this.createBeep(800, 0.1, 'sine'),
      leave: this.createBeep(400, 0.1, 'sine'),
      start: this.createBeep(1000, 0.2, 'square'),
      correct: this.createBeep(1200, 0.15, 'sine'),
      wrong: this.createBeep(300, 0.2, 'sawtooth'),
      tick: this.createBeep(600, 0.05, 'sine'),
      finish: this.createBeep(1500, 0.3, 'triangle'),
    };
  }

  // Create simple beep sound
  createBeep(frequency, duration, type = 'sine') {
    return () => {
      if (this.isMuted) return;
      
      try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
      } catch (error) {
        // Silently fail if audio context not available
        console.error('Audio error:', error);
      }
    };
  }



  // Play sound effect
  play(soundName) {
    if (this.sounds[soundName]) {
      this.sounds[soundName]();
    }
  }

  // Start background music
  startBackgroundMusic() {
    if (this.bgMusicAudio && !this.isMuted) {
      this.bgMusicAudio.play().catch(err => {
        console.log('Background music autoplay prevented:', err);
      });
    }
  }

  // Stop background music
  stopBackgroundMusic() {
    if (this.bgMusicAudio) {
      this.bgMusicAudio.pause();
      this.bgMusicAudio.currentTime = 0;
    }
  }

  // Legacy aliases
  startMusic() {
    this.startBackgroundMusic();
  }

  stopMusic() {
    this.stopBackgroundMusic();
  }

  // Toggle mute
  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem('soundMuted', this.isMuted);
    
    if (this.isMuted) {
      this.stopBackgroundMusic();
    } else {
      this.startBackgroundMusic();
    }
    
    return this.isMuted;
  }

  // Get mute status
  getMuted() {
    return this.isMuted;
  }
}

// Export singleton instance
export const soundManager = new SoundManager();
soundManager.init();

// Make it globally accessible for cleanup
if (typeof window !== 'undefined') {
  window.soundManager = soundManager;
}
