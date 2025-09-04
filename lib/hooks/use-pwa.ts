'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export interface PWAState {
  isInstalled: boolean;
  isInstallable: boolean;
  isOnline: boolean;
  hasUpdate: boolean;
  installPrompt: any;
}

export interface PWAActions {
  install: () => Promise<void>;
  dismissInstall: () => void;
  checkForUpdates: () => Promise<void>;
  enableNotifications: () => Promise<boolean>;
  shareContent: (data: ShareData) => Promise<void>;
}

export function usePWA(): PWAState & PWAActions {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if app is installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setIsInstallable(true);
    };

    // Handle app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
      toast.success('KSA Lending app installed successfully!');
    };

    // Handle online/offline
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are now offline');
    };

    // Check service worker updates
    const checkForUpdates = () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setHasUpdate(true);
                  toast.info('App update available!', {
                    action: {
                      label: 'Refresh',
                      onClick: () => window.location.reload(),
                    },
                  });
                }
              });
            }
          });
        });
      }
    };

    // Initialize
    checkInstalled();
    setIsOnline(navigator.onLine);
    checkForUpdates();

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const install = async (): Promise<void> => {
    if (!installPrompt) {
      throw new Error('Install prompt not available');
    }

    try {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstallable(false);
        setInstallPrompt(null);
      }
    } catch (error) {
      console.error('Install error:', error);
      throw error;
    }
  };

  const dismissInstall = (): void => {
    setIsInstallable(false);
    setInstallPrompt(null);
  };

  const checkForUpdatesManual = async (): Promise<void> => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.update();
        toast.success('Checked for updates');
      } catch (error) {
        console.error('Update check error:', error);
        toast.error('Failed to check for updates');
      }
    }
  };

  const enableNotifications = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast.error('Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        // Subscribe to push notifications
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          
          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: process.env.NEXT_PUBLIC_VAPID_KEY,
          });

          // Send subscription to server
          await fetch('/api/v1/notifications/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription),
          });

          toast.success('Notifications enabled');
          return true;
        }
      } else {
        toast.error('Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Notification setup error:', error);
      toast.error('Failed to enable notifications');
      return false;
    }

    return false;
  };

  const shareContent = async (data: ShareData): Promise<void> => {
    if (navigator.share) {
      try {
        await navigator.share(data);
      } catch (error) {
        console.error('Share error:', error);
        // Fallback to clipboard
        if (data.url) {
          await navigator.clipboard.writeText(data.url);
          toast.success('Link copied to clipboard');
        }
      }
    } else {
      // Fallback for browsers without Web Share API
      if (data.url) {
        await navigator.clipboard.writeText(data.url);
        toast.success('Link copied to clipboard');
      }
    }
  };

  return {
    // State
    isInstalled,
    isInstallable,
    isOnline,
    hasUpdate,
    installPrompt,
    
    // Actions
    install,
    dismissInstall,
    checkForUpdates: checkForUpdatesManual,
    enableNotifications,
    shareContent,
  };
}