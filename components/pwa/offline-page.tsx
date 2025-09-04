'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WifiOff, RefreshCw, Home, FileText, User } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false);
  const [cachedData, setCachedData] = useState<any>(null);

  useEffect(() => {
    // Load cached assessment data from IndexedDB
    loadCachedData();
  }, []);

  const loadCachedData = async () => {
    try {
      if ('indexedDB' in window) {
        const db = await openIndexedDB();
        const transaction = db.transaction(['cachedAssessments'], 'readonly');
        const store = transaction.objectStore('cachedAssessments');
        const request = store.getAll();
        
        request.onsuccess = () => {
          setCachedData(request.result);
        };
      }
    } catch (error) {
      console.error('Failed to load cached data:', error);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        window.location.reload();
      }
    } catch (error) {
      console.log('Still offline');
    } finally {
      setIsRetrying(false);
    }
  };

  const openIndexedDB = () => {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('KSALendingDB', 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-green-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Offline Status */}
        <Card className="text-center border-orange-200">
          <CardHeader>
            <div className="w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <WifiOff className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle className="text-2xl text-orange-900">You're Offline</CardTitle>
            <CardDescription className="text-orange-700">
              No internet connection detected. Some features are still available.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full bg-orange-600 hover:bg-orange-700"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Checking Connection...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Available Offline Features */}
        <Card>
          <CardHeader>
            <CardTitle className="text-emerald-900">Available Offline</CardTitle>
            <CardDescription className="text-emerald-700">
              You can still access these features while offline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/">
                <Home className="w-4 h-4 mr-3" />
                Home Page
              </Link>
            </Button>
            
            {cachedData && cachedData.length > 0 && (
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/individual">
                  <User className="w-4 h-4 mr-3" />
                  Cached Profile Data
                </Link>
              </Button>
            )}
            
            <Button asChild variant="outline" className="w-full justify-start">
              <Link href="/onboarding/individual">
                <FileText className="w-4 h-4 mr-3" />
                Start Application (Offline)
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Cached Data Preview */}
        {cachedData && cachedData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-emerald-900">Cached Assessments</CardTitle>
              <CardDescription className="text-emerald-700">
                Your recent assessment data is available offline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {cachedData.slice(0, 3).map((assessment: any, index: number) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-emerald-50 rounded">
                    <span className="text-sm font-medium">Score: {assessment.score}</span>
                    <span className="text-xs text-emerald-600">{assessment.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="font-semibold text-blue-900 mb-2">Offline Tips</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p>• Your form data is saved automatically</p>
                <p>• Changes will sync when you're back online</p>
                <p>• Critical features work without internet</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}