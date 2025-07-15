"use client";

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

interface DashboardStats {
  total_users: number;
  active_users: number;
  total_markets: number;
  active_markets: number;
  total_volume: number;
  total_trades: number;
}

export default function AdminDashboard() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch system metrics (existing endpoint)
        const metricsRes = await fetch("http://localhost:8000/api/v1/system/performance/summary", {
          credentials: "include",
        });
        if (metricsRes.ok) {
          const metricsData = await metricsRes.json();
          setSystemMetrics(metricsData);
        }

        // For now, we'll create mock data for dashboard stats
        // These would be real API calls in production
        setDashboardStats({
          total_users: 1250,
          active_users: 340,
          total_markets: 45,
          active_markets: 23,
          total_volume: 125000,
          total_trades: 5600,
        });

        setRecentActivity([
          { type: "market_created", message: "New market created: 'Harvard Basketball Championship'", time: "2 minutes ago", user: "admin" },
          { type: "user_registered", message: "New user registered: john_doe@college.harvard.edu", time: "5 minutes ago", user: "system" },
          { type: "market_resolved", message: "Market resolved: 'Next Student Body President'", time: "15 minutes ago", user: "admin" },
          { type: "high_volume", message: "High trading volume detected on 'Finals Week Stress'", time: "1 hour ago", user: "system" },
        ]);

      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
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

  const getSystemStatusBadge = () => {
    if (!systemMetrics) return <Badge variant="secondary">Loading...</Badge>;
    
    const successRate = systemMetrics.orders?.success_rate || 0;
    const avgLatency = systemMetrics.performance?.avg_latency_ms || 0;
    
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
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Settings className="w-4 h-4 mr-2" />
                System Settings
              </Button>
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
                    {systemMetrics ? `${systemMetrics.orders.success_rate.toFixed(1)}%` : "---"}
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
                    {systemMetrics ? `${systemMetrics.performance.avg_latency_ms.toFixed(0)}ms` : "---"}
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
                    {systemMetrics ? systemMetrics.orders.active.toLocaleString() : "---"}
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
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats?.total_users.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-green-600 text-sm">
                      <ArrowUpRight className="w-4 h-4 mr-1" />
                      +12%
                    </div>
                    <p className="text-xs text-gray-500">vs last month</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Active Users (30d)</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats?.active_users.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-green-600 text-sm">
                      <ArrowUpRight className="w-4 h-4 mr-1" />
                      +8%
                    </div>
                    <p className="text-xs text-gray-500">vs last month</p>
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
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats?.total_markets}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-blue-600 text-sm">
                      <ArrowUpRight className="w-4 h-4 mr-1" />
                      +3 this week
                    </div>
                    <p className="text-xs text-gray-500">New markets</p>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Active Markets</p>
                    <p className="text-2xl font-bold text-gray-900">{dashboardStats?.active_markets}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-orange-600 text-sm">
                      <ArrowDownRight className="w-4 h-4 mr-1" />
                      -2 resolved
                    </div>
                    <p className="text-xs text-gray-500">This week</p>
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
                    ${dashboardStats?.total_volume.toLocaleString()}
                  </p>
                  <p className="text-sm text-green-600 mt-2">+15% from last month</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">{dashboardStats?.total_trades.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Total Trades</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-lg font-bold text-gray-900">
                      {systemMetrics ? systemMetrics.trades.rate_per_second.toFixed(2) : "0.00"}
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
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center border">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 font-medium">{activity.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">{activity.time}</p>
                        <span className="text-xs text-gray-300">•</span>
                        <p className="text-xs text-gray-500">by {activity.user}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 