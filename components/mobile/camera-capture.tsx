'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Camera, 
  RotateCcw, 
  Check, 
  X, 
  Upload, 
  FileImage, 
  Smartphone,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface CameraCaptureProps {
  onCapture: (imageData: CapturedImage) => void;
  onError: (error: string) => void;
  documentType?: 'national_id' | 'passport' | 'license' | 'commercial_reg';
  className?: string;
}

export interface CapturedImage {
  dataUrl: string;
  blob: Blob;
  metadata: {
    width: number;
    height: number;
    size: number;
    timestamp: string;
    documentType: string;
    quality: number;
  };
}

type CaptureStep = 'permission' | 'camera' | 'preview' | 'processing' | 'success' | 'error';

export function CameraCapture({ 
  onCapture, 
  onError, 
  documentType = 'national_id', 
  className = '' 
}: CameraCaptureProps) {
  const [currentStep, setCurrentStep] = useState<CaptureStep>('permission');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getDocumentTitle = () => {
    switch (documentType) {
      case 'national_id': return 'National ID';
      case 'passport': return 'Passport';
      case 'license': return 'License';
      case 'commercial_reg': return 'Commercial Registration';
      default: return 'Document';
    }
  };

  const getDocumentInstructions = () => {
    switch (documentType) {
      case 'national_id': 
        return 'Position your National ID or Iqama within the frame. Ensure all text is clearly visible.';
      case 'passport': 
        return 'Position your passport photo page within the frame. Ensure the photo and text are clear.';
      case 'license': 
        return 'Position your license within the frame. Make sure all details are visible.';
      case 'commercial_reg': 
        return 'Position your commercial registration document within the frame.';
      default: 
        return 'Position your document within the frame for capture.';
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        }
      });

      setStream(mediaStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }
      
      setCurrentStep('camera');
    } catch (err: any) {
      console.error('Camera access error:', err);
      setError('Camera access denied or not available');
      setCurrentStep('error');
      onError('Camera access denied');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    setCurrentStep('preview');
    
    // Stop camera
    stopCamera();
  }, [stream]);

  const retakePhoto = () => {
    setCapturedImage(null);
    setCurrentStep('permission');
    startCamera();
  };

  const confirmPhoto = async () => {
    if (!capturedImage || !canvasRef.current) return;

    setIsProcessing(true);
    setCurrentStep('processing');

    try {
      // Convert data URL to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      // Analyze image quality
      const quality = await analyzeImageQuality(capturedImage);
      
      if (quality < 0.6) {
        throw new Error('Image quality too low. Please retake the photo.');
      }

      const imageData: CapturedImage = {
        dataUrl: capturedImage,
        blob,
        metadata: {
          width: canvasRef.current.width,
          height: canvasRef.current.height,
          size: blob.size,
          timestamp: new Date().toISOString(),
          documentType,
          quality,
        },
      };

      setCurrentStep('success');
      onCapture(imageData);
      toast.success('Document captured successfully!');

    } catch (err: any) {
      setError(err.message);
      setCurrentStep('error');
      onError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const analyzeImageQuality = async (dataUrl: string): Promise<number> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Simple quality analysis based on image properties
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          resolve(0.5);
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Calculate brightness and contrast
        let brightness = 0;
        let contrast = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const gray = (r + g + b) / 3;
          brightness += gray;
        }
        
        brightness /= (data.length / 4);
        
        // Simple quality score based on brightness and size
        let quality = 0.5;
        
        if (brightness > 50 && brightness < 200) quality += 0.2;
        if (img.width >= 800 && img.height >= 600) quality += 0.2;
        if (canvas.width * canvas.height > 500000) quality += 0.1;
        
        resolve(Math.min(1, quality));
      };
      img.src = dataUrl;
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setCapturedImage(dataUrl);
      setCurrentStep('preview');
    };
    reader.readAsDataURL(file);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'permission':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Camera className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-emerald-800 mb-2">
                Capture {getDocumentTitle()}
              </h3>
              <p className="text-emerald-600 text-sm">
                {getDocumentInstructions()}
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={startCamera}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Camera className="w-4 h-4 mr-2" />
                Open Camera
              </Button>
              
              <div className="relative">
                <Button 
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload from Gallery
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Smartphone className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div className="text-sm text-emerald-700">
                  <p className="font-medium mb-1">Tips for best results:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Ensure good lighting</li>
                    <li>• Keep document flat and straight</li>
                    <li>• Fill the entire frame</li>
                    <li>• Avoid shadows and glare</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case 'camera':
        return (
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-64 object-cover rounded-lg bg-gray-900"
              />
              
              {/* Camera overlay */}
              <div className="absolute inset-0 border-2 border-emerald-400 rounded-lg">
                <div className="absolute inset-4 border border-white/50 rounded-lg">
                  <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-white"></div>
                  <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-white"></div>
                  <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-white"></div>
                  <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-white"></div>
                </div>
              </div>
              
              {/* Instructions overlay */}
              <div className="absolute bottom-4 left-4 right-4 bg-black/70 text-white text-center py-2 px-4 rounded-lg">
                <p className="text-sm">Position {getDocumentTitle().toLowerCase()} within the frame</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={capturePhoto}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                <Camera className="w-4 h-4 mr-2" />
                Capture
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  stopCamera();
                  setCurrentStep('permission');
                }}
                className="border-emerald-300 text-emerald-700"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-emerald-800 mb-2">Review Capture</h3>
              <p className="text-emerald-600 text-sm">
                Please review the captured image before proceeding
              </p>
            </div>

            {capturedImage && (
              <div className="relative">
                <img 
                  src={capturedImage} 
                  alt="Captured document"
                  className="w-full h-64 object-cover rounded-lg border-2 border-emerald-200"
                />
                <Badge className="absolute top-2 right-2 bg-emerald-100 text-emerald-800">
                  <FileImage className="w-3 h-3 mr-1" />
                  {getDocumentTitle()}
                </Badge>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                onClick={confirmPhoto}
                disabled={isProcessing}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Use This Photo
                  </>
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={retakePhoto}
                disabled={isProcessing}
                className="border-emerald-300 text-emerald-700"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake
              </Button>
            </div>
          </div>
        );

      case 'processing':
        return (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full mx-auto flex items-center justify-center">
              <RefreshCw className="w-8 h-8 text-white animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-emerald-800">Processing Image</h3>
              <p className="text-emerald-600 text-sm">
                Analyzing document quality and extracting information...
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
              <h3 className="text-lg font-semibold text-green-800">Document Captured</h3>
              <p className="text-green-600 text-sm">
                Your {getDocumentTitle().toLowerCase()} has been successfully captured and processed
              </p>
            </div>
            <Badge className="bg-green-100 text-green-800 border-green-300">
              <CheckCircle className="w-3 h-3 mr-1" />
              High Quality Image
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
              <h3 className="text-lg font-semibold text-red-800">Capture Failed</h3>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <Button 
              onClick={() => setCurrentStep('permission')}
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
        <CardTitle className="text-emerald-800">Document Capture</CardTitle>
        <CardDescription className="text-emerald-600">
          Capture your {getDocumentTitle().toLowerCase()} for verification
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderStepContent()}
        
        {/* Hidden canvas for image processing */}
        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
}