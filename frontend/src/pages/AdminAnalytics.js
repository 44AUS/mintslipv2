import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Lock, DollarSign, FileText, Activity, ExternalLink, Users } from "lucide-react";

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

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isIPAllowed, setIsIPAllowed] = useState(null);
  const [password, setPassword] = useState("");
  const [userIP, setUserIP] = useState("");

  // Check IP on mount
  useEffect(() => {
    checkIPAccess();
  }, []);

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

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      toast.success("Welcome to Admin Analytics!");
    } else {
      toast.error("Incorrect password");
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
            <p className="text-slate-600">Track your MintSlip performance via Google Analytics</p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <Button 
              variant="outline" 
              onClick={() => setIsAuthenticated(false)}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Google Analytics Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <a 
            href={`https://analytics.google.com/analytics/web/#/p${GA_PROPERTY_ID.replace('G-', '')}/reports/dashboard`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer border-green-200 bg-green-50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-green-800">GA4 Dashboard</p>
                  <p className="text-xs text-green-600">View full analytics</p>
                </div>
                <ExternalLink className="w-4 h-4 text-green-600" />
              </CardContent>
            </Card>
          </a>

          <a 
            href={`https://analytics.google.com/analytics/web/#/p${GA_PROPERTY_ID.replace('G-', '')}/reports/explorer?params=_u..nav%3Dmaui%26_r.explorerCard..startRow%3D0%26_r.explorerCard..selmet%3D%5B%22eventCount%22%5D%26_r.explorerCard..seldim%3D%5B%22eventName%22%5D`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">Events</p>
                  <p className="text-xs text-slate-500">Document tracking</p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </CardContent>
            </Card>
          </a>

          <a 
            href={`https://analytics.google.com/analytics/web/#/p${GA_PROPERTY_ID.replace('G-', '')}/reports/monetization-overview`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">Revenue</p>
                  <p className="text-xs text-slate-500">Monetization data</p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </CardContent>
            </Card>
          </a>

          <a 
            href={`https://analytics.google.com/analytics/web/#/p${GA_PROPERTY_ID.replace('G-', '')}/reports/realtime`}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">Realtime</p>
                  <p className="text-xs text-slate-500">Live visitors</p>
                </div>
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </CardContent>
            </Card>
          </a>
        </div>

        {/* Tracking Setup Info */}
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg text-green-800 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Event Tracking Active
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-green-700">
            <p className="mb-3">Your app is now tracking these events in Google Analytics:</p>
            <ul className="list-disc list-inside space-y-1 mb-4">
              <li><code className="bg-green-100 px-1 rounded">document_generated</code> - When a document is created after payment</li>
              <li><code className="bg-green-100 px-1 rounded">purchase</code> - Revenue tracking with document type and amount</li>
              <li><code className="bg-green-100 px-1 rounded">begin_checkout</code> - When payment is initiated</li>
            </ul>
            <p className="text-xs text-green-600">
              GA Property ID: <code className="bg-green-100 px-1 rounded">{GA_PROPERTY_ID}</code>
            </p>
          </CardContent>
        </Card>

        {/* How to View Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg" style={{ color: '#1a4731' }}>📊 View Document Stats</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-3">
              <p>To see document generation stats in GA4:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Go to <strong>Reports → Engagement → Events</strong></li>
                <li>Look for <code className="bg-slate-100 px-1 rounded">document_generated</code> event</li>
                <li>Click on it to see breakdown by document_type</li>
              </ol>
              <a 
                href={`https://analytics.google.com/analytics/web/#/p${GA_PROPERTY_ID.replace('G-', '')}/reports/explorer?params=_u..nav%3Dmaui%26_r.explorerCard..selmet%3D%5B%22eventCount%22%5D%26_r.explorerCard..seldim%3D%5B%22customEvent:document_type%22%5D&r=events-overview`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-green-600 hover:underline"
              >
                Open in GA4 <ExternalLink className="w-3 h-3" />
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg" style={{ color: '#1a4731' }}>💰 View Revenue Stats</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-slate-600 space-y-3">
              <p>To see revenue data in GA4:</p>
              <ol className="list-decimal list-inside space-y-2">
                <li>Go to <strong>Reports → Monetization → Overview</strong></li>
                <li>View total revenue and purchases</li>
                <li>Click <strong>Ecommerce purchases</strong> for item breakdown</li>
              </ol>
              <a 
                href={`https://analytics.google.com/analytics/web/#/p${GA_PROPERTY_ID.replace('G-', '')}/reports/monetization-overview`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-green-600 hover:underline"
              >
                Open in GA4 <ExternalLink className="w-3 h-3" />
              </a>
            </CardContent>
          </Card>
        </div>

        {/* Configuration Info */}
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg text-blue-800">⚙️ Configuration</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-blue-700 space-y-4">
            <div>
              <p className="font-semibold mb-2">To change the admin password:</p>
              <p>Edit <code className="bg-blue-100 px-1 rounded">/frontend/src/pages/AdminAnalytics.js</code></p>
              <p>Find line: <code className="bg-blue-100 px-1 rounded">const ADMIN_PASSWORD = "MintSlip2025!";</code></p>
            </div>
            <div>
              <p className="font-semibold mb-2">To add allowed IP addresses:</p>
              <p>Edit the same file, find the <code className="bg-blue-100 px-1 rounded">ALLOWED_IPS</code> array and add your IPs</p>
            </div>
            <div>
              <p className="font-semibold mb-2">To add tracking to other forms:</p>
              <p>Import and call <code className="bg-blue-100 px-1 rounded">trackDocumentGenerated()</code> from <code className="bg-blue-100 px-1 rounded">@/utils/analyticsTracker.js</code></p>
            </div>
          </CardContent>
        </Card>

        {/* File Location Reference */}
        <Card className="mt-6 bg-slate-100 border-slate-200">
          <CardContent className="p-4">
            <p className="text-sm text-slate-600">
              <strong>File locations:</strong><br/>
              • Analytics page: <code className="bg-slate-200 px-1 rounded text-xs">/frontend/src/pages/AdminAnalytics.js</code><br/>
              • Tracking utility: <code className="bg-slate-200 px-1 rounded text-xs">/frontend/src/utils/analyticsTracker.js</code>
            </p>
          </CardContent>
        </Card>

      </div>
      <Footer />
    </div>
  );
}
