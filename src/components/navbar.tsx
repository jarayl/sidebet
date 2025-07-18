"use client";

import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import { User, ChevronDown, Settings, LogOut, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SearchBar } from "@/components/search-bar";
import { config } from "@/lib/config";

interface UserType {
  email?: string;
  username: string;
  profile_picture?: string;
  is_superuser?: boolean;
}

interface NavbarProps {
  user: UserType | null;
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navLinks = [
    { label: "Markets", path: "/markets" },
    { label: "Ideas", path: "/ideas" },
  ];

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* LEFT: Logo and Navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo - matching landing page */}
          <button
            onClick={() => handleNavigate("/dashboard")}
            className="flex items-center focus:outline-none"
            aria-label="Go to dashboard"
          >
              <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                <span className="text-white text-lg font-bold">S</span>
            </div>
              <span className="ml-3 text-gray-900 text-xl font-semibold">
              SideBet
            </span>
          </button>

            {/* Navigation Links */}
            <nav className="flex items-center space-x-1">
          {navLinks.map(({ label, path }) => {
            const isActive = pathname === path;
            return (
              <button
                key={path}
                onClick={() => handleNavigate(path)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      isActive
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
              >
                {label}
              </button>
            );
          })}
            </nav>
        </div>

          {/* RIGHT: Search and User Menu */}
          <div className="flex items-center space-x-4">
          {user && <SearchBar />}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                    className="flex items-center space-x-2 px-3 py-2 h-10 hover:bg-gray-50 rounded-lg"
                >
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
                    <span className="text-sm font-medium text-gray-700 hidden sm:block">
                      {user.username}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">
                    {user.username}
                  </div>
                  {user.email && (
                      <div className="text-sm text-gray-500 truncate">
                      {user.email}
                    </div>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleNavigate(`/profile/${user.username}`)}
                    className="px-4 py-2"
                >
                    <User className="w-4 h-4 mr-3" />
                    Profile
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleNavigate("/settings")}
                    className="px-4 py-2"
                >
                    <Settings className="w-4 h-4 mr-3" />
                  Settings
                </DropdownMenuItem>
                {user.is_superuser && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleNavigate("/admin")}
                        className="px-4 py-2 text-purple-600 focus:text-purple-700 focus:bg-purple-50"
                    >
                        <Shield className="w-4 h-4 mr-3" />
                      Admin Panel
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await fetch(`${config.apiUrl}/api/v1/auth/logout`, {
                      method: "POST",
                      credentials: "include",
                    });
                    router.push("/login");
                  }}
                    className="px-4 py-2 text-red-600 focus:text-red-700 focus:bg-red-50"
                >
                    <LogOut className="w-4 h-4 mr-3" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => handleNavigate("/login")}
                className="bg-black hover:bg-gray-800 text-white"
            >
                Log In
            </Button>
          )}
          </div>
        </div>
      </div>
    </header>
  );
}
