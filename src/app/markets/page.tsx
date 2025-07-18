"use client";

import { config } from "@/lib/config";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { MarketsGrid } from "@/components/markets-grid";
import { Suspense } from "react";

export default function MarketsPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; username: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch user data to ensure authentication
      fetch(`${config.apiUrl}/api/v1/users/me`, {
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("Not authenticated");
        }
        return res.json();
      })
      .then((data) => setUser(data))
      .catch(() => {
        router.push("/login");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [router]);

  const handleLogout = async () => {
    try {
        await fetch(`${config.apiUrl}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <div className="text-lg text-gray-500">Loading markets...</div>
          </div>
        }>
          <MarketsGrid />
        </Suspense>
      </div>
    </div>
  );
} 