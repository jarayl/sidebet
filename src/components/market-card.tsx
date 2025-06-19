import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Check } from "lucide-react";
import type { Market } from "@/lib/types";

interface MarketCardProps {
  market: Market;
  onUpdate?: (updatedMarket: Market) => void;
}

// Sample prediction data - in a real app this would come from the API
const getPredictionData = (marketTitle: string) => {
  const predictions: Record<string, any> = {
    "Phoenix vs Las Vegas": {
      options: [
        { label: "PHX", percentage: 80, yesPrice: "80¢", noPrice: "61¢", yesReturn: "$123", noReturn: "$159" },
        { label: "LV", percentage: 61, yesPrice: "61¢", noPrice: "80¢", yesReturn: "$123", noReturn: "$159" }
      ],
      volume: "$6,101,412",
      period: ""
    },
    "Democratic NYC Mayor nominee this year?": {
      options: [
        { label: "Andrew Cuomo", percentage: 60, yesPrice: "60¢", noPrice: "40¢" },
        { label: "Zohran Mamdani", percentage: 38, yesPrice: "38¢", noPrice: "62¢" }
      ],
      volume: "$4,325,596",
      period: ""
    },
    "Pro Hockey Champion?": {
      options: [
        { label: "FLA", percentage: 51, yesPrice: "51¢", noPrice: "50¢", yesReturn: "$189", noReturn: "$193" },
        { label: "EDM", percentage: 50, yesPrice: "50¢", noPrice: "51¢", yesReturn: "$189", noReturn: "$193" }
      ],
      volume: "$12,037,924",
      period: "Annually"
    },
    "Gas prices in the US this month?": {
      options: [
        { label: "Above 3.20", percentage: 48, yesPrice: "48¢", noPrice: "52¢" },
        { label: "Above 3.25", percentage: 34, yesPrice: "34¢", noPrice: "66¢" }
      ],
      volume: "$14,822,874",
      period: "Monthly"
    },
    "Chicago WS vs Texas": {
      options: [
        { label: "TEX", percentage: 83, yesPrice: "83¢", noPrice: "39¢", yesReturn: "$114", noReturn: "$241" },
        { label: "CWS", percentage: 39, yesPrice: "39¢", noPrice: "83¢", yesReturn: "$114", noReturn: "$241" }
      ],
      volume: "$88,572,989",
      period: "LIVE ▼ 3RD"
    }
  };
  
  return predictions[marketTitle] || {
    options: [
      { label: "Option A", percentage: 55, yesPrice: "55¢", noPrice: "45¢" },
      { label: "Option B", percentage: 45, yesPrice: "45¢", noPrice: "55¢" }
    ],
    volume: "$1,000,000",
    period: ""
  };
};

export function MarketCard({ market, onUpdate }: MarketCardProps) {
  const [isBookmarking, setIsBookmarking] = useState(false);
  const predictionData = getPredictionData(market.title);
  
  const handleBookmarkToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isBookmarking) return;
    
    setIsBookmarking(true);
    try {
      const response = await fetch(`http://localhost:8000/api/v1/markets/${market.market_id}/bookmark`, {
        method: "POST",
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        const updatedMarket = { ...market, is_bookmarked: data.is_bookmarked };
        onUpdate?.(updatedMarket);
      } else {
        console.error(`Failed to toggle bookmark for market ${market.market_id}:`, response.status);
      }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
    } finally {
      setIsBookmarking(false);
    }
  };
  
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col h-full min-h-[280px]">
      {/* Header with image and title */}
      <div className="flex items-start gap-3 mb-4">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex-shrink-0 overflow-hidden flex items-center justify-center">
          {market.image_url ? (
            <span className="text-2xl">{market.image_url}</span>
          ) : (
            <span className="text-white text-sm font-medium">IMG</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">{market.category}</div>
          <h3 className="text-base font-semibold text-gray-900 leading-tight line-clamp-2">
            {market.title}
          </h3>
        </div>
      </div>

      {/* Prediction options */}
      <div className="space-y-3 mb-4 flex-grow">
        {predictionData.options.map((option: any, index: number) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-gray-700 font-medium text-sm min-w-0 truncate">{option.label}</span>
              <span className="text-lg font-bold text-gray-900">{option.percentage}%</span>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="px-3 py-1 text-xs font-medium border-blue-200 text-blue-600 hover:bg-blue-50 h-7"
              >
                Yes
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="px-3 py-1 text-xs font-medium border-purple-200 text-purple-600 hover:bg-purple-50 h-7"
              >
                No
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom section with volume and bookmark button */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
        <div className="flex items-center gap-2 text-gray-500">
          <span className="text-sm font-semibold">{predictionData.volume}</span>
          {predictionData.period && (
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm">{predictionData.period}</span>
            </div>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          className={`w-8 h-8 rounded-full transition-colors ${
            market.is_bookmarked 
              ? 'hover:bg-green-100 text-green-600' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}
          onClick={handleBookmarkToggle}
          disabled={isBookmarking}
          title={market.is_bookmarked ? 'Remove bookmark' : 'Add bookmark'}
        >
          {market.is_bookmarked ? (
            <Check className="w-4 h-4" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
} 