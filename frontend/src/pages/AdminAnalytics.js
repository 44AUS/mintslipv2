import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart
} from "recharts";
import { Lock, TrendingUp, Users, DollarSign, FileText, Eye, Calendar, Activity, ExternalLink, RefreshCw, Trash2, Database } from "lucide-react";
import { getAnalyticsSummary, clearAnalytics, addSampleData, getStoredAnalytics } from "@/utils/analyticsTracker";

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================

// Allowed IP addresses - add your IPs here
const ALLOWED_IPS = [
  "127.0.0.1",
  "localhost",
  // Add your IP addresses below:
  // "123.456.789.000",
];

// Admin password - CHANGE THIS to your secure password
const ADMIN_PASSWORD = "MintSlip2025!";

// Your Google Analytics Property ID
const GA_PROPERTY_ID = "G-L409EVV9LG";

// ============================================

// Color palette matching MintSlip theme
const COLORS = ['#1a4731', '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#065f46', '#047857'];

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isIPAllowed, setIsIPAllowed] = useState(null);
  const [password, setPassword] = useState("");
  const [userIP, setUserIP] = useState("");
  const [dateRange, setDateRange] = useState(30);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check IP on mount
  useEffect(() => {
    checkIPAccess();
  }, []);

  // Load analytics when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadAnalytics();
    }
  }, [isAuthenticated, dateRange]);

  const checkIPAccess = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      const ip = data.ip;
      setUserIP(ip);
      
      const hostname = window.location.hostname;
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
      const isAllowed = isLocalhost || ALLOWED_IPS.includes(ip);
      
      setIsIPAllowed(isAllowed);
      
      if (!isAllowed) {
        toast.error("Access denied. Your IP is not authorized.");
      }
    } catch (error) {
      const hostname = window.location.hostname;
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
      setIsIPAllowed(isLocalhost);
      setUserIP("Unknown");
    }
  };

  const loadAnalytics = () => {
    setIsLoading(true);
    const data = getAnalyticsSummary(dateRange);
    setAnalytics(data);
    setIsLoading(false);
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast.success("Welcome to Admin Analytics!");
    } else {
      toast.error("Incorrect password");
    }
  };

  const handleAddSampleData = () => {
    const count = addSampleData();
    toast.success(`Added sample data! Total: ${count} documents`);
    loadAnalytics();
  };

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
      clearAnalytics();
      toast.success('Analytics data cleared');
      loadAnalytics();
    }
  };

  // IP Check Loading State
  if (isIPAllowed === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
          <p className="text-slate-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  // IP Not Allowed
  if (!isIPAllowed) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-600">Access Denied</CardTitle>
            <CardDescription>
              Your IP address ({userIP}) is not authorized to access this page.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate("/")} variant="outline">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Password Login Form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-green-700" />
            </div>
            <CardTitle className="text-2xl" style={{ color: '#1a4731' }}>Admin Analytics</CardTitle>
            <CardDescription>
              Enter your password to access the analytics dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                />
              </div>
              <Button type="submit" className="w-full bg-green-700 hover:bg-green-800">
                Access Dashboard
              </Button>
            </form>
            <p className="text-xs text-slate-500 text-center mt-4">
              IP: {userIP} (Authorized)
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Analytics Dashboard
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: '#1a4731' }}>
              Analytics Dashboard
            </h1>
            <p className="text-slate-600">Track your MintSlip documents and revenue</p>
          </div>
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200">
              <Calendar className="w-4 h-4 text-slate-500" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(parseInt(e.target.value))}
                className="bg-transparent border-none text-sm focus:outline-none"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={loadAnalytics}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setIsAuthenticated(false)}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Logout
            </Button>
          </div>
        </div>

        {analytics && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Total Documents</p>
                      <p className="text-3xl font-bold" style={{ color: '#1a4731' }}>
                        {analytics.totalDocuments.toLocaleString()}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-green-700" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Last {dateRange} days</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Total Revenue</p>
                      <p className="text-3xl font-bold" style={{ color: '#1a4731' }}>
                        ${analytics.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-yellow-700" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Last {dateRange} days</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Avg. Order Value</p>
                      <p className="text-3xl font-bold" style={{ color: '#1a4731' }}>
                        ${analytics.totalDocuments > 0 
                          ? (analytics.totalRevenue / analytics.totalDocuments).toFixed(2) 
                          : '0.00'}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-blue-700" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Per document</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Document Types</p>
                      <p className="text-3xl font-bold" style={{ color: '#1a4731' }}>
                        {analytics.typeData.length}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Activity className="w-6 h-6 text-purple-700" />
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Active products</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Documents & Revenue Over Time */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg" style={{ color: '#1a4731' }}>Documents & Revenue Over Time</CardTitle>
                  <CardDescription>Daily breakdown for the last {dateRange} days</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.dailyStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={analytics.dailyStats}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="dateLabel" 
                          tick={{ fontSize: 11 }} 
                          stroke="#64748b"
                          interval={Math.ceil(analytics.dailyStats.length / 7)}
                        />
                        <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#64748b" />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#64748b" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px'
                          }}
                          formatter={(value, name) => [
                            name === 'revenue' ? `$${value.toFixed(2)}` : value,
                            name === 'revenue' ? 'Revenue' : 'Documents'
                          ]}
                        />
                        <Legend />
                        <Bar yAxisId="left" dataKey="documents" fill="#10b981" name="Documents" radius={[4, 4, 0, 0]} />
                        <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="#1a4731" strokeWidth={2} name="Revenue" dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-slate-400">
                      No data available for this period
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Revenue Trend */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg" style={{ color: '#1a4731' }}>Revenue Trend</CardTitle>
                  <CardDescription>Cumulative revenue over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.dailyStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={analytics.dailyStats.map((day, index, arr) => ({
                        ...day,
                        cumulativeRevenue: arr.slice(0, index + 1).reduce((sum, d) => sum + d.revenue, 0)
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="dateLabel" 
                          tick={{ fontSize: 11 }} 
                          stroke="#64748b"
                          interval={Math.ceil(analytics.dailyStats.length / 7)}
                        />
                        <YAxis tick={{ fontSize: 12 }} stroke="#64748b" tickFormatter={(v) => `$${v}`} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px'
                          }}
                          formatter={(value) => [`$${value.toFixed(2)}`, 'Cumulative Revenue']}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="cumulativeRevenue" 
                          stroke="#059669" 
                          fill="#d1fae5" 
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-slate-400">
                      No data available for this period
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Document Types Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg" style={{ color: '#1a4731' }}>Documents by Type</CardTitle>
                  <CardDescription>Distribution of generated documents</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.typeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={analytics.typeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          labelLine={false}
                        >
                          {analytics.typeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px'
                          }}
                          formatter={(value, name, props) => [
                            `${value} docs ($${props.payload.revenue.toFixed(2)})`,
                            props.payload.name
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-slate-400">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Revenue by Type */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg" style={{ color: '#1a4731' }}>Revenue by Type</CardTitle>
                  <CardDescription>Income from each document type</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.typeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analytics.typeData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" tick={{ fontSize: 12 }} stroke="#64748b" tickFormatter={(v) => `$${v}`} />
                        <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#64748b" width={90} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px'
                          }}
                          formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
                        />
                        <Bar dataKey="revenue" fill="#059669" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-slate-400">
                      No data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Documents */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg" style={{ color: '#1a4731' }}>Recent Documents</CardTitle>
                  <CardDescription>Latest generated documents</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.recentDocuments.length > 0 ? (
                    <div className="space-y-3 max-h-[280px] overflow-y-auto">
                      {analytics.recentDocuments.map((doc, index) => (
                        <div key={doc.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                          <div className="flex items-center gap-3">
                            <span className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-xs font-semibold text-green-700">
                              {index + 1}
                            </span>
                            <div>
                              <p className="text-sm font-medium text-slate-700">{doc.documentType}</p>
                              <p className="text-xs text-slate-400">
                                {new Date(doc.timestamp).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-semibold text-green-600">${doc.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-[280px] flex items-center justify-center text-slate-400">
                      No recent documents
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Data Management */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="text-lg" style={{ color: '#1a4731' }}>Data Management</CardTitle>
                <CardDescription>Manage your local analytics data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  <Button variant="outline" onClick={handleAddSampleData}>
                    <Database className="w-4 h-4 mr-2" />
                    Add Sample Data (Testing)
                  </Button>
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleClearData}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All Data
                  </Button>
                  <a 
                    href={`https://analytics.google.com/analytics/web/#/p${GA_PROPERTY_ID.replace('G-', '')}/reports/dashboard`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Google Analytics
                    </Button>
                  </a>
                </div>
                <p className="text-xs text-slate-500 mt-4">
                  <strong>Note:</strong> Data is stored in your browser's localStorage. It persists across sessions but is specific to this browser.
                  Data is also sent to Google Analytics for backup.
                </p>
              </CardContent>
            </Card>

            {/* Configuration Info */}
            <Card className="bg-slate-50 border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg text-slate-700">⚙️ Configuration</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 space-y-3">
                <p><strong>File:</strong> <code className="bg-slate-200 px-1 rounded">/frontend/src/pages/AdminAnalytics.js</code></p>
                <p><strong>Password (line 25):</strong> <code className="bg-slate-200 px-1 rounded">const ADMIN_PASSWORD = "{ADMIN_PASSWORD}";</code></p>
                <p><strong>Allowed IPs (line 18-22):</strong> Add your IP addresses to the ALLOWED_IPS array</p>
              </CardContent>
            </Card>
          </>
        )}

      </div>
      <Footer />
    </div>
  );
}
