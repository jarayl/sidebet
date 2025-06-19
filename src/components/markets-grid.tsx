"use client";

import { useEffect, useState } from "react";
import { MarketCard } from "@/components/market-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Market } from "@/lib/types"; 

async function getMarkets(category?: string, bookmarkedOnly: boolean = false): Promise<Market[]> {
  const url = new URL("http://localhost:8000/api/v1/markets/");
  if (category && category !== "All") {
    url.searchParams.append("category", category);
  }
  if (bookmarkedOnly) {
    url.searchParams.append("bookmarked_only", "true");
  }
  
  const res = await fetch(url.toString(), {
    credentials: "include",
  });
  if (!res.ok) {
    console.error("Failed to fetch markets");
    return []; 
  }
  return res.json();
}

interface MarketListProps {
  category: string;
  allMarkets: { [key: string]: Market[] };
  setAllMarkets: React.Dispatch<React.SetStateAction<{ [key: string]: Market[] }>>;
}

function MarketList({ category, allMarkets, setAllMarkets }: MarketListProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markets = allMarkets[category] || [];

  useEffect(() => {
    // Only fetch if we don't have data for this category
    if (!allMarkets[category]) {
      setIsLoading(true);
      
      const bookmarkedOnly = category === "Saved";
      const searchCategory = category === "Saved" ? undefined : category;
      
      getMarkets(searchCategory, bookmarkedOnly)
        .then(fetchedMarkets => {
          setAllMarkets(prev => ({
            ...prev,
            [category]: fetchedMarkets
          }));
        })
        .catch((err) => setError(err.message))
        .finally(() => setIsLoading(false));
    }
  }, [category, allMarkets, setAllMarkets]);

  const handleMarketUpdate = (updatedMarket: Market) => {
    setAllMarkets(prevAllMarkets => {
      const newAllMarkets = { ...prevAllMarkets };
      
      // Update the market in all categories where it exists
      Object.keys(newAllMarkets).forEach(cat => {
        if (cat === "Saved") {
          // For Saved tab, add/remove based on bookmark status
          if (updatedMarket.is_bookmarked) {
            // Add to saved if not already there
            const existsInSaved = newAllMarkets[cat].some(m => m.market_id === updatedMarket.market_id);
            if (!existsInSaved) {
              newAllMarkets[cat] = [...newAllMarkets[cat], updatedMarket];
            } else {
              // Update existing
              newAllMarkets[cat] = newAllMarkets[cat].map(market =>
                market.market_id === updatedMarket.market_id ? updatedMarket : market
              );
            }
          } else {
            // Remove from saved
            newAllMarkets[cat] = newAllMarkets[cat].filter(market => 
              market.market_id !== updatedMarket.market_id
            );
          }
        } else {
          // For other tabs, just update the bookmark status
          newAllMarkets[cat] = newAllMarkets[cat].map(market =>
            market.market_id === updatedMarket.market_id
              ? { ...market, is_bookmarked: updatedMarket.is_bookmarked }
              : market
          );
        }
      });
      
      return newAllMarkets;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg text-gray-500">Loading markets...</div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">Error: {error}</div>;
  }

  if (markets.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {category === "Saved" ? "No saved markets" : "No markets found"}
        </h3>
        <p className="text-gray-500">
          {category === "Saved" 
            ? "Markets you bookmark will appear here." 
            : "There are no markets in this category yet."
          }
        </p>
      </div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {markets.map((market) => (
        <MarketCard 
          key={market.market_id} 
          market={market} 
          onUpdate={handleMarketUpdate}
        />
      ))}
    </div>
  );
}

export function MarketsGrid() {
  const categories = ["All", "Sports", "IMs", "Student Gov", "Admin", "Saved"];
  const [allMarkets, setAllMarkets] = useState<{ [key: string]: Market[] }>({});

  return (
    <Tabs defaultValue="All" className="w-full">
      <TabsList className="grid w-full grid-cols-6 mb-6 h-10">
        {categories.map((category) => (
          <TabsTrigger 
            key={category} 
            value={category}
            className="text-xs px-1 py-1 h-8 min-w-0"
          >
            {category}
          </TabsTrigger>
        ))}
      </TabsList>
      
      {categories.map((category) => (
        <TabsContent key={category} value={category}>
          <MarketList 
            category={category} 
            allMarkets={allMarkets}
            setAllMarkets={setAllMarkets}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
} 