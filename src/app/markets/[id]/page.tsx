"use client";

import { config } from "@/lib/config";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ChevronDown, TrendingUp, Clock, Users, DollarSign, BarChart3, FileText, Bookmark, Share2, TrendingDown } from "lucide-react";
import { PriceChart } from "@/components/price-chart";
import type { UserInfo, Contract, Position } from "@/lib/types";

interface MarketDetails {
  market_id: number;
  title: string;
  description: string;
  category: string;
  image_url?: string;
  start_time: string;
  close_time: string;
  resolve_time?: string;
  status: string;
  is_bookmarked: boolean;
  contracts: Contract[];
}

interface PriceHistoryData {
  market_id: number;
  market_title: string;
  contracts: Array<{
    contract_id: number;
    title: string;
    description?: string;
    price_history: Array<{
      timestamp: string;
      price: number;
      volume: number;
    }>;
  }>;
}

export default function MarketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const marketId = params?.id as string;

  const [market, setMarket] = useState<MarketDetails | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [selectedSide, setSelectedSide] = useState<"YES" | "NO" | null>(null);
  const [userPositions, setUserPositions] = useState<Position[]>([]);
  const [priceHistory, setPriceHistory] = useState<PriceHistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Trading state
  const [tradeType, setTradeType] = useState<"BUY" | "SELL">("BUY");
  const [tradePrice, setTradePrice] = useState<string>("");
  const [tradeQuantity, setTradeQuantity] = useState<string>("");
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Fetch all data
  const fetchData = async () => {
    try {
      // Fetch user info
      const userRes = await fetch(`${config.apiUrl}/api/v1/users/me`, {
        credentials: "include",
      });
      if (userRes.ok) {
        const userData = await userRes.json();
        setUserInfo(userData);
      }

      // Fetch market details
      const marketRes = await fetch(`${config.apiUrl}/api/v1/markets/${marketId}`, {
        credentials: "include",
      });
      if (!marketRes.ok) throw new Error("Failed to fetch market details");
      const marketData = await marketRes.json();
      setMarket(marketData);

      // Fetch price history
      const priceHistoryRes = await fetch(`${config.apiUrl}/api/v1/markets/${marketId}/price-history`, {
        credentials: "include",
      });
      if (priceHistoryRes.ok) {
        const priceHistoryData = await priceHistoryRes.json();
        setPriceHistory(priceHistoryData);
      }

      // Fetch user positions for this market
      const positionsRes = await fetch(`${config.apiUrl}/api/v1/users/positions?market_id=${marketId}`, {
        credentials: "include",
      });
      if (positionsRes.ok) {
        const positionsData = await positionsRes.json();
        setUserPositions(positionsData);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (marketId) {
      fetchData();
    }
  }, [marketId]);

  // Reset form when switching contracts or sides
  useEffect(() => {
    setSelectedPosition(null);
    setTradeQuantity("");
    setTradePrice("");
  }, [selectedContract, selectedSide, tradeType]);

  const handlePlaceOrder = async () => {
    if (!selectedContract || !selectedSide || !tradePrice || !tradeQuantity) {
      alert("Please fill in all fields and select a contract side");
      return;
    }

    const price = parseFloat(tradePrice);
    const quantity = parseInt(tradeQuantity);

    if (price < 0.01 || price > 0.99) {
      alert("Price must be between $0.01 and $0.99");
      return;
    }

    if (quantity < 1) {
      alert("Quantity must be at least 1");
      return;
    }

    // For sell orders, validate against selected position
    if (tradeType === "SELL") {
      if (!selectedPosition) {
        alert("Please select a position to sell");
        return;
      }
      
      if (quantity > selectedPosition.quantity) {
        alert(`You only have ${selectedPosition.quantity} contracts to sell`);
        return;
      }
    }

    setIsPlacingOrder(true);

    try {
      const response = await fetch(`${config.apiUrl}/api/v1/markets/${marketId}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          contract_id: selectedContract.contract_id,
          side: tradeType,
          contract_side: selectedSide,
          order_type: "limit",
          price: price,
          quantity: quantity,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to place order");
      }

      // Reset form and refresh data
      setTradePrice("");
      setTradeQuantity("");
      setSelectedPosition(null);
      alert(`${tradeType} order for ${selectedSide} placed successfully!`);
      fetchData(); // Refresh all data

    } catch (err) {
      console.error("Failed to place order:", err);
      alert(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const getUserPositionsForContract = (contractId: number, contractSide: "YES" | "NO") => {
    return userPositions.filter(p => p.contract_id === contractId && p.contract_side === contractSide);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getTimeRemaining = (closeTime: string) => {
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

  const getCurrentPrice = (contract: Contract, side: "YES" | "NO") => {
    const stats = side === "YES" ? contract.yes_stats : contract.no_stats;
    if (!stats) return null;
    
    // For YES/NO buttons, use best_ask_price (lowest active sell order for this side)
    if (stats.best_ask_price !== undefined && stats.best_ask_price !== null) {
      return stats.best_ask_price;
    }
    return null;
  };

  const formatPrice = (price: number) => {
    return `${Math.round(price * 100)}¢`;
  };

  const getPriceDisplay = (contract: Contract, side: "YES" | "NO") => {
    const price = getCurrentPrice(contract, side);
    return price !== null ? formatPrice(price) : "No price";
  };

  const handleContractSideSelect = (contract: Contract, side: "YES" | "NO") => {
    setSelectedContract(contract);
    setSelectedSide(side);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={userInfo} />
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading market details...</div>
        </div>
      </div>
    );
  }

  if (error || !market) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={userInfo} />
        <div className="flex items-center justify-center py-12">
          <div className="text-red-500">Error: {error || "Market not found"}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={userInfo} />
      
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-start gap-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full hover:bg-gray-100 mt-1"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                {market.image_url ? (
                  <img
                    src={`${config.apiUrl}${market.image_url}`}
                    alt={market.title}
                    className="w-16 h-16 rounded-lg object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                    <span className="text-gray-400 text-2xl font-bold">
                      {market.category?.charAt(0) || "M"}
                    </span>
                  </div>
                )}
                <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200">
                  {market.category}
                </Badge>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{getTimeRemaining(market.close_time)} remaining</span>
                  </div>
                  <span>Closes {formatDate(market.close_time)}</span>
                </div>
              </div>
              
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{market.title}</h1>
              <p className="text-gray-600 max-w-3xl">{market.description}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Bookmark className="w-4 h-4" />
                Save
              </Button>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Chart and Contract List */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Price Chart */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-gray-600" />
                  <CardTitle className="text-lg">
                    {selectedContract && selectedSide 
                      ? `${selectedContract.title} - YES Price History`
                      : "YES Price History - All Contracts"
                    }
                  </CardTitle>
                </div>
                <p className="text-sm text-gray-600">
                  {selectedContract 
                    ? `Tracking YES price for ${selectedContract.title}. NO price = 100¢ - YES price.`
                    : "Showing YES prices for all contracts. Select a contract to highlight its line."
                  }
                </p>
              </CardHeader>
              <CardContent>
                {priceHistory ? (
                  <PriceChart 
                    contracts={priceHistory.contracts}
                    selectedContract={selectedContract ? 
                      priceHistory.contracts.find(c => c.contract_id === selectedContract.contract_id) || null 
                      : null
                    }
                  />
                ) : (
                  <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                    <div className="text-center text-gray-500">
                      <TrendingUp className="w-10 h-10 mx-auto mb-2 text-gray-400" />
                      <p className="font-medium">Loading Price Chart...</p>
                      <p className="text-sm">Fetching historical price data</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contract Options List */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Contract Options</CardTitle>
                <p className="text-sm text-gray-600">
                  Select YES or NO for any contract to start trading
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {market.contracts.map((contract) => (
                    <div key={contract.contract_id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 mb-1">{contract.title}</h3>
                          {contract.description && (
                            <p className="text-sm text-gray-600">{contract.description}</p>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3 ml-6">
                          <button
                            onClick={() => handleContractSideSelect(contract, "YES")}
                            className={`px-4 py-2 rounded-lg border-2 transition-all min-w-[80px] ${
                              selectedContract?.contract_id === contract.contract_id && selectedSide === "YES"
                                ? "border-gray-600 bg-gray-50 text-gray-900"
                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                            }`}
                          >
                            <div className="text-center">
                              <div className="font-semibold">YES</div>
                              <div className="text-sm">
                                {getPriceDisplay(contract, "YES")}
                              </div>
                            </div>
                          </button>
                          
                          <button
                            onClick={() => handleContractSideSelect(contract, "NO")}
                            className={`px-4 py-2 rounded-lg border-2 transition-all min-w-[80px] ${
                              selectedContract?.contract_id === contract.contract_id && selectedSide === "NO"
                                ? "border-gray-600 bg-gray-50 text-gray-900"
                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                            }`}
                          >
                            <div className="text-center">
                              <div className="font-semibold">NO</div>
                              <div className="text-sm">
                                {getPriceDisplay(contract, "NO")}
                              </div>
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Market Information */}
            <Card className="border-0 shadow-sm">
              <Tabs defaultValue="details" className="w-full">
                <div className="border-b border-gray-200">
                  <TabsList className="bg-transparent h-auto p-0 space-x-0 w-full justify-start">
                    <TabsTrigger 
                      value="details" 
                      className="bg-transparent border-0 rounded-none px-6 py-4 text-gray-600 font-medium relative data-[state=active]:bg-transparent data-[state=active]:text-gray-900 data-[state=active]:font-semibold hover:text-gray-900 transition-colors data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-blue-500"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Market Rules
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="details" className="p-6 space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-3">Market Description</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {market.description}
                    </p>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Available Contracts</h3>
                    <div className="space-y-3">
                      {market.contracts.map((contract) => (
                        <div key={contract.contract_id} className="p-4 bg-gray-50 rounded-lg">
                          <div className="font-medium text-gray-900 mb-1">{contract.title}</div>
                          {contract.description && (
                            <div className="text-sm text-gray-600">{contract.description}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-100 pt-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Important Dates</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Market Opens:</span>
                        <div className="font-medium">{formatDate(market.start_time)}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Trading Closes:</span>
                        <div className="font-medium">{formatDate(market.close_time)}</div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>

          {/* Right Column - Trading Interface */}
          <div className="space-y-6">
            
            {/* Trading Card */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-green-600" />
                  Place Order
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {selectedContract && selectedSide
                    ? `Trading ${selectedSide} on "${selectedContract.title}"`
                    : "Select a contract option to start trading"
                  }
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {!selectedContract || !selectedSide ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-2">Select a contract option to start trading</p>
                    <p className="text-sm">Choose YES or NO for any contract above</p>
                  </div>
                ) : (
                  <>
                    {/* Buy/Sell Toggle */}
                    <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50">
                      <button
                        onClick={() => setTradeType("BUY")}
                        className={`flex-1 py-3 px-4 text-sm font-semibold rounded-md transition-all ${
                          tradeType === "BUY"
                            ? "bg-black text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Buy {selectedSide}
                      </button>
                      <button
                        onClick={() => setTradeType("SELL")}
                        className={`flex-1 py-3 px-4 text-sm font-semibold rounded-md transition-all ${
                          tradeType === "SELL"
                            ? "bg-gray-800 text-white shadow-sm"
                            : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        Sell {selectedSide}
                      </button>
                    </div>

                    {/* Position Selection for Sell Orders */}
                    {tradeType === "SELL" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select position to sell
                        </label>
                        <div className="relative">
                          <select
                            value={selectedPosition?.contract_id || ""}
                            onChange={(e) => {
                              const contractId = parseInt(e.target.value);
                              const position = userPositions.find(p => 
                                p.contract_id === contractId && 
                                p.contract_side === selectedSide
                              );
                              setSelectedPosition(position || null);
                            }}
                            className="w-full p-3 border border-gray-300 rounded-lg bg-white appearance-none pr-10 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Choose a position...</option>
                            {getUserPositionsForContract(selectedContract.contract_id, selectedSide).map((position) => (
                              <option key={`${position.contract_id}-${position.contract_side}`} value={position.contract_id}>
                                {position.contract_side} - {position.quantity} shares @ ${parseFloat(position.avg_price).toFixed(2)}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                        </div>
                        {getUserPositionsForContract(selectedContract.contract_id, selectedSide).length === 0 && (
                          <p className="text-sm text-red-500 mt-2">
                            You don't have any {selectedSide} positions for this contract
                          </p>
                        )}
                      </div>
                    )}

                    {/* Price Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Price per share
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          max="0.99"
                          value={tradePrice}
                          onChange={(e) => setTradePrice(e.target.value)}
                          placeholder="0.50"
                          className="pl-8 py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Between $0.01 and $0.99</p>
                    </div>

                    {/* Quantity Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of shares
                      </label>
                      <Input
                        type="number"
                        min="1"
                        max={tradeType === "SELL" ? selectedPosition?.quantity || 0 : undefined}
                        value={tradeQuantity}
                        onChange={(e) => setTradeQuantity(e.target.value)}
                        placeholder="100"
                        className="py-3 text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      {tradeType === "SELL" && selectedPosition && (
                        <p className="text-xs text-gray-500 mt-1">
                          Available: {selectedPosition.quantity} shares
                        </p>
                      )}
                    </div>

                    {/* Order Summary */}
                    {tradePrice && tradeQuantity && (
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-3">Order Summary</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Contract:</span>
                            <span className="font-semibold text-gray-900">{selectedContract.title}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Side:</span>
                            <span className="font-semibold text-gray-900">{selectedSide}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total {tradeType === "BUY" ? "cost" : "value"}:</span>
                            <span className="font-semibold text-gray-900">
                              ${(parseFloat(tradePrice) * parseInt(tradeQuantity)).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Est. max payout:</span>
                            <span className="font-semibold text-green-600">
                              ${parseInt(tradeQuantity || "0").toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Place Order Button */}
                    <Button
                      onClick={handlePlaceOrder}
                      disabled={
                        isPlacingOrder || 
                        !tradePrice || 
                        !tradeQuantity || 
                        (tradeType === "SELL" && !selectedPosition)
                      }
                      className={`w-full py-3 text-lg font-semibold ${
                        tradeType === "BUY" 
                          ? "bg-black hover:bg-gray-800" 
                          : "bg-gray-800 hover:bg-gray-700"
                      } text-white`}
                    >
                      {isPlacingOrder 
                        ? "Placing Order..." 
                        : `${tradeType} ${selectedSide}`
                      }
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Order Book */}
            {selectedContract && selectedSide && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">
                    Order Book - {selectedContract.title} ({selectedSide})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(() => {
                      const stats = selectedSide === "YES" ? selectedContract.yes_stats : selectedContract.no_stats;
                      const orderBook = stats?.order_book;
                      
                      if (!orderBook) {
                        return <div className="text-center text-gray-500 py-4">No order book data available</div>;
                      }

                      return (
                        <>
                          {/* Asks (Sell orders) */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-600 mb-3">Sell Orders</h4>
                            <div className="space-y-1">
                              {orderBook.asks.length === 0 ? (
                                <div className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                                  No sell orders
                                </div>
                              ) : (
                                orderBook.asks.slice(0, 5).map((ask, index) => (
                                  <div key={index} className="flex justify-between items-center bg-gray-50 px-4 py-3 rounded-lg border border-gray-200">
                                    <span className="font-semibold text-gray-900">${parseFloat(ask.price).toFixed(2)}</span>
                                    <span className="text-gray-700 font-medium">{ask.quantity.toLocaleString()}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Spread */}
                          <div className="border-t border-b border-gray-200 py-3">
                            <div className="text-center space-y-1">
                              <div className="text-sm font-medium text-gray-600">
                                {orderBook.bids.length > 0 && orderBook.asks.length > 0 ? (
                                  `Spread: ${formatPrice(parseFloat(orderBook.asks[0].price) - parseFloat(orderBook.bids[0].price))}`
                                ) : (
                                  "No spread available"
                                )}
                              </div>
                              {stats?.market_price !== undefined && stats.market_price !== null && (
                                <div className="text-xs text-gray-600">
                                  Market Price: {formatPrice(stats.market_price)}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Bids (Buy orders) */}
                          <div>
                            <h4 className="text-sm font-semibold text-gray-600 mb-3">Buy Orders</h4>
                            <div className="space-y-1">
                              {orderBook.bids.length === 0 ? (
                                <div className="text-sm text-gray-500 text-center py-4 bg-gray-50 rounded-lg">
                                  No buy orders
                                </div>
                              ) : (
                                orderBook.bids.slice(0, 5).map((bid, index) => (
                                  <div key={index} className="flex justify-between items-center bg-gray-100 px-4 py-3 rounded-lg border border-gray-200">
                                    <span className="font-semibold text-gray-900">${parseFloat(bid.price).toFixed(2)}</span>
                                    <span className="text-gray-700 font-medium">{bid.quantity.toLocaleString()}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* User Positions */}
            {userPositions.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg">Your Positions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {userPositions.map((position, index) => (
                      <div key={`${position.contract_id}-${position.contract_side}`} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <div className="font-semibold text-gray-900">{position.contract_title}</div>
                          <div className="text-sm text-gray-600">
                            {position.contract_side} - Avg price: ${parseFloat(position.avg_price).toFixed(2)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">{position.quantity}</div>
                          <div className="text-sm text-gray-600">shares</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 