// PWA Utilities

// Register Service Worker
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker registered:', registration.scope);

          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('🔄 New Service Worker found');

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('🆕 New content available, please refresh');
                // Show update notification
                showUpdateNotification();
              }
            });
          });
        })
        .catch((error) => {
          console.error('❌ Service Worker registration failed:', error);
        });
    });
  }
};

// Show update notification
const showUpdateNotification = () => {
  if (Notification.permission === 'granted') {
    new Notification('UniQuizz có bản cập nhật mới!', {
      body: 'Click để tải lại trang',
      icon: '/logo.png',
      badge: '/favicon.png',
    });
  }
};

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('❌ Browser không hỗ trợ notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Send notification
export const sendNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/logo.png',
      badge: '/favicon.png',
      ...options,
    });
  }
};

// Check if app is installed
export const isAppInstalled = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.navigator.standalone === true;
};

// Check if device is mobile
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

// Get install prompt
export const getInstallPrompt = () => {
  return new Promise((resolve) => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      resolve(e);
    });
  });
};

// Share API
export const canShare = () => {
  return navigator.share !== undefined;
};

export const shareContent = async (data) => {
  if (canShare()) {
    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      console.error('Share failed:', error);
      return false;
    }
  }
  return false;
};
