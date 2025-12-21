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
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { Lock, TrendingUp, Users, DollarSign, FileText, Eye, Calendar, Activity } from "lucide-react";

// Allowed IP addresses - add your IPs here
const ALLOWED_IPS = [
  "127.0.0.1",
  "localhost",
  // Add more allowed IPs here
  // "YOUR.IP.ADDRESS.HERE",
];

// Admin password - change this to your secure password
const ADMIN_PASSWORD = "MintSlip2025!";

// Color palette matching MintSlip theme
const COLORS = ['#1a4731', '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isIPAllowed, setIsIPAllowed] = useState(null); // null = checking, true/false = result
  const [password, setPassword] = useState("");
  const [userIP, setUserIP] = useState("");
  const [dateRange, setDateRange] = useState("7d");
  
  // Analytics data state (will be populated from GA)
  const [analyticsData, setAnalyticsData] = useState({
    totalVisitors: 0,
    pageViews: 0,
    avgSessionDuration: "0:00",
    bounceRate: "0%",
    revenue: 0,
    documentsGenerated: 0,
  });

  // Sample data for charts (replace with real GA data)
  const [visitorData, setVisitorData] = useState([]);
  const [pageViewData, setPageViewData] = useState([]);
  const [documentTypeData, setDocumentTypeData] = useState([]);
  const [trafficSourceData, setTrafficSourceData] = useState([]);
  const [topPagesData, setTopPagesData] = useState([]);

  // Check IP on mount
  useEffect(() => {
    checkIPAccess();
  }, []);

  // Load analytics data when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadAnalyticsData();
    }
  }, [isAuthenticated, dateRange]);

  const checkIPAccess = async () => {
    try {
      // Get user's IP from an external service
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      const ip = data.ip;
      setUserIP(ip);
      
      // Check if IP is in allowed list or if on localhost
      const hostname = window.location.hostname;
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
      const isAllowed = isLocalhost || ALLOWED_IPS.includes(ip);
      
      setIsIPAllowed(isAllowed);
      
      if (!isAllowed) {
        toast.error("Access denied. Your IP is not authorized.");
      }
    } catch (error) {
      // If can't get IP, check if localhost
      const hostname = window.location.hostname;
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
      setIsIPAllowed(isLocalhost);
      setUserIP("Unknown");
    }
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

  const loadAnalyticsData = () => {
    // Generate sample data based on date range
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    
    // Generate visitor data
    const visitors = [];
    const pageViews = [];
    let totalVisitors = 0;
    let totalPageViews = 0;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dailyVisitors = Math.floor(Math.random() * 500) + 100;
      const dailyPageViews = Math.floor(dailyVisitors * (Math.random() * 2 + 2));
      
      totalVisitors += dailyVisitors;
      totalPageViews += dailyPageViews;
      
      visitors.push({ date: dateStr, visitors: dailyVisitors });
      pageViews.push({ date: dateStr, pageViews: dailyPageViews });
    }
    
    setVisitorData(visitors);
    setPageViewData(pageViews);
    
    // Document type distribution
    setDocumentTypeData([
      { name: 'Paystubs', value: Math.floor(Math.random() * 1000) + 500, color: COLORS[0] },
      { name: 'W-2 Forms', value: Math.floor(Math.random() * 500) + 200, color: COLORS[1] },
      { name: 'Bank Statements', value: Math.floor(Math.random() * 400) + 150, color: COLORS[2] },
      { name: '1099 Forms', value: Math.floor(Math.random() * 300) + 100, color: COLORS[3] },
      { name: 'Offer Letters', value: Math.floor(Math.random() * 200) + 50, color: COLORS[4] },
      { name: 'Other', value: Math.floor(Math.random() * 150) + 50, color: COLORS[5] },
    ]);
    
    // Traffic sources
    setTrafficSourceData([
      { source: 'Organic Search', visitors: Math.floor(Math.random() * 2000) + 1000 },
      { source: 'Direct', visitors: Math.floor(Math.random() * 1500) + 500 },
      { source: 'Social Media', visitors: Math.floor(Math.random() * 800) + 200 },
      { source: 'Referral', visitors: Math.floor(Math.random() * 500) + 100 },
      { source: 'Email', visitors: Math.floor(Math.random() * 300) + 50 },
    ]);
    
    // Top pages
    setTopPagesData([
      { page: '/paystub', views: Math.floor(Math.random() * 5000) + 2000 },
      { page: '/', views: Math.floor(Math.random() * 4000) + 1500 },
      { page: '/w2', views: Math.floor(Math.random() * 2000) + 800 },
      { page: '/bankstatement', views: Math.floor(Math.random() * 1500) + 500 },
      { page: '/1099-nec', views: Math.floor(Math.random() * 1000) + 300 },
    ]);
    
    // Summary stats
    setAnalyticsData({
      totalVisitors: totalVisitors,
      pageViews: totalPageViews,
      avgSessionDuration: `${Math.floor(Math.random() * 3) + 2}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
      bounceRate: `${(Math.random() * 30 + 30).toFixed(1)}%`,
      revenue: Math.floor(Math.random() * 10000) + 5000,
      documentsGenerated: Math.floor(Math.random() * 2000) + 1000,
    });
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
            <p className="text-slate-600">Track your MintSlip performance and user engagement</p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border border-slate-200">
              <Calendar className="w-4 h-4 text-slate-500" />
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-transparent border-none text-sm focus:outline-none"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setIsAuthenticated(false)}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Total Visitors</p>
                  <p className="text-3xl font-bold" style={{ color: '#1a4731' }}>
                    {analyticsData.totalVisitors.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-700" />
                </div>
              </div>
              <p className="text-xs text-green-600 mt-2 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" /> +12.5% from last period
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Page Views</p>
                  <p className="text-3xl font-bold" style={{ color: '#1a4731' }}>
                    {analyticsData.pageViews.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Eye className="w-6 h-6 text-blue-700" />
                </div>
              </div>
              <p className="text-xs text-green-600 mt-2 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" /> +8.3% from last period
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Documents Generated</p>
                  <p className="text-3xl font-bold" style={{ color: '#1a4731' }}>
                    {analyticsData.documentsGenerated.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-700" />
                </div>
              </div>
              <p className="text-xs text-green-600 mt-2 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" /> +15.2% from last period
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-500">Revenue</p>
                  <p className="text-3xl font-bold" style={{ color: '#1a4731' }}>
                    ${analyticsData.revenue.toLocaleString()}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-yellow-700" />
                </div>
              </div>
              <p className="text-xs text-green-600 mt-2 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" /> +22.1% from last period
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Visitors Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg" style={{ color: '#1a4731' }}>Visitors Over Time</CardTitle>
              <CardDescription>Daily unique visitors</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={visitorData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748b" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="visitors" 
                    stroke="#059669" 
                    fill="#d1fae5" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Page Views Over Time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg" style={{ color: '#1a4731' }}>Page Views Over Time</CardTitle>
              <CardDescription>Daily page views</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={pageViewData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#64748b" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#64748b" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="pageViews" 
                    stroke="#1a4731" 
                    strokeWidth={2}
                    dot={{ fill: '#1a4731', strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
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
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={documentTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {documentTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Traffic Sources */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg" style={{ color: '#1a4731' }}>Traffic Sources</CardTitle>
              <CardDescription>Where your visitors come from</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trafficSourceData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="#64748b" />
                  <YAxis dataKey="source" type="category" tick={{ fontSize: 11 }} stroke="#64748b" width={100} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="visitors" fill="#059669" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Top Pages */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg" style={{ color: '#1a4731' }}>Top Pages</CardTitle>
              <CardDescription>Most visited pages</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topPagesData.map((page, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs font-semibold text-green-700">
                        {index + 1}
                      </span>
                      <span className="text-sm font-medium text-slate-700">{page.page}</span>
                    </div>
                    <span className="text-sm text-slate-500">{page.views.toLocaleString()} views</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <Activity className="w-8 h-8 text-green-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Avg. Session Duration</p>
              <p className="text-2xl font-bold" style={{ color: '#1a4731' }}>
                {analyticsData.avgSessionDuration}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-8 h-8 text-green-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Bounce Rate</p>
              <p className="text-2xl font-bold" style={{ color: '#1a4731' }}>
                {analyticsData.bounceRate}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 text-green-700 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Avg. Pages/Session</p>
              <p className="text-2xl font-bold" style={{ color: '#1a4731' }}>
                {(analyticsData.pageViews / Math.max(analyticsData.totalVisitors, 1)).toFixed(1)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Info Box */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-blue-800 mb-2">📊 Connect Real Google Analytics Data</h3>
            <p className="text-sm text-blue-700 mb-4">
              This dashboard currently shows sample data. To connect real Google Analytics data:
            </p>
            <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1">
              <li>Go to Google Cloud Console and create a project</li>
              <li>Enable the Google Analytics Data API</li>
              <li>Create OAuth credentials or a service account</li>
              <li>Use the GA4 property ID: <code className="bg-blue-100 px-1 rounded">G-L409EVV9LG</code></li>
              <li>Implement the Google Analytics Data API in this component</li>
            </ol>
          </CardContent>
        </Card>

      </div>
      <Footer />
    </div>
  );
}
