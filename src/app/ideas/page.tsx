"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { IdeasSidebar } from "@/components/ideas-sidebar";
import { IdeasFeed } from "@/components/ideas-feed";
import { RightSidebar } from "@/components/right-sidebar";

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
    fetch("http://localhost:8000/api/v1/users/me", {
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
  
  const pageTitle = activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      <div className="container mx-auto flex justify-center">
        <header className="w-[275px] hidden sm:block">
          <IdeasSidebar 
            activeFilter={activeFilter} 
            onFilterChange={setActiveFilter} 
            user={user}
          />
        </header>
        <main className="w-full max-w-[600px] border-l border-r border-gray-200">
          <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 p-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">{pageTitle}</h1>
          </div>
          <IdeasFeed filter={activeFilter} user={user} />
        </main>
        <aside className="w-[350px] ml-8 hidden lg:block">
          <RightSidebar />
        </aside>
      </div>
    </div>
  );
} 