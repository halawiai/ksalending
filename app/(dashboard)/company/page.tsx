'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Plus, 
  FileText,
  BarChart3 
} from 'lucide-react';

export default function CompanyDashboard() {
  const [creditRating] = useState('A+');
  const [annualRevenue] = useState(2500000);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Company Dashboard</h1>
          <p className="text-gray-600">Corporate lending and business credit management</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credit Rating</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{creditRating}</div>
              <Badge variant="secondary" className="mt-1 bg-green-100 text-green-800">
                Excellent
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Annual Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₪{(annualRevenue / 1000000).toFixed(1)}M</div>
              <div className="text-xs text-muted-foreground">
                +8.2% from last year
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employee Count</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">85</div>
              <div className="text-xs text-muted-foreground">
                +5 this quarter
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Credit Utilization</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">32%</div>
              <Progress value={32} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Company Profile */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Company Profile
                </CardTitle>
                <CardDescription>
                  Business information and verification status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Commercial Registration</span>
                  <Badge className="bg-green-100 text-green-800">Verified</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Financial Statements</span>
                  <Badge className="bg-green-100 text-green-800">Up to Date</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Legal Form</span>
                  <span className="text-sm">Limited Liability Company</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Industry Sector</span>
                  <span className="text-sm">Technology Services</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Establishment Date</span>
                  <span className="text-sm">January 2019</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Corporate Actions</CardTitle>
                <CardDescription>
                  Business lending and credit services
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Apply for Business Loan
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="w-4 h-4 mr-2" />
                  Credit Assessment
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Financial Analysis
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Growth Projections
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}