'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <Shield className="w-16 h-16 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-900">Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this resource
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            This page requires specific permissions or role access that your account doesn't currently have.
          </p>
          <div className="flex flex-col gap-2">
            <Button 
              onClick={() => router.back()}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button asChild className="w-full bg-green-600 hover:bg-green-700">
              <Link href="/">
                Return to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}