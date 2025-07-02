"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Home, TrendingUp, Bookmark, MessageCircle, Users } from "lucide-react";

interface IdeasSidebarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  user: { username: string };
}

export function IdeasSidebar({ activeFilter, onFilterChange, user }: IdeasSidebarProps) {
  const filters = [
    { id: "home", label: "Home", icon: Home },
    { id: "following", label: "Following", icon: Users },
    { id: "trending", label: "Trending", icon: TrendingUp },
    { id: "bookmarked", label: "Bookmarked", icon: Bookmark },
    { id: "replies", label: "Replies", icon: MessageCircle },
  ];

  return (
    <div className="sticky top-20 h-fit">
      <Card className="border-0 bg-white shadow-sm">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Market Ideas</h2>
          
          <nav className="space-y-2">
            {filters.map((filter) => {
              const Icon = filter.icon;
              return (
                <button
                  key={filter.id}
                  onClick={() => onFilterChange(filter.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeFilter === filter.id
                      ? "bg-blue-50 text-blue-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{filter.label}</span>
                </button>
              );
            })}
          </nav>
        </CardContent>
      </Card>
    </div>
  );
} 