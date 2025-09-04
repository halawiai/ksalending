'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  User, 
  CreditCard, 
  TrendingUp, 
  Shield, 
  Plus, 
  FileText,
  AlertTriangle 
} from 'lucide-react';

export default function IndividualDashboard() {
  const [creditScore] = useState(725);
  const [riskLevel] = useState('Low');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Individual Dashboard</h1>
          <p className="text-gray-600">Comprehensive credit management and lending insights</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credit Score</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{creditScore}</div>
              <div className="text-xs text-muted-foreground">
                +12 from last month
              </div>
              <Progress value={(creditScore / 850) * 100} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{riskLevel}</div>
              <Badge variant="secondary" className="mt-1 bg-green-100 text-green-800">
                Excellent
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
              <div className="text-xs text-muted-foreground">
                Total: ₪245,000
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Credit</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₪180,000</div>
              <div className="text-xs text-muted-foreground">
                Based on current profile
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Overview
                </CardTitle>
                <CardDescription>
                  Your personal financial profile and verification status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Identity Verification</span>
                  <Badge className="bg-green-100 text-green-800">Verified</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Income Verification</span>
                  <Badge className="bg-green-100 text-green-800">Verified</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Employment Status</span>
                  <span className="text-sm">Employed</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Monthly Income</span>
                  <span className="text-sm font-semibold">₪15,000</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks and applications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Apply for Loan
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  View Credit Report
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Update Profile
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Dispute Information
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}