"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

function SearchBar() {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
      <Input 
        placeholder="Search"
        className="bg-gray-100 border-none rounded-full pl-10 h-11"
      />
    </div>
  );
}

function WhatsHappening() {
  const trends = [
    { category: "Sports · Trending", topic: "Oilers at Panthers", posts: "3,523 posts" },
    { category: "Politics · Trending", topic: "#WorldWarIII", posts: "11.5K posts" },
    { category: "Finance · Trending", topic: "GME", posts: "28.3K posts" },
  ];

  return (
    <div className="bg-gray-100 rounded-2xl p-4">
      <h2 className="text-xl font-bold mb-4 text-gray-900">What's happening</h2>
      <div className="space-y-4">
        {trends.map(trend => (
          <div key={trend.topic}>
            <p className="text-sm text-gray-500">{trend.category}</p>
            <p className="font-semibold text-gray-900">{trend.topic}</p>
            <p className="text-sm text-gray-500">{trend.posts}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubscribeCard() {
  return (
    <div className="bg-gray-100 rounded-2xl p-4">
      <h2 className="text-xl font-bold mb-2 text-gray-900">Subscribe to Premium</h2>
      <p className="mb-4 text-gray-700">Subscribe to unlock new features and if eligible, receive a share of revenue.</p>
      <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded-full transition-colors">
        Subscribe
      </button>
    </div>
  );
}


export function RightSidebar() {
  return (
    <div className="sticky top-4 space-y-6">
      <SearchBar />
      <SubscribeCard />
      <WhatsHappening />
    </div>
  );
} 