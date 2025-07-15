"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Server, 
  Database, 
  Zap, 
  Clock, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Monitor,
  Cpu,
  HardDrive,
  Wifi,
  Settings,
  Download
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
    latency_distribution: Record<string, number>;
  };
  concurrency: {
    total_retries: number;
    serialization_conflicts: number;
    deadlock_recoveries: number;
    retry_rate: number;
  };
  system: {
    active_connections: number;
    peak_connections: number;
  };
  errors: Record<string, number>;
}

interface SystemHealth {
  status: string;
  issues: string[];
  last_updated: string;
  summary: {
    orders_per_second: number;
    avg_latency_ms: number;
    success_rate: number;
    active_orders: number;
  };
}

export default function AdminSystem() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchSystemData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchSystemData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const fetchSystemData = async () => {
    try {
      // Fetch system metrics
      const metricsRes = await fetch("http://localhost:8000/api/v1/system/metrics", {
        credentials: "include",
      });
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }

      // Fetch system health
      const healthRes = await fetch("http://localhost:8000/api/v1/system/health", {
        credentials: "include",
      });
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData);
      }

      setLastRefresh(new Date());
    } catch (error) {
      console.error("Failed to fetch system data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetMetrics = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/system/metrics/reset", {
        method: "POST",
        credentials: "include",
      });
      
      if (response.ok) {
        fetchSystemData();
      } else {
        alert("Failed to reset metrics");
      }
    } catch (error) {
      console.error("Failed to reset metrics:", error);
      alert("Failed to reset metrics");
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${seconds % 60}s`;
  };

  const getHealthStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "healthy":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Healthy</Badge>;
      case "warning":
      case "degraded":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Warning</Badge>;
      case "critical":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Critical</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 100) return "text-green-600";
    if (latency < 500) return "text-yellow-600";
    return "text-red-600";
  };

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 98) return "text-green-600";
    if (rate >= 95) return "text-yellow-600";
    return "text-red-600";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading system metrics...</div>
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
              <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
              <p className="text-gray-600 mt-2">Real-time system performance and health monitoring</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-500">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={autoRefresh ? "bg-green-50 border-green-200 text-green-700" : ""}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
                Auto Refresh: {autoRefresh ? "ON" : "OFF"}
              </Button>
              <Button variant="outline" size="sm" onClick={fetchSystemData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Now
              </Button>
            </div>
          </div>
        </div>

        {/* System Health Overview */}
        <Card className="border-0 shadow-sm mb-8">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Monitor className="w-5 h-5 text-gray-600" />
                System Health Overview
              </CardTitle>
              {health && getHealthStatusBadge(health.status)}
            </div>
          </CardHeader>
          <CardContent>
            {health ? (
              <div className="space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-4 gap-6">
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${getSuccessRateColor(health.summary.success_rate)}`}>
                      {health.summary.success_rate.toFixed(1)}%
                    </p>
                    <p className="text-sm text-gray-600">Success Rate</p>
                  </div>
                  <div className="text-center">
                    <p className={`text-2xl font-bold ${getLatencyColor(health.summary.avg_latency_ms)}`}>
                      {health.summary.avg_latency_ms.toFixed(0)}ms
                    </p>
                    <p className="text-sm text-gray-600">Avg Latency</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {health.summary.orders_per_second.toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-600">Orders/sec</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {health.summary.active_orders}
                    </p>
                    <p className="text-sm text-gray-600">Active Orders</p>
                  </div>
                </div>

                {/* Issues */}
                {health.issues.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                      <span className="font-semibold text-red-800">System Issues Detected</span>
                    </div>
                    <ul className="space-y-1">
                      {health.issues.map((issue, index) => (
                        <li key={index} className="text-sm text-red-700 flex items-center gap-2">
                          <span className="w-1 h-1 bg-red-600 rounded-full"></span>
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">No health data available</div>
            )}
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Trading Engine Performance */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                Trading Engine Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics ? (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">System Uptime</span>
                      <span className="text-sm font-bold text-gray-900">
                        {formatUptime(metrics.uptime_seconds)}
                      </span>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-gray-900">{metrics.orders.total.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Total Orders</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-gray-900">{metrics.trades.total.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">Total Trades</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Success Rate</span>
                      <span className={`text-sm font-bold ${getSuccessRateColor(metrics.orders.success_rate)}`}>
                        {metrics.orders.success_rate.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={metrics.orders.success_rate} className="h-2" />
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">No performance data available</div>
              )}
            </CardContent>
          </Card>

          {/* Latency Metrics */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                Latency Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className={`text-lg font-bold ${getLatencyColor(metrics.performance.avg_latency_ms)}`}>
                        {metrics.performance.avg_latency_ms.toFixed(0)}ms
                      </p>
                      <p className="text-sm text-gray-600">Average</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-lg font-bold ${getLatencyColor(metrics.performance.p95_latency_ms)}`}>
                        {metrics.performance.p95_latency_ms.toFixed(0)}ms
                      </p>
                      <p className="text-sm text-gray-600">95th %ile</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-lg font-bold ${getLatencyColor(metrics.performance.p99_latency_ms)}`}>
                        {metrics.performance.p99_latency_ms.toFixed(0)}ms
                      </p>
                      <p className="text-sm text-gray-600">99th %ile</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Latency Distribution</h4>
                    <div className="space-y-2">
                      {Object.entries(metrics.performance.latency_distribution).map(([range, count]) => (
                        <div key={range} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">{range}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ 
                                  width: `${Math.min(100, (count / Math.max(...Object.values(metrics.performance.latency_distribution))) * 100)}%` 
                                }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 min-w-[3rem] text-right">
                              {count}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">No latency data available</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Concurrency and System Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Concurrency Metrics */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Server className="w-5 h-5 text-purple-600" />
                Concurrency Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-gray-900">{metrics.concurrency.total_retries}</p>
                      <p className="text-sm text-gray-600">Total Retries</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-gray-900">{metrics.concurrency.retry_rate.toFixed(1)}%</p>
                      <p className="text-sm text-gray-600">Retry Rate</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Serialization Conflicts</span>
                      <span className="text-sm font-bold text-yellow-700">
                        {metrics.concurrency.serialization_conflicts}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">Deadlock Recoveries</span>
                      <span className="text-sm font-bold text-red-700">
                        {metrics.concurrency.deadlock_recoveries}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">No concurrency data available</div>
              )}
            </CardContent>
          </Card>

          {/* Database Connections */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Database className="w-5 h-5 text-green-600" />
                Database Connections
              </CardTitle>
            </CardHeader>
            <CardContent>
              {metrics ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-gray-900">{metrics.system.active_connections}</p>
                      <p className="text-sm text-gray-600">Active</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-gray-900">{metrics.system.peak_connections}</p>
                      <p className="text-sm text-gray-600">Peak</p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Connection Pool Usage</span>
                      <span className="text-sm font-bold text-gray-900">
                        {Math.round((metrics.system.active_connections / 50) * 100)}%
                      </span>
                    </div>
                    <Progress value={(metrics.system.active_connections / 50) * 100} className="h-2" />
                    <p className="text-xs text-gray-500 mt-1">Pool size: 50 connections</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">No connection data available</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Error Tracking */}
        {metrics && Object.keys(metrics.errors).length > 0 && (
          <Card className="border-0 shadow-sm mb-8">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Error Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(metrics.errors).map(([error, count]) => (
                  <div key={error} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="text-sm font-medium text-gray-700">{error}</span>
                    <Badge className="bg-red-100 text-red-800 border-red-200">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* System Actions */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="w-5 h-5 text-gray-600" />
              System Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button variant="outline" onClick={resetMetrics}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Metrics
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Metrics
              </Button>
              <Button variant="outline">
                <Database className="w-4 h-4 mr-2" />
                Database Status
              </Button>
              <Button variant="outline">
                <Activity className="w-4 h-4 mr-2" />
                View Logs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 