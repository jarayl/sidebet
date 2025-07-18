"use client";

import { config } from "@/lib/config";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  BarChart3, 
  Clock, 
  AlertCircle,
  CheckCircle,
  XCircle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Settings,
  Database
} from "lucide-react";

interface SystemMetrics {
  uptime_seconds: number;
  orders: {
    total: number;
    successful: number;
    failed: number;
    success_rate: number;
    active: number;
  };
  trades: {
    total: number;
    volume: number;
    rate_per_second: number;
  };
  performance: {
    avg_latency_ms: number;
    p95_latency_ms: number;
    p99_latency_ms: number;
  };
  concurrency: {
    total_retries: number;
    retry_rate: number;
  };
}

interface DashboardOverview {
  users: {
    total: number;
    active: number;
    recent_24h: number;
  };
  markets: {
    total: number;
    active: number;
    recent_24h: number;
  };
  trading: {
    total_trades: number;
    total_orders: number;
    active_orders: number;
    recent_trades_24h: number;
    total_volume: number;
    total_balance: number;
  };
}

interface RecentActivity {
  type: string;
  message: string;
  timestamp: string;
  user: string;
  details?: Record<string, any>;
}

export default function AdminDashboard() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [dashboardOverview, setDashboardOverview] = useState<DashboardOverview | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError(null);
        
        // Fetch all data in parallel
        const [systemRes, overviewRes, activityRes] = await Promise.all([
          fetch(`${config.apiUrl}/api/v1/system/performance/summary`, {
            credentials: "include",
          }),
          fetch(`${config.apiUrl}/api/v1/admin/dashboard/overview`, {
            credentials: "include",
          }),
          fetch(`${config.apiUrl}/api/v1/admin/activity/recent?limit=3`, {
            credentials: "include",
          })
        ]);

        if (systemRes.ok) {
          const systemData = await systemRes.json();
          setSystemMetrics(systemData);
        } else {
          console.error("Failed to fetch system metrics:", await systemRes.text());
        }

        if (overviewRes.ok) {
          const overviewData = await overviewRes.json();
          setDashboardOverview(overviewData);
        } else {
          console.error("Failed to fetch dashboard overview:", await overviewRes.text());
        }

        if (activityRes.ok) {
          const activityData = await activityRes.json();
          setRecentActivity(activityData);
        } else {
          console.error("Failed to fetch recent activity:", await activityRes.text());
        }

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setError("Failed to load dashboard data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const getSystemStatusBadge = () => {
    if (!systemMetrics || !dashboardOverview) return <Badge variant="secondary">Loading...</Badge>;
    
    const successRate = systemMetrics.orders?.success_rate ?? 0;
    const avgLatency = systemMetrics.performance?.avg_latency_ms ?? 0;
    
    if (successRate >= 98 && avgLatency < 100) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Healthy</Badge>;
    } else if (successRate >= 95 && avgLatency < 500) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Warning</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Critical</Badge>;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "market_created":
        return <Plus className="w-4 h-4 text-green-600" />;
      case "user_registered":
        return <Users className="w-4 h-4 text-blue-600" />;
      case "market_resolved":
        return <CheckCircle className="w-4 h-4 text-purple-600" />;
      case "high_volume":
        return <TrendingUp className="w-4 h-4 text-orange-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <div className="text-lg text-gray-900 mb-2">Error Loading Dashboard</div>
          <div className="text-gray-600 mb-4">{error}</div>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-2">Monitor system performance and manage your platform</p>
            </div>
            <div className="flex items-center gap-4">
              {getSystemStatusBadge()}
            </div>
          </div>
        </div>

        {/* System Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">System Uptime</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {systemMetrics ? formatUptime(systemMetrics.uptime_seconds) : "---"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Last restart</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {systemMetrics?.orders ? `${systemMetrics.orders.success_rate.toFixed(1)}%` : "---"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Order success</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Latency</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {systemMetrics?.performance ? `${systemMetrics.performance.avg_latency_ms.toFixed(0)}ms` : "---"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Response time</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Orders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardOverview?.trading ? dashboardOverview.trading.active_orders.toLocaleString() : "---"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">In progress</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                User Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardOverview?.users?.total?.toLocaleString() ?? "---"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-green-600 text-sm">
                      <ArrowUpRight className="w-4 h-4 mr-1" />
                      +{dashboardOverview?.users?.recent_24h ?? 0}
                    </div>
                    <p className="text-xs text-gray-500">last 24h</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardOverview?.users?.active?.toLocaleString() ?? "---"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-blue-600 text-sm">
                      <Activity className="w-4 h-4 mr-1" />
                      {dashboardOverview?.users ? 
                        `${((dashboardOverview.users.active / dashboardOverview.users.total) * 100).toFixed(1)}%` : 
                        "---"
                      }
                    </div>
                    <p className="text-xs text-gray-500">active rate</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Market Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Total Markets</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardOverview?.markets?.total ?? "---"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-blue-600 text-sm">
                      <ArrowUpRight className="w-4 h-4 mr-1" />
                      +{dashboardOverview?.markets?.recent_24h ?? 0}
                    </div>
                    <p className="text-xs text-gray-500">last 24h</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Active Markets</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {dashboardOverview?.markets?.active ?? "---"}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-green-600 text-sm">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      {dashboardOverview?.markets ? 
                        `${((dashboardOverview.markets.active / dashboardOverview.markets.total) * 100).toFixed(1)}%` : 
                        "---"
                      }
                    </div>
                    <p className="text-xs text-gray-500">active rate</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trading Volume and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-600" />
                Trading Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border">
                  <p className="text-sm text-gray-600 mb-2">Total Trading Volume</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {dashboardOverview?.trading ? formatCurrency(dashboardOverview.trading.total_volume) : "---"}
                  </p>
                  <p className="text-sm text-green-600 mt-2">
                    {dashboardOverview?.trading?.recent_trades_24h ?? 0} trades in last 24h
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">
                      {dashboardOverview?.trading?.total_trades?.toLocaleString() ?? "---"}
                    </p>
                    <p className="text-sm text-gray-600">Total Trades</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">
                      {systemMetrics?.trades ? systemMetrics.trades.rate_per_second.toFixed(2) : "---"}
                    </p>
                    <p className="text-sm text-gray-600">Trades/sec</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-gray-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    <Activity className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No recent activity</p>
                  </div>
                ) : (
                  recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 font-medium">{activity.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</p>
                          <span className="text-xs text-gray-300">•</span>
                          <p className="text-xs text-gray-500">by {activity.user}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 