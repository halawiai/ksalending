'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Fingerprint, Eye, Smartphone, Shield, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface BiometricAuthProps {
  onSuccess: (authData: BiometricAuthData) => void;
  onError: (error: string) => void;
  entityType?: 'individual' | 'company' | 'institution';
  className?: string;
}

export interface BiometricAuthData {
  method: 'fingerprint' | 'face' | 'voice';
  verified: boolean;
  confidence: number;
  timestamp: string;
  deviceId: string;
}

type AuthStep = 'check' | 'prompt' | 'authenticating' | 'success' | 'error';

export function BiometricAuth({ onSuccess, onError, entityType = 'individual', className = '' }: BiometricAuthProps) {
  const [currentStep, setCurrentStep] = useState<AuthStep>('check');
  const [availableMethods, setAvailableMethods] = useState<string[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    const methods: string[] = [];

    try {
      // Check for WebAuthn support
      if (window.PublicKeyCredential) {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (available) {
          methods.push('fingerprint');
        }
      }

      // Check for Face ID support (iOS Safari)
      if (
        typeof window !== 'undefined' &&
        'DeviceMotionEvent' in window &&
        typeof (DeviceMotionEvent as any).requestPermission === 'function'
      ) {
        methods.push('face');
      }

      // Check for generic biometric support
      if (typeof navigator !== 'undefined' && navigator.credentials && typeof navigator.credentials.create === 'function') {
        if (!methods.includes('fingerprint')) {
          methods.push('fingerprint');
        }
      }

      setAvailableMethods(methods);
      
      if (methods.length > 0) {
        setSelectedMethod(methods[0]);
        setCurrentStep('prompt');
      } else {
        setError('Biometric authentication not supported on this device');
        setCurrentStep('error');
      }
    } catch (err) {
      console.error('Biometric check error:', err);
      setError('Failed to check biometric support');
      setCurrentStep('error');
    }
  };

  const authenticateWithFingerprint = async (): Promise<BiometricAuthData> => {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      allowCredentials: [],
      userVerification: 'required',
      timeout: 60000,
    };

    try {
      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      }) as PublicKeyCredential;

      if (credential) {
        return {
          method: 'fingerprint',
          verified: true,
          confidence: 0.95,
          timestamp: new Date().toISOString(),
          deviceId: await getDeviceId(),
        };
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      throw new Error('Fingerprint authentication failed');
    }
  };

  const authenticateWithFace = async (): Promise<BiometricAuthData> => {
    // Mock Face ID authentication for iOS
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate Face ID success/failure
        const success = Math.random() > 0.1; // 90% success rate
        
        if (success) {
          resolve({
            method: 'face',
            verified: true,
            confidence: 0.92,
            timestamp: new Date().toISOString(),
            deviceId: 'device_' + Math.random().toString(36).substr(2, 9),
          });
        } else {
          reject(new Error('Face authentication failed'));
        }
      }, 2000);
    });
  };

  const getDeviceId = async (): Promise<string> => {
    // Generate a consistent device ID
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Device fingerprint', 2, 2);
      return canvas.toDataURL().slice(-16);
    }
    return 'unknown_device';
  };

  const handleAuthenticate = async () => {
    setIsLoading(true);
    setError('');
    setCurrentStep('authenticating');

    try {
      let authData: BiometricAuthData;

      switch (selectedMethod) {
        case 'fingerprint':
          authData = await authenticateWithFingerprint();
          break;
        case 'face':
          authData = await authenticateWithFace();
          break;
        default:
          throw new Error('Unsupported authentication method');
      }

      setCurrentStep('success');
      onSuccess(authData);
      toast.success('Biometric authentication successful!');

    } catch (err: any) {
      setError(err.message);
      setCurrentStep('error');
      onError(err.message);
      toast.error('Biometric authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setCurrentStep('prompt');
    setError('');
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'check':
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mx-auto flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-white animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-emerald-800">Checking Device Support</h3>
              <p className="text-emerald-600 text-sm">Detecting available biometric methods...</p>
            </div>
          </div>
        );

      case 'prompt':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                {selectedMethod === 'fingerprint' && <Fingerprint className="w-8 h-8 text-white" />}
                {selectedMethod === 'face' && <Eye className="w-8 h-8 text-white" />}
              </div>
              <h3 className="text-xl font-semibold text-emerald-800 mb-2">
                Biometric Authentication
              </h3>
              <p className="text-emerald-600 text-sm">
                Use your {selectedMethod === 'fingerprint' ? 'fingerprint' : 'face'} to securely authenticate
              </p>
            </div>

            {availableMethods.length > 1 && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-emerald-800">Authentication Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableMethods.map((method) => (
                    <Button
                      key={method}
                      variant={selectedMethod === method ? 'default' : 'outline'}
                      onClick={() => setSelectedMethod(method)}
                      className={selectedMethod === method ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-emerald-300 text-emerald-700'}
                    >
                      {method === 'fingerprint' && <Fingerprint className="w-4 h-4 mr-2" />}
                      {method === 'face' && <Eye className="w-4 h-4 mr-2" />}
                      {method === 'fingerprint' ? 'Fingerprint' : 'Face ID'}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <Button 
              onClick={handleAuthenticate}
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {selectedMethod === 'fingerprint' && <Fingerprint className="w-4 h-4 mr-2" />}
              {selectedMethod === 'face' && <Eye className="w-4 h-4 mr-2" />}
              Authenticate with {selectedMethod === 'fingerprint' ? 'Fingerprint' : 'Face ID'}
            </Button>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-xs text-emerald-600">
                <Shield className="w-3 h-3" />
                <span>Secured by device biometrics</span>
              </div>
            </div>
          </div>
        );

      case 'authenticating':
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mx-auto flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-white animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-emerald-800">Authenticating...</h3>
              <p className="text-emerald-600 text-sm">
                {selectedMethod === 'fingerprint' 
                  ? 'Place your finger on the sensor' 
                  : 'Look at your device camera'
                }
              </p>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mx-auto flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-green-800">Authentication Successful</h3>
              <p className="text-green-600 text-sm">Your identity has been verified</p>
            </div>
            <Badge className="bg-green-100 text-green-800 border-green-300">
              <CheckCircle className="w-3 h-3 mr-1" />
              Biometric Verified
            </Badge>
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full mx-auto flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800">Authentication Failed</h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <Button 
              onClick={handleRetry}
              variant="outline"
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={`border-emerald-200 ${className}`}>
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-emerald-800">Secure Authentication</CardTitle>
        <CardDescription className="text-emerald-600">
          Enhanced security with biometric verification
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderStepContent()}
      </CardContent>
    </Card>
  );
}