'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  University, 
  Shield, 
  TrendingUp, 
  Users, 
  Plus, 
  FileText,
  Settings,
  Globe
} from 'lucide-react';

export default function InstitutionDashboard() {
  const [capitalRatio] = useState(18.5);
  const [riskRating] = useState('AA-');

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Institution Dashboard</h1>
          <p className="text-gray-600">Financial institution management and regulatory oversight</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Risk Rating</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{riskRating}</div>
              <Badge variant="secondary" className="mt-1 bg-green-100 text-green-800">
                Investment Grade
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Capital Adequacy</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{capitalRatio}%</div>
              <Progress value={capitalRatio * 5} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Portfolios</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <div className="text-xs text-muted-foreground">
                ₪1.2B under management
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98%</div>
              <Badge variant="secondary" className="mt-1 bg-green-100 text-green-800">
                Compliant
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Institution Profile */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <University className="w-5 h-5" />
                  Institution Profile
                </CardTitle>
                <CardDescription>
                  Regulatory information and institutional details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">SAMA License</span>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Institution Type</span>
                  <span className="text-sm">Commercial Bank</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Regulatory Authority</span>
                  <span className="text-sm">SAMA</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">License Number</span>
                  <span className="text-sm">LIC-2024-001</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Last Audit</span>
                  <span className="text-sm">December 2024</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Institutional Actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>System Management</CardTitle>
                <CardDescription>
                  Platform administration and oversight
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Portfolio
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Entities
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="w-4 h-4 mr-2" />
                  Risk Management
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  System Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}