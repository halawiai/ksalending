'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Smartphone, 
  Fingerprint,
  RefreshCw,
  Clock,
  User,
  Calendar,
  MapPin
} from 'lucide-react';
import { toast } from 'sonner';

export interface NafathVerificationData {
  nationalId: string;
  fullNameArabic: string;
  fullNameEnglish: string;
  dateOfBirth: string;
  nationality: string;
  gender: 'male' | 'female';
  placeOfBirth: string;
  issueDate: string;
  expiryDate: string;
  verified: boolean;
  verificationTimestamp: string;
}

export interface NafathAuthProps {
  onVerificationComplete: (data: NafathVerificationData) => void;
  onVerificationError: (error: string) => void;
  entityType?: 'individual' | 'company' | 'institution';
  initialNationalId?: string;
  className?: string;
}

type VerificationStep = 'input' | 'otp' | 'biometric' | 'processing' | 'success' | 'error';

export function NafathAuth({ 
  onVerificationComplete, 
  onVerificationError, 
  entityType = 'individual',
  initialNationalId = '',
  className = '' 
}: NafathAuthProps) {
  const [currentStep, setCurrentStep] = useState<VerificationStep>('input');
  const [nationalId, setNationalId] = useState(initialNationalId);
  const [otpCode, setOtpCode] = useState('');
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [sessionId, setSessionId] = useState('');
  const [verificationData, setVerificationData] = useState<NafathVerificationData | null>(null);

  const maxRetries = 3;
  const otpLength = 6;

  // Validate National ID format
  const validateNationalId = (id: string): boolean => {
    const nationalIdRegex = /^[12][0-9]{9}$/;
    return nationalIdRegex.test(id);
  };

  // Mock API call to initiate Nafath verification
  const initiateNafathVerification = async (id: string): Promise<{ sessionId: string; success: boolean }> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!validateNationalId(id)) {
          reject(new Error('Invalid National ID format'));
          return;
        }
        
        // Simulate some IDs that fail verification
        if (id === '1234567890') {
          reject(new Error('National ID not found in government database'));
          return;
        }

        const mockSessionId = `nafath_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        resolve({ sessionId: mockSessionId, success: true });
      }, 2000);
    });
  };

  // Mock OTP verification
  const verifyOTP = async (sessionId: string, otp: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Mock OTP: 123456 always works, others fail
        if (otp === '123456') {
          resolve(true);
        } else {
          reject(new Error('Invalid OTP code'));
        }
      }, 1500);
    });
  };

  // Mock biometric verification
  const verifyBiometric = async (sessionId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // 90% success rate for biometric
        const success = Math.random() > 0.1;
        resolve(success);
      }, 3000);
    });
  };

  // Mock final verification data retrieval
  const getVerificationData = async (sessionId: string): Promise<NafathVerificationData> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockData: NafathVerificationData = {
          nationalId: nationalId,
          fullNameArabic: 'أحمد محمد العبدالله',
          fullNameEnglish: 'Ahmed Mohammed Al-Abdullah',
          dateOfBirth: '1990-05-15',
          nationality: 'Saudi Arabian',
          gender: 'male',
          placeOfBirth: 'Riyadh',
          issueDate: '2020-01-01',
          expiryDate: '2030-01-01',
          verified: true,
          verificationTimestamp: new Date().toISOString()
        };
        resolve(mockData);
      }, 1000);
    });
  };

  // Handle National ID submission
  const handleNationalIdSubmit = async () => {
    if (!validateNationalId(nationalId)) {
      setError('Please enter a valid National ID (10 digits starting with 1 or 2)');
      return;
    }

    setIsLoading(true);
    setError('');
    setProgress(20);

    try {
      const result = await initiateNafathVerification(nationalId);
      setSessionId(result.sessionId);
      setCurrentStep('otp');
      setProgress(40);
      toast.success('Verification initiated. Please check your Nafath app.');
    } catch (err: any) {
      setError(err.message);
      setCurrentStep('error');
      onVerificationError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle OTP verification
  const handleOTPVerification = async () => {
    if (otpCode.length !== otpLength) {
      setError(`Please enter the complete ${otpLength}-digit code`);
      return;
    }

    setIsLoading(true);
    setError('');
    setProgress(60);

    try {
      await verifyOTP(sessionId, otpCode);
      setCurrentStep('biometric');
      setProgress(80);
      toast.success('OTP verified successfully');
    } catch (err: any) {
      setError(err.message);
      setRetryCount(prev => prev + 1);
      
      if (retryCount >= maxRetries - 1) {
        setCurrentStep('error');
        onVerificationError('Maximum retry attempts exceeded');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle biometric verification
  const handleBiometricVerification = async () => {
    setIsLoading(true);
    setError('');
    setCurrentStep('processing');
    setProgress(90);

    try {
      const biometricSuccess = await verifyBiometric(sessionId);
      
      if (biometricSuccess) {
        const data = await getVerificationData(sessionId);
        setVerificationData(data);
        setCurrentStep('success');
        setProgress(100);
        onVerificationComplete(data);
        toast.success('Identity verified successfully!');
      } else {
        throw new Error('Biometric verification failed');
      }
    } catch (err: any) {
      setError(err.message);
      setCurrentStep('error');
      onVerificationError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Skip biometric and proceed with OTP only
  const skipBiometric = async () => {
    setIsLoading(true);
    setCurrentStep('processing');
    setProgress(90);

    try {
      const data = await getVerificationData(sessionId);
      setVerificationData(data);
      setCurrentStep('success');
      setProgress(100);
      onVerificationComplete(data);
      toast.success('Identity verified successfully!');
    } catch (err: any) {
      setError(err.message);
      setCurrentStep('error');
      onVerificationError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Retry verification
  const handleRetry = () => {
    setCurrentStep('input');
    setProgress(0);
    setError('');
    setRetryCount(0);
    setOtpCode('');
    setSessionId('');
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 'input':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                Nafath Identity Verification
              </h3>
              <p className="text-green-600 text-sm">
                Verify your identity using the official Saudi government system
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nationalId" className="text-green-800">
                  National ID / Iqama Number
                </Label>
                <Input
                  id="nationalId"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value)}
                  placeholder="1234567890"
                  maxLength={10}
                  className="text-center text-lg font-mono border-green-300 focus:border-green-500"
                  dir="ltr"
                />
                <p className="text-xs text-green-600">
                  Enter your 10-digit National ID or Iqama number
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <Button 
                onClick={handleNationalIdSubmit}
                disabled={isLoading || !nationalId}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Initiating Verification...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Start Nafath Verification
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 'otp':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                Enter Verification Code
              </h3>
              <p className="text-green-600 text-sm">
                Check your Nafath app for the 6-digit verification code
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otpCode" className="text-green-800">
                  Verification Code
                </Label>
                <Input
                  id="otpCode"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, otpLength))}
                  placeholder="123456"
                  maxLength={otpLength}
                  className="text-center text-2xl font-mono tracking-widest border-green-300 focus:border-green-500"
                  dir="ltr"
                />
                <p className="text-xs text-green-600">
                  Enter the 6-digit code from your Nafath app
                </p>
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              {retryCount > 0 && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-amber-700">
                    Attempt {retryCount + 1} of {maxRetries}
                  </span>
                </div>
              )}

              <Button 
                onClick={handleOTPVerification}
                disabled={isLoading || otpCode.length !== otpLength}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Verifying Code...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verify Code
                  </>
                )}
              </Button>
            </div>
          </div>
        );

      case 'biometric':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Fingerprint className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                Biometric Verification
              </h3>
              <p className="text-green-600 text-sm">
                Complete verification using your biometric data
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 text-center">
                  Use your fingerprint or face recognition to complete the verification process
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Button 
                  onClick={handleBiometricVerification}
                  disabled={isLoading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Processing Biometric...
                    </>
                  ) : (
                    <>
                      <Fingerprint className="w-4 h-4 mr-2" />
                      Verify with Biometric
                    </>
                  )}
                </Button>

                <Button 
                  onClick={skipBiometric}
                  variant="outline"
                  disabled={isLoading}
                  className="w-full border-green-300 text-green-700 hover:bg-green-50"
                >
                  Skip Biometric Verification
                </Button>
              </div>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <RefreshCw className="w-8 h-8 text-white animate-spin" />
              </div>
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                Processing Verification
              </h3>
              <p className="text-green-600 text-sm">
                Please wait while we verify your identity with government systems
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-green-700">
                  <span>Verification Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>

              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 text-center">
                  Connecting to Saudi government databases...
                </p>
              </div>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-green-800 mb-2">
                Verification Successful
              </h3>
              <p className="text-green-600 text-sm">
                Your identity has been successfully verified
              </p>
            </div>

            {verificationData && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">Name (Arabic):</span>
                    <span className="text-sm text-green-700" dir="rtl">{verificationData.fullNameArabic}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">Name (English):</span>
                    <span className="text-sm text-green-700">{verificationData.fullNameEnglish}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">Date of Birth:</span>
                    <span className="text-sm text-green-700">{verificationData.dateOfBirth}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">Nationality:</span>
                    <span className="text-sm text-green-700">{verificationData.nationality}</span>
                  </div>
                </div>

                <Badge className="w-full justify-center bg-green-100 text-green-800 border-green-300 py-2">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Government Verified
                </Badge>
              </div>
            )}
          </div>
        );

      case 'error':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-red-800 mb-2">
                Verification Failed
              </h3>
              <p className="text-red-600 text-sm">
                We couldn't verify your identity at this time
              </p>
            </div>

            <div className="space-y-4">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700 text-center">{error}</p>
                </div>
              )}

              <Button 
                onClick={handleRetry}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className={`border-green-200 ${className}`}>
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-green-800">Nafath Identity Verification</CardTitle>
        <CardDescription className="text-green-600">
          Secure government identity verification system
        </CardDescription>
      </CardHeader>
      <CardContent>
        {progress > 0 && currentStep !== 'success' && currentStep !== 'error' && (
          <div className="mb-6">
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        {renderStepContent()}
      </CardContent>
    </Card>
  );
}

export default NafathAuth;