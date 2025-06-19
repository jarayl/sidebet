"use client";

import { Button } from "@/components/ui/button";
import { useRouter, usePathname } from "next/navigation";
import { User, ChevronDown, Settings, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface UserType {
  email?: string;
  username: string;
  profile_picture?: string;
}

interface NavbarProps {
  user: UserType | null;
}

export function Navbar({ user }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navLinks = [
    { label: "Markets", path: "/markets" },
    { label: "Ideas",   path: "/ideas"   },
  ];

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <div
        className="flex items-center justify-between px-30"
        style={{ height: 75 }}
      >
        {/* LEFT: Logo, Markets, Ideas with big equal spacing */}
        <div className="flex items-center space-x-20">
          {/* Logo */}
          <button
            onClick={() => handleNavigate("/dashboard")}
            className="flex items-center focus:outline-none"
            aria-label="Go to dashboard"
            style={{ minWidth: 110, minHeight: 40, marginRight: 20, marginLeft: 15 }}
          >
            <div className="w-20 h-10 rounded-full bg-black flex items-center justify-center">
              <span className="text-white text-2xl font-bold">S</span>
            </div>
            <span className="ml-3 text-gray-900 text-2xl font-semibold">
              SideBet
            </span>
          </button>

          {/* Markets & Ideas */}
          {navLinks.map(({ label, path }) => {
            const isActive = pathname === path;
            return (
              <button
                key={path}
                onClick={() => handleNavigate(path)}
                className={`
                  relative px-7 py-2 text-base font-medium transition-colors rounded-xl
                  ${isActive
                    ? "bg-gray-100 text-black shadow-sm"
                    : "text-gray-700 hover:bg-gray-50"}
                `}
                style={{ minWidth: 110, minHeight: 40, marginRight: 10, marginLeft: 10 }}
                aria-current={isActive ? "page" : undefined}
              >
                {label}
                {isActive && (
                  <span className="absolute inset-0 rounded-xl ring-2 ring-gray-200 pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>

        {/* RIGHT: User Dropdown or Login */}
        <div className="flex items-center">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center space-x-3 px-3 py-2 h-14 hover:bg-gray-100 rounded-lg"
                >
                  {user.profile_picture ? (
                    <img
                      src={`http://localhost:8000${user.profile_picture}`}
                      alt={user.username}
                      className="w-11 h-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-11 h-11 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-600" />
                    </div>
                  )}
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="px-5 py-4">
                  <div className="text-lg font-medium text-gray-900">
                    {user.username}
                  </div>
                  {user.email && (
                    <div className="mt-1 text-base text-gray-500">
                      {user.email}
                    </div>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleNavigate(`/profile/${user.username}`)}
                  className="px-5 py-3 text-lg"
                >
                  <User className="w-6 h-6 mr-4" />
                  Account
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleNavigate("/settings")}
                  className="px-5 py-3 text-lg"
                >
                  <Settings className="w-6 h-6 mr-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await fetch("http://localhost:8000/api/v1/auth/logout", {
                      method: "POST",
                      credentials: "include",
                    });
                    router.push("/login");
                  }}
                  className="px-5 py-3 text-lg text-red-600 focus:text-red-700 focus:bg-red-50"
                >
                  <LogOut className="w-6 h-6 mr-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={() => handleNavigate("/login")}
              variant="default"
              size="lg"
              className="px-6 py-3 h-14 text-base"
            >
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
