"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminNavbar } from "@/components/admin-navbar";

interface AdminUser {
  user_id: number;
  username: string;
  email: string;
  is_superuser: boolean;
  profile_picture?: string;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/v1/users/me", {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Not authenticated");
        }

        const userData = await response.json();
        
        // Check if user is a superuser (admin)
        if (!userData.is_superuser) {
          throw new Error("Access denied: Admin privileges required");
        }

        setUser(userData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Authentication failed";
        setError(errorMessage);
        
        // Redirect to login or unauthorized page
        if (errorMessage.includes("Not authenticated")) {
          router.push("/login");
        } else {
          // Redirect to user dashboard if not admin
          router.push("/dashboard");
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Verifying admin access...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <div className="text-gray-500">Redirecting...</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar user={user} />
      <main className="min-h-[calc(100vh-4rem)]">
        {children}
      </main>
    </div>
  );
} 