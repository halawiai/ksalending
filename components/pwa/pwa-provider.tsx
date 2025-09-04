'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Download, Wifi, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

interface PWAProviderProps {
  children: React.ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Guard: only try SW on supported, secure environments
    const isBrowser = typeof window !== 'undefined';
    const isSecure = isBrowser && (window.isSecureContext || window.location.hostname === 'localhost');
    const isStackBlitz =
      isBrowser &&
      /stackblitz|webcontainer|credentialless-staticblitz/i.test(window.location.hostname);

    // ✅ Register service worker only when supported
    if ('serviceWorker' in navigator && isSecure && !isStackBlitz) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered:', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // toast is nice in real browsers; avoid noise in CI/dev
                  toast.info('App update available. Refresh to get the latest version.');
                }
              });
            }
          });
        })
        .catch((error) => {
          // COMMENT-ONLY NOTE:
          // StackBlitz/WebContainers don't support SWs. Keep log terse to avoid "Potential problem" popups.
          if (!isStackBlitz) {
            console.error('SW registration failed:', error);
          }
        });
    } else {
      // Keep a quiet trace for unsupported environments (e.g., StackBlitz)
      if (isStackBlitz) {
        console.log('SW skipped: StackBlitz/WebContainer does not support service workers.');
      } else if (!isSecure) {
        console.log('SW skipped: requires HTTPS or localhost.');
      }
    }

    // Handle install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show install prompt after 30 seconds if not installed
      setTimeout(() => {
        if (!isInstalled) {
          setShowInstallPrompt(true);
        }
      }, 30000);
    };

    // Handle app installed
    const handleAppInstalled = () => {
      console.log('PWA installed');
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      toast.success('KSA Lending app installed successfully!');
    };

    // Online/offline detection
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('You are now offline. Some features may be limited.');
    };

    // Check if already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Set initial online status
    setIsOnline(navigator.onLine);

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
  }, [isInstalled]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted install prompt');
    } else {
      console.log('User dismissed install prompt');
    }
    
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const dismissInstallPrompt = () => {
    setShowInstallPrompt(false);
    setDeferredPrompt(null);
  };

  return (
    <>
      {children}
      
      {/* Offline indicator */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-orange-500 text-white text-center py-2 z-50">
          <div className="flex items-center justify-center gap-2">
            <WifiOff className="w-4 h-4" />
            <span className="text-sm font-medium">You are offline</span>
          </div>
        </div>
      )}

      {/* Install prompt */}
      {showInstallPrompt && !isInstalled && (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
          <Card className="border-emerald-200 bg-white shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center">
                    <Download className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg text-emerald-900">Install KSA Lending</CardTitle>
                    <CardDescription className="text-emerald-600">
                      Get the full app experience
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={dismissInstallPrompt}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="text-sm text-emerald-700">
                  • Offline access to your credit information
                  • Faster loading and better performance
                  • Push notifications for updates
                  • Native app experience
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleInstallClick}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Install App
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={dismissInstallPrompt}
                    className="border-emerald-300 text-emerald-700"
                  >
                    Not Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Online status indicator */}
      {isOnline && (
        <div className="fixed top-4 right-4 z-40">
          <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
            <Wifi className="w-3 h-3" />
            Online
          </div>
        </div>
      )}
    </>
  );
}