import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Check } from "lucide-react";
import type { Market, ContractResponse } from "@/lib/types";
import { config } from "@/lib/config";

interface MarketPrice {
  contract_id: number;
  title: string;
  market_price: number | null;
  market_price_percent: number | null;
}

interface MarketPricesResponse {
  market_id: number;
  contracts: MarketPrice[];
}

interface MarketCardProps {
  market: Market;
  onUpdate?: (updatedMarket: Market) => void;
}

export function MarketCard({ market, onUpdate }: MarketCardProps) {
  const [isBookmarking, setIsBookmarking] = useState(false);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);
  
  // Fetch market prices for probability display
  useEffect(() => {
    const fetchMarketPrices = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/api/v1/markets/${market.market_id}/market-prices`, {
          credentials: "include",
        });
        
        if (response.ok) {
          const data: MarketPricesResponse = await response.json();
          setMarketPrices(data.contracts);
        }
      } catch (error) {
        console.error("Failed to fetch market prices:", error);
      } finally {
        setIsLoadingPrices(false);
      }
    };

    fetchMarketPrices();
  }, [market.market_id]);
  
  const handleBookmarkToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isBookmarking) return;
    
    setIsBookmarking(true);
    try {
      const response = await fetch(`${config.apiUrl}/api/v1/markets/${market.market_id}/bookmark`, {
        method: "POST",
        credentials: "include",
      });
      
      if (response.ok) {
        const updatedMarket = { ...market, is_bookmarked: !market.is_bookmarked };
        onUpdate?.(updatedMarket);
      }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
    } finally {
      setIsBookmarking(false);
    }
  };

  const contracts = market.contracts || [];

  // Get total volume across all contracts
  const getTotalVolume = () => {
    if (contracts.length === 0) return "No volume";
    
    const totalVolume = contracts.reduce((sum, contract) => {
      return sum + (contract.yes_volume || 0) + (contract.no_volume || 0);
    }, 0);
    
    return totalVolume > 0 ? `${totalVolume} trades` : "No volume";
  };

  // Function to get market price percentage for display
  const getMarketPricePercentage = (contractId: number) => {
    if (isLoadingPrices) return "Loading...";
    
    const priceData = marketPrices.find(p => p.contract_id === contractId);
    if (priceData?.market_price_percent !== null && priceData?.market_price_percent !== undefined) {
      return `${priceData.market_price_percent}%`;
    }
    return "No price";
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors cursor-pointer">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {market.image_url ? (
              <img
                src={`${config.apiUrl}${market.image_url}`}
                alt={market.title}
                className="w-12 h-12 rounded-lg object-cover border border-gray-200"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                <span className="text-gray-400 text-lg font-bold">
                  {market.category?.charAt(0) || "M"}
                </span>
              </div>
            )}
            <div className="text-sm text-gray-500">{market.category}</div>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 mb-3 leading-tight">
          {market.title}
        </h3>

        {/* Contracts */}
        <div className="space-y-3">
          {contracts.map((contract, index) => {
            const percentage = getMarketPricePercentage(contract.contract_id || 0);
            return (
              <div key={contract.contract_id || index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 font-medium">{contract.title}</span>
                  {percentage !== "No price" && percentage !== "Loading..." ? (
                    <span className="text-sm text-gray-600">{percentage}</span>
                  ) : (
                    <span className="text-[10px] text-gray-400">{percentage}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            {getTotalVolume()}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleBookmarkToggle}
            disabled={isBookmarking}
            className={`h-8 w-8 p-0 rounded-full transition-colors ${
              market.is_bookmarked 
                ? "bg-black hover:bg-gray-800 text-white" 
                : "bg-gray-100 hover:bg-gray-200 text-gray-600"
            }`}
          >
            {market.is_bookmarked ? (
              <Check className="w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 