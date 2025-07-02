"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Clock, 
  Users, 
  DollarSign, 
  BarChart3, 
  Flame, 
  Star,
  ArrowRight,
  Activity,
  Target,
  Zap,
  Eye,
  ChevronRight
} from "lucide-react";

interface UserInfo {
  user_id: number;
  email: string;
  username: string;
  balance: number;
}

interface Market {
  market_id: number;
  title: string;
  description: string;
  category: string;
  image_url?: string;
  close_time: string;
  status: string;
  is_bookmarked: boolean;
  contracts: Array<{
    contract_id: number;
    title: string;
    yes_price: string;
    no_price: string;
    yes_volume: number;
    no_volume: number;
  }>;
}

interface Position {
  contract_id: number;
  contract_title: string;
  contract_side: string;
  quantity: number;
  avg_price: string;
  market_id: number;
  market_title: string;
}

interface Order {
  order_id: number;
  contract_id: number;
  side: string;
  contract_side: string;
  price: string;
  quantity: number;
  filled_quantity: number;
  status: string;
  created_at: string;
  contract: {
    title: string;
    market: {
      market_id: number;
      title: string;
      category: string;
    };
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
    // Fetch user data
        const userRes = await fetch("http://localhost:8000/api/v1/users/me", { credentials: "include" });
        if (!userRes.ok) throw new Error("Not authenticated");
        const userData = await userRes.json();
        setUser(userData);

        // Fetch trending markets
        const marketsRes = await fetch("http://localhost:8000/api/v1/markets/", { credentials: "include" });
        if (marketsRes.ok) {
          const marketsData = await marketsRes.json();
          setMarkets(marketsData.slice(0, 6)); // Show top 6 markets
        }

        // Fetch user positions
        const positionsRes = await fetch("http://localhost:8000/api/v1/users/positions", { credentials: "include" });
        if (positionsRes.ok) {
          const positionsData = await positionsRes.json();
          setPositions(positionsData.slice(0, 4)); // Show top 4 positions
        }

        // Fetch user orders
        const ordersRes = await fetch("http://localhost:8000/api/v1/orders/", { credentials: "include" });
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData.filter((order: Order) => order.status === 'open' || order.status === 'partially_filled').slice(0, 3));
        }

      } catch (err) {
        if (err instanceof Error && err.message === 'Not authenticated') {
        router.push("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const formatTimeRemaining = (closeTime: string) => {
    const now = new Date();
    const close = new Date(closeTime);
    const diff = close.getTime() - now.getTime();
    
    if (diff <= 0) return "Closed";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes}m`;
  };

  const getMarketPrice = (contract: any) => {
    if (contract.yes_price && contract.yes_price !== "No price") {
      return parseInt(contract.yes_price.replace('¢', ''));
    }
    return null;
  };

  const getTotalPortfolioValue = () => {
    return positions.reduce((total, position) => {
      const currentValue = position.quantity * 1.0; // Assuming $1 max payout
      return total + currentValue;
    }, 0);
  };

  const getTotalPnL = () => {
    return positions.reduce((total, position) => {
      const currentValue = position.quantity * 1.0;
      const costBasis = position.quantity * parseFloat(position.avg_price);
      return total + (currentValue - costBasis);
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="flex items-center justify-center py-12">
          <div className="text-lg text-gray-500">Loading your dashboard...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const portfolioValue = getTotalPortfolioValue();
  const totalPnL = getTotalPnL();
  const isProfitable = totalPnL >= 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Welcome back, {user.username}!</h1>
              <p className="text-blue-100 text-lg">Starting trading on the college betting app</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">${(user.balance / 100).toFixed(2)}</div>
              <div className="text-blue-200">Available Balance</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Portfolio Value</p>
                  <p className="text-2xl font-bold text-gray-900">${portfolioValue.toFixed(2)}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total P&L</p>
                  <p className={`text-2xl font-bold ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                    {isProfitable ? '+' : ''}${totalPnL.toFixed(2)}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isProfitable ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <TrendingUp className={`w-6 h-6 ${isProfitable ? 'text-green-600' : 'text-red-600'}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
              <div>
                  <p className="text-sm font-medium text-gray-600">Active Positions</p>
                  <p className="text-2xl font-bold text-gray-900">{positions.length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
              <div>
                  <p className="text-sm font-medium text-gray-600">Open Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Trending Markets */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <Flame className="w-4 h-4 text-white" />
                    </div>
                    <CardTitle className="text-xl">Trending Markets</CardTitle>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => router.push("/markets")}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    View All <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <p className="text-gray-600">Hot markets with high activity</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {markets.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No markets available</p>
                    <p className="text-sm mt-1">Check back later for new prediction markets!</p>
                  </div>
                ) : (
                  markets.map((market) => (
                    <div 
                      key={market.market_id}
                      onClick={() => router.push(`/markets/${market.market_id}`)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                              {market.category}
                            </Badge>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Clock className="w-3 h-3" />
                              <span>{formatTimeRemaining(market.close_time)}</span>
                            </div>
                          </div>
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                            {market.title}
                          </h3>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                      </div>
                      
                      {market.contracts.length > 0 && (
                        <div className="grid grid-cols-2 gap-2">
                          {market.contracts.slice(0, 2).map((contract) => {
                            const yesPrice = getMarketPrice(contract);
                            return (
                              <div key={contract.contract_id} className="text-center">
                                <div className="text-xs text-gray-600 mb-1 truncate">{contract.title}</div>
                                <div className="flex gap-1">
                                  <div className="flex-1 bg-green-50 border border-green-200 rounded px-2 py-1">
                                    <div className="text-xs font-medium text-green-700">YES</div>
                                    <div className="text-sm font-bold text-green-800">
                                      {yesPrice ? `${yesPrice}¢` : "No price"}
                                    </div>
                                  </div>
                                  <div className="flex-1 bg-red-50 border border-red-200 rounded px-2 py-1">
                                    <div className="text-xs font-medium text-red-700">NO</div>
                                    <div className="text-sm font-bold text-red-800">
                                      {yesPrice ? `${100 - yesPrice}¢` : "No price"}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <Zap className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle className="text-xl">Quick Actions</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={() => router.push("/markets")}
                    className="h-20 flex flex-col items-center justify-center bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <BarChart3 className="w-6 h-6 mb-2" />
                    <span className="font-semibold">Browse Markets</span>
                  </Button>
                  <Button 
                    onClick={() => router.push("/ideas")}
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center border-2 hover:bg-gray-50"
                  >
                    <Star className="w-6 h-6 mb-2" />
                    <span className="font-semibold">Submit Ideas</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Portfolio & Activity */}
          <div className="space-y-6">
            {/* Your Positions */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <CardTitle className="text-lg">Your Positions</CardTitle>
                  </div>
                  {positions.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => router.push(`/profile/${user.username}`)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      View All
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {positions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Target className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No positions yet</p>
                    <p className="text-sm mt-1">Start trading to see your positions here</p>
                  </div>
                ) : (
                  positions.map((position, index) => {
                    const currentValue = position.quantity * 1.0;
                    const costBasis = position.quantity * parseFloat(position.avg_price);
                    const pnl = currentValue - costBasis;
                    const isProfit = pnl >= 0;
                    
                    return (
                      <div 
                        key={`${position.contract_id}-${position.contract_side}`}
                        onClick={() => router.push(`/markets/${position.market_id}`)}
                        className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                            position.contract_side === 'YES' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {position.contract_side}
                          </span>
                          <span className={`text-sm font-semibold ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                            {isProfit ? '+' : ''}${pnl.toFixed(2)}
                          </span>
                        </div>
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                          {position.contract_title}
                        </h4>
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>{position.quantity} shares</span>
                          <span>Avg: ${parseFloat(position.avg_price).toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Open Orders */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle className="text-lg">Open Orders</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {orders.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No open orders</p>
                    <p className="text-sm mt-1">Your pending orders will appear here</p>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div 
                      key={order.order_id}
                      onClick={() => router.push(`/markets/${order.contract.market.market_id}`)}
                      className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                          order.side === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {order.side} {order.contract_side}
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {order.status}
                        </Badge>
                      </div>
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">
                        {order.contract.title}
                      </h4>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{order.filled_quantity}/{order.quantity} filled</span>
                        <span>${parseFloat(order.price).toFixed(2)}</span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Market Activity */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  <CardTitle className="text-lg">Market Activity</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Total Markets</span>
                    <span className="font-semibold text-gray-900">{markets.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Categories</span>
                    <span className="font-semibold text-gray-900">
                      {new Set(markets.map(m => m.category)).size}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Your Participation</span>
                    <span className="font-semibold text-gray-900">
                      {positions.length + orders.length} active
                    </span>
              </div>
            </div>
          </CardContent>
        </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 