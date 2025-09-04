'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Shield, 
  AlertTriangle, 
  Eye, 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  MapPin,
  Smartphone,
  Network,
  Brain,
  Zap,
  Target,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Settings,
  Bell,
  FileText,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';

// Mock data for demonstration
const mockFraudMetrics = {
  totalCases: 1247,
  activeCases: 89,
  resolvedCases: 1158,
  falsePositives: 156,
  detectionRate: 94.2,
  averageResponseTime: 1.8,
  riskDistribution: [
    { name: 'Low Risk', value: 65, color: '#10B981' },
    { name: 'Medium Risk', value: 20, color: '#F59E0B' },
    { name: 'High Risk', value: 12, color: '#EF4444' },
    { name: 'Critical Risk', value: 3, color: '#DC2626' },
  ],
};

const mockFraudTrends = [
  { date: '2024-01-01', detected: 45, blocked: 38, reviewed: 7 },
  { date: '2024-01-02', detected: 52, blocked: 41, reviewed: 11 },
  { date: '2024-01-03', detected: 38, blocked: 32, reviewed: 6 },
  { date: '2024-01-04', detected: 61, blocked: 48, reviewed: 13 },
  { date: '2024-01-05', detected: 43, blocked: 35, reviewed: 8 },
  { date: '2024-01-06', detected: 55, blocked: 44, reviewed: 11 },
  { date: '2024-01-07', detected: 49, blocked: 39, reviewed: 10 },
];

const mockIndicatorTypes = [
  { type: 'Velocity', count: 234, percentage: 28 },
  { type: 'Device', count: 189, percentage: 23 },
  { type: 'Geolocation', count: 156, percentage: 19 },
  { type: 'Identity', count: 134, percentage: 16 },
  { type: 'Behavioral', count: 98, percentage: 12 },
  { type: 'Financial', count: 23, percentage: 2 },
];

const mockActiveCases = [
  {
    id: 'CASE-001',
    entityId: 'ENT-12345',
    riskScore: 87,
    riskLevel: 'high',
    indicators: 5,
    status: 'investigating',
    assignee: 'Sarah Ahmed',
    createdAt: '2024-01-26T10:30:00Z',
    priority: 'high',
  },
  {
    id: 'CASE-002',
    entityId: 'ENT-67890',
    riskScore: 94,
    riskLevel: 'critical',
    indicators: 8,
    status: 'blocked',
    assignee: 'Mohammed Ali',
    createdAt: '2024-01-26T09:15:00Z',
    priority: 'critical',
  },
  {
    id: 'CASE-003',
    entityId: 'ENT-54321',
    riskScore: 72,
    riskLevel: 'medium',
    indicators: 3,
    status: 'reviewing',
    assignee: 'Fatima Hassan',
    createdAt: '2024-01-26T08:45:00Z',
    priority: 'medium',
  },
];

const mockRecentIndicators = [
  {
    id: 'IND-001',
    entityId: 'ENT-12345',
    type: 'velocity',
    severity: 'high',
    description: 'Multiple applications from same IP in 1 hour',
    confidence: 0.92,
    detectedAt: '2024-01-26T11:20:00Z',
  },
  {
    id: 'IND-002',
    entityId: 'ENT-67890',
    type: 'identity',
    severity: 'critical',
    description: 'Duplicate national ID detected',
    confidence: 0.98,
    detectedAt: '2024-01-26T11:15:00Z',
  },
  {
    id: 'IND-003',
    entityId: 'ENT-54321',
    type: 'geolocation',
    severity: 'medium',
    description: 'VPN usage detected',
    confidence: 0.78,
    detectedAt: '2024-01-26T11:10:00Z',
  },
];

export default function FraudDashboardPage() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        // Refresh data
        console.log('Refreshing fraud data...');
      }, 30000); // 30 seconds

      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'investigating': return 'text-blue-600 bg-blue-100';
      case 'blocked': return 'text-red-600 bg-red-100';
      case 'reviewing': return 'text-yellow-600 bg-yellow-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const handleCaseAction = (caseId: string, action: string) => {
    toast.success(`Case ${caseId} ${action} successfully`);
  };

  const exportReport = (format: 'pdf' | 'excel') => {
    toast.success(`Exporting fraud report as ${format.toUpperCase()}...`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Fraud Detection Center</h1>
              <p className="text-gray-600">AI-powered fraud detection and case management system</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={autoRefresh}
                  onCheckedChange={setAutoRefresh}
                />
                <Label className="text-sm">Auto-refresh</Label>
              </div>
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Last 24h</SelectItem>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => exportReport('pdf')}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" onClick={() => exportReport('excel')}>
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cases">Active Cases</TabsTrigger>
            <TabsTrigger value="indicators">Indicators</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{mockFraudMetrics.totalCases.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">
                    <span className="text-green-600">+8.2%</span> from last period
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{mockFraudMetrics.activeCases}</div>
                  <div className="text-xs text-muted-foreground">
                    <span className="text-red-600">+12</span> since yesterday
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Detection Rate</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{mockFraudMetrics.detectionRate}%</div>
                  <div className="text-xs text-muted-foreground">
                    <span className="text-green-600">+1.2%</span> improvement
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{mockFraudMetrics.averageResponseTime}s</div>
                  <div className="text-xs text-muted-foreground">
                    <span className="text-green-600">-0.3s</span> faster
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Fraud Detection Trends</CardTitle>
                  <CardDescription>Daily fraud detection and response metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={mockFraudTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="blocked" 
                        stackId="1" 
                        stroke="#EF4444" 
                        fill="#EF4444" 
                        fillOpacity={0.6}
                        name="Blocked"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="reviewed" 
                        stackId="1" 
                        stroke="#F59E0B" 
                        fill="#F59E0B" 
                        fillOpacity={0.6}
                        name="Under Review"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Risk Distribution</CardTitle>
                  <CardDescription>Current risk level breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={mockFraudMetrics.riskDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {mockFraudMetrics.riskDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Fraud Indicators</CardTitle>
                  <CardDescription>Latest detected fraud patterns</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockRecentIndicators.map((indicator) => (
                      <div key={indicator.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            indicator.severity === 'critical' ? 'bg-red-500' :
                            indicator.severity === 'high' ? 'bg-orange-500' :
                            indicator.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`} />
                          <div>
                            <div className="font-medium text-sm">{indicator.description}</div>
                            <div className="text-xs text-gray-500">
                              Entity: {indicator.entityId} • Confidence: {Math.round(indicator.confidence * 100)}%
                            </div>
                          </div>
                        </div>
                        <Badge className={getRiskColor(indicator.severity)}>
                          {indicator.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Indicator Types</CardTitle>
                  <CardDescription>Breakdown by fraud indicator category</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockIndicatorTypes.map((type) => (
                      <div key={type.type} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            {type.type === 'Velocity' && <Zap className="w-4 h-4 text-blue-600" />}
                            {type.type === 'Device' && <Smartphone className="w-4 h-4 text-blue-600" />}
                            {type.type === 'Geolocation' && <MapPin className="w-4 h-4 text-blue-600" />}
                            {type.type === 'Identity' && <Users className="w-4 h-4 text-blue-600" />}
                            {type.type === 'Behavioral' && <Brain className="w-4 h-4 text-blue-600" />}
                            {type.type === 'Financial' && <TrendingUp className="w-4 h-4 text-blue-600" />}
                          </div>
                          <div>
                            <div className="font-medium">{type.type}</div>
                            <div className="text-sm text-gray-500">{type.count} indicators</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium">{type.percentage}%</div>
                          <div className="w-20">
                            <Progress value={type.percentage} className="h-2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Active Cases Tab */}
          <TabsContent value="cases" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Active Fraud Cases</h2>
                <p className="text-gray-600">Manage and investigate fraud cases</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-gray-500" />
                  <Input
                    placeholder="Search cases..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="investigating">Investigating</SelectItem>
                    <SelectItem value="blocked">Blocked</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {mockActiveCases.map((fraudCase) => (
                <Card key={fraudCase.id} className="border-l-4 border-l-orange-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <CardTitle className="text-lg">{fraudCase.id}</CardTitle>
                          <CardDescription>Entity: {fraudCase.entityId}</CardDescription>
                        </div>
                        <Badge className={getRiskColor(fraudCase.riskLevel)}>
                          {fraudCase.riskLevel} risk
                        </Badge>
                        <Badge className={getStatusColor(fraudCase.status)}>
                          {fraudCase.status}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-600">{fraudCase.riskScore}</div>
                        <div className="text-sm text-gray-500">Risk Score</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <Label className="text-sm font-medium">Indicators</Label>
                        <div className="text-lg font-semibold">{fraudCase.indicators}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Assignee</Label>
                        <div className="text-sm">{fraudCase.assignee}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Priority</Label>
                        <Badge variant={fraudCase.priority === 'critical' ? 'destructive' : 'secondary'}>
                          {fraudCase.priority}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Created</Label>
                        <div className="text-sm">{new Date(fraudCase.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleCaseAction(fraudCase.id, 'investigated')}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Investigate
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCaseAction(fraudCase.id, 'blocked')}
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Block
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCaseAction(fraudCase.id, 'resolved')}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Resolve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleCaseAction(fraudCase.id, 'escalated')}
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Escalate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Indicators Tab */}
          <TabsContent value="indicators" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Fraud Indicators Analysis</h2>
              <p className="text-gray-600">Detailed analysis of fraud detection patterns</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Indicator Performance</CardTitle>
                  <CardDescription>Effectiveness of different fraud indicators</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockIndicatorTypes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="type" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Detection Accuracy</CardTitle>
                  <CardDescription>True positives vs false positives by indicator type</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockIndicatorTypes.map((type) => (
                      <div key={type.type} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{type.type}</span>
                          <span>92% accuracy</span>
                        </div>
                        <div className="flex gap-1">
                          <div className="flex-1 bg-green-200 h-2 rounded-l" style={{ width: '92%' }} />
                          <div className="bg-red-200 h-2 rounded-r" style={{ width: '8%' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>ML Model Performance</CardTitle>
                <CardDescription>Anomaly detection model metrics and performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">94.2%</div>
                    <div className="text-sm text-gray-600">Precision</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">91.8%</div>
                    <div className="text-sm text-gray-600">Recall</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">93.0%</div>
                    <div className="text-sm text-gray-600">F1-Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-2">0.97</div>
                    <div className="text-sm text-gray-600">AUC-ROC</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Advanced Analytics</h2>
              <p className="text-gray-600">Deep insights into fraud patterns and trends</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Cost Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-2">$2.4M</div>
                  <div className="text-sm text-gray-600 mb-4">Fraud prevented this month</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Detection cost</span>
                      <span>$45K</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Investigation cost</span>
                      <span>$23K</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>Net savings</span>
                      <span className="text-green-600">$2.33M</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Geographic Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Riyadh</span>
                      <div className="flex items-center gap-2">
                        <Progress value={45} className="w-16 h-2" />
                        <span className="text-xs text-gray-600">45%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Jeddah</span>
                      <div className="flex items-center gap-2">
                        <Progress value={28} className="w-16 h-2" />
                        <span className="text-xs text-gray-600">28%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Dammam</span>
                      <div className="flex items-center gap-2">
                        <Progress value={15} className="w-16 h-2" />
                        <span className="text-xs text-gray-600">15%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Other</span>
                      <div className="flex items-center gap-2">
                        <Progress value={12} className="w-16 h-2" />
                        <span className="text-xs text-gray-600">12%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Time Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Peak Hours</span>
                      <span className="text-sm font-medium">2-4 PM</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Weekend Activity</span>
                      <span className="text-sm font-medium">+23%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Night Activity</span>
                      <span className="text-sm font-medium text-red-600">+67%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Holiday Spikes</span>
                      <span className="text-sm font-medium text-orange-600">+45%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Fraud Detection Settings</h2>
              <p className="text-gray-600">Configure fraud detection parameters and thresholds</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Risk Thresholds</CardTitle>
                  <CardDescription>Configure risk score thresholds for different actions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Low Risk Threshold</Label>
                    <Input type="number" defaultValue="25" className="mt-1" />
                  </div>
                  <div>
                    <Label>Medium Risk Threshold</Label>
                    <Input type="number" defaultValue="50" className="mt-1" />
                  </div>
                  <div>
                    <Label>High Risk Threshold</Label>
                    <Input type="number" defaultValue="75" className="mt-1" />
                  </div>
                  <div>
                    <Label>Critical Risk Threshold</Label>
                    <Input type="number" defaultValue="90" className="mt-1" />
                  </div>
                  <Button className="w-full">
                    <Settings className="w-4 h-4 mr-2" />
                    Update Thresholds
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Alert Settings</CardTitle>
                  <CardDescription>Configure notification preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Alerts</Label>
                      <p className="text-xs text-gray-500">Receive email notifications for high-risk cases</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>SMS Alerts</Label>
                      <p className="text-xs text-gray-500">Receive SMS for critical cases</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Webhook Notifications</Label>
                      <p className="text-xs text-gray-500">Send alerts to external systems</p>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Auto-block Critical Cases</Label>
                      <p className="text-xs text-gray-500">Automatically block high-confidence critical cases</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Button className="w-full">
                    <Bell className="w-4 h-4 mr-2" />
                    Update Alert Settings
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Model Configuration</CardTitle>
                <CardDescription>Advanced ML model settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Model Sensitivity</Label>
                    <Select defaultValue="balanced">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="conservative">Conservative</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                        <SelectItem value="aggressive">Aggressive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Confidence Threshold</Label>
                    <Input type="number" step="0.1" min="0" max="1" defaultValue="0.8" />
                  </div>
                  <div>
                    <Label>Retraining Frequency</Label>
                    <Select defaultValue="weekly">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Feature Importance Threshold</Label>
                    <Input type="number" step="0.01" min="0" max="1" defaultValue="0.05" />
                  </div>
                </div>
                <Button className="w-full">
                  <Brain className="w-4 h-4 mr-2" />
                  Update Model Configuration
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}