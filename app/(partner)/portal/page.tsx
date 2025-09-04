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
  Activity, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users, 
  DollarSign, 
  Key, 
  Shield, 
  Globe, 
  Download, 
  FileText, 
  Code, 
  Webhook, 
  Settings,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Filter,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Map,
  Zap,
  AlertTriangle,
  Info
} from 'lucide-react';
import { toast } from 'sonner';

// Mock data for demonstration
const mockApiUsage = [
  { date: '2024-01-01', requests: 1200, successful: 1140, failed: 60 },
  { date: '2024-01-02', requests: 1350, successful: 1283, failed: 67 },
  { date: '2024-01-03', requests: 1100, successful: 1045, failed: 55 },
  { date: '2024-01-04', requests: 1450, successful: 1392, failed: 58 },
  { date: '2024-01-05', requests: 1600, successful: 1536, failed: 64 },
  { date: '2024-01-06', requests: 1380, successful: 1324, failed: 56 },
  { date: '2024-01-07', requests: 1520, successful: 1463, failed: 57 },
];

const mockResponseTimes = [
  { time: '00:00', avgTime: 42, p95Time: 78, p99Time: 125 },
  { time: '04:00', avgTime: 38, p95Time: 72, p99Time: 118 },
  { time: '08:00', avgTime: 45, p95Time: 85, p99Time: 142 },
  { time: '12:00', avgTime: 52, p95Time: 95, p99Time: 165 },
  { time: '16:00', avgTime: 48, p95Time: 88, p99Time: 148 },
  { time: '20:00', avgTime: 41, p95Time: 76, p99Time: 128 },
];

const mockRiskDistribution = [
  { name: 'Very Low Risk', value: 25, color: '#10B981' },
  { name: 'Low Risk', value: 35, color: '#3B82F6' },
  { name: 'Medium Risk', value: 25, color: '#F59E0B' },
  { name: 'High Risk', value: 12, color: '#EF4444' },
  { name: 'Very High Risk', value: 3, color: '#DC2626' },
];

const mockGeographicData = [
  { region: 'Riyadh', assessments: 4500, percentage: 35 },
  { region: 'Jeddah', assessments: 3200, percentage: 25 },
  { region: 'Dammam', assessments: 2100, percentage: 16 },
  { region: 'Mecca', assessments: 1800, percentage: 14 },
  { region: 'Medina', assessments: 1300, percentage: 10 },
];

const mockRevenueData = [
  { month: 'Jan', revenue: 125000, assessments: 2500, costPerAssessment: 50 },
  { month: 'Feb', revenue: 142000, assessments: 2840, costPerAssessment: 50 },
  { month: 'Mar', revenue: 138000, assessments: 2760, costPerAssessment: 50 },
  { month: 'Apr', revenue: 156000, assessments: 3120, costPerAssessment: 50 },
  { month: 'May', revenue: 168000, assessments: 3360, costPerAssessment: 50 },
  { month: 'Jun', revenue: 175000, assessments: 3500, costPerAssessment: 50 },
];

export default function PartnerPortalPage() {
  const [selectedDateRange, setSelectedDateRange] = useState('7d');
  const [apiKeys, setApiKeys] = useState([
    {
      id: '1',
      name: 'Production API Key',
      key: 'pk_live_1234567890abcdef',
      created: '2024-01-15',
      lastUsed: '2024-01-26',
      status: 'active',
      permissions: ['assessments:read', 'assessments:write', 'entities:read'],
      rateLimit: 1000,
    },
    {
      id: '2',
      name: 'Development API Key',
      key: 'pk_test_abcdef1234567890',
      created: '2024-01-10',
      lastUsed: '2024-01-25',
      status: 'active',
      permissions: ['assessments:read', 'entities:read'],
      rateLimit: 100,
    },
  ]);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [webhookUrl, setWebhookUrl] = useState('https://api.yourcompany.com/webhooks/ksa-lending');
  const [webhookEnabled, setWebhookEnabled] = useState(true);

  const currentUsage = 8750;
  const monthlyQuota = 10000;
  const usagePercentage = (currentUsage / monthlyQuota) * 100;

  const toggleApiKeyVisibility = (keyId: string) => {
    setShowApiKey(prev => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const regenerateApiKey = (keyId: string) => {
    const newKey = `pk_live_${Math.random().toString(36).substr(2, 16)}`;
    setApiKeys(prev => prev.map(key => 
      key.id === keyId ? { ...key, key: newKey } : key
    ));
    toast.success('API key regenerated successfully');
  };

  const exportData = (format: 'pdf' | 'excel') => {
    toast.success(`Exporting data as ${format.toUpperCase()}...`);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Partner Portal</h1>
              <p className="text-gray-600">Comprehensive analytics and API management for fintech integrations</p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
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
              <Button variant="outline" onClick={() => exportData('pdf')}>
                <Download className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" onClick={() => exportData('excel')}>
                <Download className="w-4 h-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="integration">Integration</TabsTrigger>
            <TabsTrigger value="business">Business Intelligence</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">9,847</div>
                  <div className="text-xs text-muted-foreground">
                    <span className="text-green-600">+12.5%</span> from last period
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">96.2%</div>
                  <div className="text-xs text-muted-foreground">
                    <span className="text-green-600">+0.8%</span> from last period
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">42ms</div>
                  <div className="text-xs text-muted-foreground">
                    <span className="text-green-600">-3ms</span> from last period
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Quota</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{currentUsage.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground mb-2">
                    of {monthlyQuota.toLocaleString()} requests
                  </div>
                  <Progress value={usagePercentage} className="h-2" />
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Usage Trends</CardTitle>
                  <CardDescription>Daily request volume and success rates</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={mockApiUsage}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="successful" 
                        stackId="1" 
                        stroke="#10B981" 
                        fill="#10B981" 
                        fillOpacity={0.6}
                        name="Successful"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="failed" 
                        stackId="1" 
                        stroke="#EF4444" 
                        fill="#EF4444" 
                        fillOpacity={0.6}
                        name="Failed"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Response Time Analytics</CardTitle>
                  <CardDescription>Average, P95, and P99 response times</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={mockResponseTimes}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="avgTime" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        name="Average"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="p95Time" 
                        stroke="#F59E0B" 
                        strokeWidth={2}
                        name="P95"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="p99Time" 
                        stroke="#EF4444" 
                        strokeWidth={2}
                        name="P99"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* SLA Monitoring */}
            <Card>
              <CardHeader>
                <CardTitle>SLA Monitoring</CardTitle>
                <CardDescription>Service level agreement compliance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">99.8%</div>
                    <div className="text-sm text-gray-600">Uptime</div>
                    <div className="text-xs text-green-600 mt-1">✓ SLA Met</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">42ms</div>
                    <div className="text-sm text-gray-600">Avg Response</div>
                    <div className="text-xs text-green-600 mt-1">✓ Under 50ms</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">96.2%</div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                    <div className="text-xs text-green-600 mt-1">✓ Above 95%</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">API Key Management</h2>
                <p className="text-gray-600">Manage your API keys, permissions, and security settings</p>
              </div>
              <Button>
                <Key className="w-4 h-4 mr-2" />
                Generate New Key
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* API Keys List */}
              <div className="space-y-4">
                {apiKeys.map((apiKey) => (
                  <Card key={apiKey.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{apiKey.name}</CardTitle>
                        <Badge variant={apiKey.status === 'active' ? 'default' : 'secondary'}>
                          {apiKey.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">API Key</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            type={showApiKey[apiKey.id] ? 'text' : 'password'}
                            value={apiKey.key}
                            readOnly
                            className="font-mono text-sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleApiKeyVisibility(apiKey.id)}
                          >
                            {showApiKey[apiKey.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyToClipboard(apiKey.key)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Created:</span>
                          <div className="font-medium">{apiKey.created}</div>
                        </div>
                        <div>
                          <span className="text-gray-600">Last Used:</span>
                          <div className="font-medium">{apiKey.lastUsed}</div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Permissions</Label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {apiKey.permissions.map((permission) => (
                            <Badge key={permission} variant="outline" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Rate Limit</Label>
                        <div className="text-sm text-gray-600 mt-1">
                          {apiKey.rateLimit} requests per hour
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => regenerateApiKey(apiKey.id)}
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Regenerate
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-2" />
                          Configure
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Security Settings */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Security Settings</CardTitle>
                    <CardDescription>Configure IP whitelist and security options</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="ip-whitelist">IP Whitelist</Label>
                      <Input
                        id="ip-whitelist"
                        placeholder="192.168.1.1, 10.0.0.0/8"
                        className="mt-1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Comma-separated list of allowed IP addresses or CIDR blocks
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Require HTTPS</Label>
                        <p className="text-xs text-gray-500">Force all API calls to use HTTPS</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Rate Limit Notifications</Label>
                        <p className="text-xs text-gray-500">Get notified when approaching limits</p>
                      </div>
                      <Switch defaultChecked />
                    </div>

                    <Button className="w-full">
                      <Shield className="w-4 h-4 mr-2" />
                      Update Security Settings
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Webhook Configuration</CardTitle>
                    <CardDescription>Configure webhook endpoints for real-time notifications</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="webhook-url">Webhook URL</Label>
                      <Input
                        id="webhook-url"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        className="mt-1"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Webhooks</Label>
                        <p className="text-xs text-gray-500">Receive real-time notifications</p>
                      </div>
                      <Switch
                        checked={webhookEnabled}
                        onCheckedChange={setWebhookEnabled}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Event Types</Label>
                      <div className="space-y-2">
                        {['assessment.completed', 'assessment.failed', 'quota.warning', 'quota.exceeded'].map((event) => (
                          <div key={event} className="flex items-center space-x-2">
                            <Switch defaultChecked />
                            <Label className="text-sm">{event}</Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button className="w-full">
                      <Webhook className="w-4 h-4 mr-2" />
                      Test Webhook
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Assessment Analytics</h2>
              <p className="text-gray-600">Detailed insights into your assessment patterns and performance</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Risk Category Distribution</CardTitle>
                  <CardDescription>Breakdown of assessments by risk level</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={mockRiskDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {mockRiskDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Geographic Distribution</CardTitle>
                  <CardDescription>Assessment volume by region</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockGeographicData.map((region) => (
                      <div key={region.region} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Map className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">{region.region}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-gray-600">
                            {region.assessments.toLocaleString()} ({region.percentage}%)
                          </div>
                          <div className="w-20">
                            <Progress value={region.percentage} className="h-2" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Approval Rate Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-2">78.5%</div>
                  <div className="text-sm text-gray-600 mb-4">Average approval rate</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>This month</span>
                      <span className="text-green-600">+2.3%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Last month</span>
                      <span>76.2%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Processing Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-2">42ms</div>
                  <div className="text-sm text-gray-600 mb-4">Average processing time</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>P95</span>
                      <span>85ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>P99</span>
                      <span>142ms</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Popular Assessment Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Personal Loans</span>
                      <div className="flex items-center gap-2">
                        <Progress value={65} className="w-16 h-2" />
                        <span className="text-xs text-gray-600">65%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Credit Cards</span>
                      <div className="flex items-center gap-2">
                        <Progress value={25} className="w-16 h-2" />
                        <span className="text-xs text-gray-600">25%</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Business Loans</span>
                      <div className="flex items-center gap-2">
                        <Progress value={10} className="w-16 h-2" />
                        <span className="text-xs text-gray-600">10%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Integration Tab */}
          <TabsContent value="integration" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Integration Tools</h2>
              <p className="text-gray-600">Documentation, code samples, and testing tools</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>API Documentation</CardTitle>
                  <CardDescription>Interactive API documentation and testing</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Authentication</div>
                        <div className="text-sm text-gray-600">API key management and JWT tokens</div>
                      </div>
                      <Button variant="outline" size="sm">
                        <FileText className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Assessments API</div>
                        <div className="text-sm text-gray-600">Credit assessment endpoints</div>
                      </div>
                      <Button variant="outline" size="sm">
                        <FileText className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">Entities API</div>
                        <div className="text-sm text-gray-600">Entity management endpoints</div>
                      </div>
                      <Button variant="outline" size="sm">
                        <FileText className="w-4 h-4 mr-2" />
                        View
                      </Button>
                    </div>
                  </div>
                  <Button className="w-full">
                    <Globe className="w-4 h-4 mr-2" />
                    Open Full Documentation
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Code Samples</CardTitle>
                  <CardDescription>Ready-to-use code examples in multiple languages</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Code className="w-5 h-5 text-yellow-600" />
                        <div>
                          <div className="font-medium">JavaScript/Node.js</div>
                          <div className="text-sm text-gray-600">Complete SDK with examples</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Code className="w-5 h-5 text-blue-600" />
                        <div>
                          <div className="font-medium">Python</div>
                          <div className="text-sm text-gray-600">Python SDK and examples</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Code className="w-5 h-5 text-red-600" />
                        <div>
                          <div className="font-medium">Java</div>
                          <div className="text-sm text-gray-600">Java SDK and Spring Boot examples</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>API Testing Console</CardTitle>
                <CardDescription>Test API endpoints directly from the portal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Endpoint</Label>
                    <Select defaultValue="assessments">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assessments">POST /assessments</SelectItem>
                        <SelectItem value="entities">GET /entities</SelectItem>
                        <SelectItem value="auth">POST /auth/token</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Environment</Label>
                    <Select defaultValue="sandbox">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sandbox">Sandbox</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Request Body</Label>
                  <textarea
                    className="w-full h-32 p-3 border rounded-lg font-mono text-sm"
                    placeholder='{\n  "entity_type": "individual",\n  "identification": {\n    "type": "national_id",\n    "number": "1234567890"\n  }\n}'
                  />
                </div>
                <Button className="w-full">
                  <Zap className="w-4 h-4 mr-2" />
                  Send Test Request
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Business Intelligence Tab */}
          <TabsContent value="business" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Business Intelligence</h2>
              <p className="text-gray-600">Revenue insights, performance metrics, and market analysis</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-2">$175,000</div>
                  <div className="text-sm text-gray-600 mb-4">+12.5% from last month</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Assessments</span>
                      <span>3,500</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg. per assessment</span>
                      <span>$50.00</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cost Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600 mb-2">$42.50</div>
                  <div className="text-sm text-gray-600 mb-4">Cost per assessment</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Infrastructure</span>
                      <span>$25.00</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Data sources</span>
                      <span>$17.50</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Profit Margin</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-600 mb-2">15%</div>
                  <div className="text-sm text-gray-600 mb-4">Net profit margin</div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Gross margin</span>
                      <span>22%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Operating margin</span>
                      <span>18%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trends</CardTitle>
                  <CardDescription>Monthly revenue and assessment volume</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={mockRevenueData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="revenue" fill="#10B981" name="Revenue ($)" />
                      <Bar dataKey="assessments" fill="#3B82F6" name="Assessments" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Benchmarking</CardTitle>
                  <CardDescription>Compare your metrics against industry averages</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Success Rate</span>
                      <span className="text-sm text-green-600">Above Average</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="text-sm text-gray-600 mb-1">You: 96.2%</div>
                        <Progress value={96.2} className="h-2" />
                      </div>
                      <div className="text-sm text-gray-500">Avg: 94.1%</div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Response Time</span>
                      <span className="text-sm text-green-600">Excellent</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="text-sm text-gray-600 mb-1">You: 42ms</div>
                        <Progress value={84} className="h-2" />
                      </div>
                      <div className="text-sm text-gray-500">Avg: 67ms</div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Approval Rate</span>
                      <span className="text-sm text-yellow-600">Average</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="text-sm text-gray-600 mb-1">You: 78.5%</div>
                        <Progress value={78.5} className="h-2" />
                      </div>
                      <div className="text-sm text-gray-500">Avg: 79.2%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Conversion Funnel Analysis</CardTitle>
                <CardDescription>Track user journey from API call to loan approval</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">1</span>
                      </div>
                      <div>
                        <div className="font-medium">API Requests</div>
                        <div className="text-sm text-gray-600">Total assessment requests</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">9,847</div>
                      <div className="text-sm text-gray-600">100%</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-green-600">2</span>
                      </div>
                      <div>
                        <div className="font-medium">Successful Assessments</div>
                        <div className="text-sm text-gray-600">Completed without errors</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">9,472</div>
                      <div className="text-sm text-gray-600">96.2%</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-yellow-600">3</span>
                      </div>
                      <div>
                        <div className="font-medium">Loan Applications</div>
                        <div className="text-sm text-gray-600">Proceeded to loan application</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">7,435</div>
                      <div className="text-sm text-gray-600">78.5%</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-purple-600">4</span>
                      </div>
                      <div>
                        <div className="font-medium">Loan Approvals</div>
                        <div className="text-sm text-gray-600">Final loan approvals</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">5,841</div>
                      <div className="text-sm text-gray-600">78.6%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}