"use client";

import { config } from "@/lib/config";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bookmark, BookmarkIcon } from "lucide-react";

interface Contract {
  contract_id: number;
  title: string;
  description?: string;
  status: string;
  resolution?: string;
  yes_price?: string;
  no_price?: string;
  yes_volume?: number;
  no_volume?: number;
}

interface Market {
  market_id: number;
  title: string;
  description: string;
  category: string;
  image_url?: string;
  start_time: string;
  close_time: string;
  resolve_time?: string;
  status: string;
  result?: string;
  is_bookmarked: boolean;
  contracts?: Contract[];
}

async function getMarkets(category?: string, bookmarkedOnly: boolean = false): Promise<Market[]> {
  const params = new URLSearchParams();
  if (category && category !== "All") params.append("category", category);
  if (bookmarkedOnly) params.append("bookmarked_only", "true");
  
  const response = await fetch(`${config.apiUrl}/api/v1/markets?${params}`, {
    credentials: "include",
  });
  
  if (!response.ok) throw new Error("Failed to fetch markets");
  return response.json();
}

async function toggleBookmark(marketId: number): Promise<{ is_bookmarked: boolean }> {
  const response = await fetch(`${config.apiUrl}/api/v1/markets/${marketId}/bookmark`, {
    method: "POST",
    credentials: "include",
  });
  
  if (!response.ok) throw new Error("Failed to toggle bookmark");
  return response.json();
}

function MarketCard({ market, onBookmarkToggle }: { market: Market; onBookmarkToggle: (marketId: number) => void }) {
  const router = useRouter();
  
  const handleBookmarkClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    onBookmarkToggle(market.market_id);
  };

  const handleCardClick = () => {
    router.push(`/markets/${market.market_id}`);
  };

  const handleOptionClick = (e: React.MouseEvent, contract: Contract, side: 'yes' | 'no') => {
    e.stopPropagation();
    router.push(`/markets/${market.market_id}`);
  };

  // Get contracts from API response
  const contracts = market.contracts || [];

  // Function to determine if there's a real market price
  const hasMarketPrice = (contract: Contract) => {
    return (contract.yes_price && contract.yes_price !== "No price") ||
           (contract.no_price && contract.no_price !== "No price");
  };

  // Function to get YES percentage for display
  const getYesPercentage = (contract: Contract) => {
    const yesPrice = contract.yes_price;
    if (yesPrice && yesPrice !== "No price") {
      const percent = parseInt(yesPrice.replace('¢', ''));
      return `${percent}%`;
    }
    return null;
  };

  // Get total volume
  const getTotalVolume = () => {
    if (contracts.length === 0) return "No volume";
    
    const totalVolume = contracts.reduce((sum, contract) => {
      return sum + (contract.yes_volume || 0) + (contract.no_volume || 0);
    }, 0);
    
    return totalVolume > 0 ? `${totalVolume} trades` : "No volume";
  };
  const totalVolume = getTotalVolume();

  return (
    <div 
      className="bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 cursor-pointer h-full flex flex-col"
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3 mb-3">
          {/* Market Icon */}
          <div className="w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden">
            {market.image_url ? (
              <img
                src={`${config.apiUrl}${market.image_url}`}
                alt={market.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {market.category?.charAt(0) || "M"}
                </span>
              </div>
            )}
          </div>
          
          {/* Title only - no bookmark button here */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 leading-tight mb-1">
              {market.title}
            </h3>
          </div>
        </div>
      </div>

      {/* Options - flex-grow to push bottom section down */}
      <div className="px-4 pb-4 flex-grow flex flex-col">
        <div className="space-y-3 flex-grow">
          {contracts.map((contract, index) => {
            const percentage = getYesPercentage(contract);
            return (
              <div key={contract.contract_id || index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 font-medium">{contract.title}</span>
                  {percentage ? (
                    <span className="text-sm text-gray-600">{percentage}</span>
                  ) : (
                    <span className="text-[10px] text-gray-400">No price</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="px-3 py-1 h-7 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold border-0"
                    onClick={(e) => handleOptionClick(e, contract, 'yes')}
                  >
                    Yes
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="px-3 py-1 h-7 border-purple-200 text-purple-600 hover:bg-purple-50 text-xs font-semibold"
                    onClick={(e) => handleOptionClick(e, contract, 'no')}
                  >
                    No
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom section - always at bottom */}
        <div className="flex items-center justify-between mt-4 pt-3">
          <div className="flex items-center gap-2 text-gray-500">
            <span className="text-sm font-medium">{totalVolume}</span>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="text-sm">Annually</span>
            </div>
          </div>
          
          {/* Single bookmark button in bottom right - yellow when saved */}
          <button
            onClick={handleBookmarkClick}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              market.is_bookmarked 
                ? 'bg-yellow-400 hover:bg-yellow-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${market.is_bookmarked ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>
    </div>
  );
}

function MarketList({ category }: { category: string }) {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMarkets = async () => {
    try {
      setIsLoading(true);
      const data = await getMarkets(
        category === "All" || category === "Saved" ? undefined : category,
        category === "Saved"
      );
      setMarkets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch markets");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, [category]);

  const handleBookmarkToggle = async (marketId: number) => {
    try {
      const result = await toggleBookmark(marketId);
      setMarkets(prev => prev.map(market => 
        market.market_id === marketId 
          ? { ...market, is_bookmarked: result.is_bookmarked }
          : market
      ));
      
      // If we're on the "Saved" tab and the item was unbookmarked, remove it from the list
      if (category === "Saved" && !result.is_bookmarked) {
        setMarkets(prev => prev.filter(market => market.market_id !== marketId));
          }
    } catch (error) {
      console.error("Failed to toggle bookmark:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading markets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (markets.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-gray-500 text-lg mb-2">No markets found</div>
          <div className="text-gray-400 text-sm">
            {category === "Saved" ? "You haven't bookmarked any markets yet." : "Check back later for new markets."}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {markets.map((market) => (
        <MarketCard 
          key={market.market_id} 
          market={market} 
          onBookmarkToggle={handleBookmarkToggle}
        />
      ))}
    </div>
  );
}

export function MarketsGrid() {
  const [activeTab, setActiveTab] = useState("All");
  const [marketCount, setMarketCount] = useState(0);

  // Fetch market count for display
  useEffect(() => {
    getMarkets().then(markets => setMarketCount(markets.length)).catch(() => {});
  }, []);

  const categories = [
    { id: "All", label: "All" },
    { id: "Sports", label: "Sports" },
    { id: "IMs", label: "IMs" },
    { id: "Student Gov", label: "Student Gov" },
    { id: "Admin", label: "Admin" },
    { id: "Saved", label: "Saved" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Prediction Markets</h1>
          <p className="text-gray-600 mt-1">{marketCount} markets available</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-gray-100 border border-gray-200 rounded-lg h-auto p-1 w-full justify-start">
        {categories.map((category) => (
          <TabsTrigger 
             key={category.id}
             value={category.id}
             className="bg-transparent border-0 rounded-md px-6 py-3 text-gray-600 font-medium relative data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm hover:text-gray-900 transition-colors"
         >
             {category.label}
         </TabsTrigger>
       ))}
      </TabsList>
      
      {categories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="mt-6">
            <MarketList category={category.id} />
        </TabsContent>
      ))}
    </Tabs>
   </div>
  );
} 