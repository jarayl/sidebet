"use client";

import { config } from "@/lib/config";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";

interface User {
  user_id: number;
  username: string;
  email: string;
  is_superuser: boolean;
}

export function LandingNavbar() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/api/v1/users/me`, {
          credentials: "include",
        });

        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        // User not authenticated, which is fine for landing page
        console.log("User not authenticated");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo - matching the main app design */}
          <Link href="/" className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
              <span className="text-white text-lg font-bold">S</span>
            </div>
            <span className="ml-3 text-gray-900 text-xl font-semibold">
              SideBet
            </span>
          </Link>

          {/* Auth Buttons */}
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <div className="w-24 h-9 bg-gray-200 rounded-lg animate-pulse"></div>
            ) : user ? (
              <Link href="/dashboard">
                <Button className="bg-black hover:bg-gray-800 text-white">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                    <LogIn className="w-4 h-4 mr-2" />
                    Log In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-black hover:bg-gray-800 text-white">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Sign Up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 