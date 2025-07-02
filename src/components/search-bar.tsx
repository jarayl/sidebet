"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, User, TrendingUp, Clock, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface SearchUser {
  user_id: number;
  username: string;
  profile_picture?: string;
}

interface SearchMarket {
  market_id: number;
  title: string;
  category: string;
  status: string;
  close_time: string;
  image_url?: string;
  trade_volume: number;
}

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className = "" }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "markets">("users");
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [markets, setMarkets] = useState<SearchMarket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Global keyboard shortcut (Cmd+K or Ctrl+K)
  useEffect(() => {
    function handleGlobalKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setUsers([]);
      setMarkets([]);
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    const timeoutId = setTimeout(() => {
      performSearch(query.trim());
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Reset selected index when switching tabs
  useEffect(() => {
    setSelectedIndex(-1);
  }, [activeTab]);

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery) return;

    setIsLoading(true);
    setIsOpen(true);

    try {
      // Search users and markets in parallel
      const [usersRes, marketsRes] = await Promise.all([
        fetch(`http://localhost:8000/api/v1/users/search?q=${encodeURIComponent(searchQuery)}`, {
          credentials: "include",
        }),
        fetch(`http://localhost:8000/api/v1/markets/search?q=${encodeURIComponent(searchQuery)}`, {
          credentials: "include",
        }),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      }

      if (marketsRes.ok) {
        const marketsData = await marketsRes.json();
        setMarkets(marketsData);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserClick = (username: string) => {
    router.push(`/profile/${username}`);
    setQuery("");
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const handleMarketClick = (marketId: number) => {
    router.push(`/markets/${marketId}`);
    setQuery("");
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  const clearSearch = () => {
    setQuery("");
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    const currentResults = activeTab === "users" ? users : markets;
    const maxIndex = currentResults.length - 1;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev => (prev < maxIndex ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : maxIndex));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex <= maxIndex) {
          if (activeTab === "users") {
            handleUserClick(users[selectedIndex].username);
          } else {
            handleMarketClick(markets[selectedIndex].market_id);
          }
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
      case "Tab":
        if (e.shiftKey) {
          setActiveTab(activeTab === "users" ? "markets" : "users");
          e.preventDefault();
        }
        break;
    }
  };

  const formatTimeRemaining = (closeTime: string) => {
    const now = new Date();
    const close = new Date(closeTime);
    const diff = close.getTime() - now.getTime();
    
    if (diff <= 0) return "Closed";
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d`;
    if (hours > 0) return `${hours}h`;
    
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes}m`;
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search users and markets... (⌘K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-10 pr-10 py-2 w-80 bg-gray-50 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-full"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "users"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <User className="w-4 h-4" />
                <span>Users</span>
                {users.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-gray-100 text-gray-600 text-xs">
                    {users.length}
                  </Badge>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab("markets")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "markets"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>Markets</span>
                {markets.length > 0 && (
                  <Badge variant="secondary" className="ml-1 bg-gray-100 text-gray-600 text-xs">
                    {markets.length}
                  </Badge>
                )}
              </div>
            </button>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                Searching...
              </div>
            ) : (
              <>
                {activeTab === "users" && (
                  <div className="py-2">
                    {users.length === 0 ? (
                      <div className="px-4 py-6 text-center text-gray-500">
                        <User className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No users found</p>
                        <p className="text-xs text-gray-400">Try adjusting your search terms</p>
                      </div>
                    ) : (
                      users.map((user, index) => (
                        <button
                          key={user.user_id}
                          onClick={() => handleUserClick(user.username)}
                          className={`w-full px-4 py-3 flex items-center gap-3 transition-colors text-left ${
                            selectedIndex === index ? "bg-blue-50 border-l-2 border-blue-500" : "hover:bg-gray-50"
                          }`}
                        >
                          {user.profile_picture ? (
                            <img
                              src={`http://localhost:8000${user.profile_picture}`}
                              alt={user.username}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <img
                              src="/default_icon.jpg"
                              alt={user.username}
                              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {user.username}
                            </div>
                            <div className="text-sm text-gray-500 truncate">
                              @{user.username}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {activeTab === "markets" && (
                  <div className="py-2">
                    {markets.length === 0 ? (
                      <div className="px-4 py-6 text-center text-gray-500">
                        <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No markets found</p>
                        <p className="text-xs text-gray-400">Try adjusting your search terms</p>
                      </div>
                    ) : (
                      markets.map((market, index) => (
                        <button
                          key={market.market_id}
                          onClick={() => handleMarketClick(market.market_id)}
                          className={`w-full px-4 py-3 flex items-start gap-3 transition-colors text-left ${
                            selectedIndex === index ? "bg-blue-50 border-l-2 border-blue-500" : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate mb-1">
                              {market.title}
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                                {market.category}
                              </Badge>
                              <div className="flex items-center gap-1 text-gray-500">
                                <Clock className="w-3 h-3" />
                                <span>{formatTimeRemaining(market.close_time)}</span>
                              </div>
                              <div className="text-gray-600 font-medium">
                                {market.trade_volume} trades
                              </div>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 