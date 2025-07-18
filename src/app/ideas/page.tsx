"use client";

import { config } from "@/lib/config";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { IdeasSidebar } from "@/components/ideas-sidebar";
import { IdeasFeed } from "@/components/ideas-feed";

interface PageUser {
  user_id: number;
  username: string;
  email: string;
}

export default function IdeasPage() {
  const router = useRouter();
  const [user, setUser] = useState<PageUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("home");

  useEffect(() => {
      fetch(`${config.apiUrl}/api/v1/users/me`, {
      credentials: "include",
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Not authenticated"))))
      .then(setUser)
      .catch(() => router.push("/login"))
      .finally(() => setIsLoading(false));
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }
  
  const getPageTitle = (filter: string) => {
    switch (filter) {
      case 'home':
        return 'Market Ideas';
      case 'following':
        return 'Following';
      case 'trending':
        return 'Trending Ideas';
      case 'bookmarked':
        return 'Saved Ideas';
      case 'replies':
        return 'My Comments';
      default:
        return 'Market Ideas';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <div className="container mx-auto flex justify-center gap-8">
        <aside className="w-[275px] hidden sm:block">
          <IdeasSidebar 
            activeFilter={activeFilter} 
            onFilterChange={setActiveFilter} 
            user={user}
          />
        </aside>
        <main className="w-full max-w-[600px] border-l border-r border-gray-200">
          <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 p-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">{getPageTitle(activeFilter)}</h1>
            <p className="text-sm text-gray-600 mt-1">
              Submit ideas for new prediction markets
            </p>
          </div>
          <IdeasFeed filter={activeFilter} user={user} />
        </main>
      </div>
    </div>
  );
} 