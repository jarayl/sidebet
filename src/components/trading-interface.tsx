"use client";

import { config } from "@/lib/config";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Contract {
  contract_id: number;
  outcome: string;
  initial_price: string;
  order_book: {
    bids: Array<{ price: string; quantity: number }>;
    asks: Array<{ price: string; quantity: number }>;
  };
}

interface TradingInterfaceProps {
  marketId: number;
  contracts: Contract[];
  userBalance: number;
  onOrderPlaced: () => void;
}

export function TradingInterface({ 
  marketId, 
  contracts, 
  userBalance, 
  onOrderPlaced 
}: TradingInterfaceProps) {
  const [selectedOutcome, setSelectedOutcome] = useState<string>("YES");
  const [orderType, setOrderType] = useState<"BUY" | "SELL">("BUY");
  const [price, setPrice] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState<string>("");

  const selectedContract = contracts.find(c => c.outcome === selectedOutcome);

  const handlePlaceOrder = async () => {
    if (!selectedContract) return;
    
    setIsPlacingOrder(true);
    setError("");

    const priceDecimal = parseFloat(price);
    const quantityInt = parseInt(quantity);

    // Validate inputs
    if (isNaN(priceDecimal) || priceDecimal < 0.01 || priceDecimal > 0.99) {
      setError("Price must be between $0.01 and $0.99");
      setIsPlacingOrder(false);
      return;
    }

    if (isNaN(quantityInt) || quantityInt < 1) {
      setError("Quantity must be at least 1");
      setIsPlacingOrder(false);
      return;
    }

    // Check balance for buy orders
    if (orderType === "BUY") {
      const cost = quantityInt * priceDecimal * 100; // Convert to cents
      if (cost > userBalance) {
        setError(`Insufficient balance. Cost: $${(cost / 100).toFixed(2)}, Balance: $${(userBalance / 100).toFixed(2)}`);
        setIsPlacingOrder(false);
        return;
      }
    }

    try {
      const response = await fetch(`${config.apiUrl}/api/v1/markets/${marketId}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          contract_id: selectedContract.contract_id,
          side: orderType,
          order_type: "limit",
          price: priceDecimal,
          quantity: quantityInt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to place order");
      }

      // Reset form
      setPrice("");
      setQuantity("");
      onOrderPlaced();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const calculateCost = () => {
    const priceDecimal = parseFloat(price);
    const quantityInt = parseInt(quantity);
    
    if (isNaN(priceDecimal) || isNaN(quantityInt)) return 0;
    
    return orderType === "BUY" 
      ? quantityInt * priceDecimal 
      : quantityInt * (1 - priceDecimal);
  };

  const bestBid = selectedContract?.order_book.bids[0];
  const bestAsk = selectedContract?.order_book.asks[0];

  return (
    <div className="space-y-6">
      {/* Market Price Display */}
      <div className="grid grid-cols-2 gap-4">
        {contracts.map((contract) => (
          <Card key={contract.contract_id} className={`cursor-pointer transition-colors ${
            selectedOutcome === contract.outcome ? 'ring-2 ring-blue-500' : ''
          }`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{contract.outcome}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Best Bid:</span>
                  <span className={contract.order_book.bids[0] ? 'text-green-600' : 'text-gray-400'}>
                    {contract.order_book.bids[0] ? `$${contract.order_book.bids[0].price}` : 'No bids'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Best Ask:</span>
                  <span className={contract.order_book.asks[0] ? 'text-red-600' : 'text-gray-400'}>
                    {contract.order_book.asks[0] ? `$${contract.order_book.asks[0].price}` : 'No asks'}
                  </span>
                </div>
                <Button 
                  variant={selectedOutcome === contract.outcome ? "default" : "outline"}
                  size="sm" 
                  className="w-full"
                  onClick={() => setSelectedOutcome(contract.outcome)}
                >
                  Trade {contract.outcome}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trading Form */}
      <Card>
        <CardHeader>
          <CardTitle>Place Order - {selectedOutcome}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Buy/Sell Toggle */}
          <Tabs value={orderType} onValueChange={(value) => setOrderType(value as "BUY" | "SELL")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="BUY" className="text-green-600 data-[state=active]:bg-green-100">
                Buy
              </TabsTrigger>
              <TabsTrigger value="SELL" className="text-red-600 data-[state=active]:bg-red-100">
                Sell
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Price Input */}
          <div className="space-y-2">
            <Label htmlFor="price">Price (per share)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="price"
                type="number"
                min="0.01"
                max="0.99"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="pl-8"
                placeholder="0.50"
              />
            </div>
            <div className="flex gap-2">
              {bestBid && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPrice(bestBid.price)}
                  className="text-xs"
                >
                  Best Bid: ${bestBid.price}
                </Button>
              )}
              {bestAsk && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPrice(bestAsk.price)}
                  className="text-xs"
                >
                  Best Ask: ${bestAsk.price}
                </Button>
              )}
            </div>
          </div>

          {/* Quantity Input */}
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity (shares)</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="100"
            />
          </div>

          {/* Order Summary */}
          {price && quantity && (
            <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Cost:</span>
                <span>${calculateCost().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Balance:</span>
                <span>${(userBalance / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>After Order:</span>
                <span>${((userBalance / 100) - calculateCost()).toFixed(2)}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <Button
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder || !price || !quantity}
            className={`w-full ${orderType === "BUY" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
          >
            {isPlacingOrder ? "Placing Order..." : `${orderType} ${selectedOutcome}`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 