"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Settings, LogOut, User, Shield } from "lucide-react";
import { config } from "@/lib/config";

interface AdminNavbarProps {
  user: {
    user_id: number;
    username: string;
    email: string;
    is_superuser: boolean;
    profile_picture?: string;
  } | null;
}

export function AdminNavbar({ user }: AdminNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

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

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/markets", label: "Markets" },
    { href: "/admin/ideas", label: "Ideas" },
    { href: "/admin/users", label: "Users" },
  ];

  if (!user) return null;

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center gap-8">
            <Link href="/admin/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">SideBet</span>
                <Badge variant="secondary" className="ml-2 bg-purple-100 text-purple-700 border-purple-200 text-xs">
                  Admin
                </Badge>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      pathname === item.href
                        ? "bg-purple-50 text-purple-700 hover:bg-purple-100"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </Button>
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side - User Menu */}
          <div className="flex items-center gap-4">
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50">
                  {user.profile_picture ? (
                    <img
                      src={`${config.apiUrl}${user.profile_picture}`}
                      alt={user.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <img
                      src={`${config.apiUrl}/public/default_icon.jpg`}
                      alt={user.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  <div className="text-left hidden sm:block">
                    <div className="text-sm font-medium text-gray-900">{user.username}</div>
                    <div className="text-xs text-gray-500">Administrator</div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">{user.username}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    User Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
} 