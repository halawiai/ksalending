'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, X, Smartphone, Zap, Shield, Globe } from 'lucide-react';

interface InstallPromptProps {
  onInstall: () => void;
  onDismiss: () => void;
}

export function InstallPrompt({ onInstall, onDismiss }: InstallPromptProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show prompt after 30 seconds if not already installed
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md border-emerald-200 bg-white shadow-2xl">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Download className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl text-emerald-900">Install KSA Lending App</CardTitle>
          <CardDescription className="text-emerald-700">
            Get the full native app experience on your device
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm text-emerald-700">
              <Zap className="w-5 h-5 text-emerald-600" />
              <span>Faster loading and better performance</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-emerald-700">
              <Globe className="w-5 h-5 text-emerald-600" />
              <span>Works offline for core features</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-emerald-700">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              <span>Push notifications for updates</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-emerald-700">
              <Shield className="w-5 h-5 text-emerald-600" />
              <span>Enhanced security and privacy</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              onClick={onInstall}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Install App
            </Button>
            <Button 
              variant="outline" 
              onClick={onDismiss}
              className="border-emerald-300 text-emerald-700"
            >
              Not Now
            </Button>
          </div>

          {/* Dismiss */}
          <div className="text-center">
            <button 
              onClick={onDismiss}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Don't show this again
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}