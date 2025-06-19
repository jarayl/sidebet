import { Home, TrendingUp, Bookmark, MessageCircle, MoreHorizontal, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface User {
  email: string;
  username: string;
}

interface IdeasSidebarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  user: User | null;
}

export function IdeasSidebar({ activeFilter, onFilterChange, user }: IdeasSidebarProps) {
  const router = useRouter();
  const menuItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "trending", label: "Trending", icon: TrendingUp },
    { id: "bookmarked", label: "Bookmarks", icon: Bookmark },
    { id: "replies", label: "Replies", icon: MessageCircle },
  ];
  
  const handleLogout = async () => {
    try {
      await fetch("http://localhost:8000/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="h-screen sticky top-0 flex flex-col justify-between py-2 pr-6">
      <div className="space-y-2">
        <button onClick={() => router.push('/ideas')} className="text-2xl font-bold p-3 hover:bg-gray-100 rounded-full transition-colors text-gray-900">
          Ideas
        </button>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeFilter === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onFilterChange(item.id)}
                className={`w-full flex items-center space-x-4 px-3 py-3 text-left rounded-full transition-colors text-xl text-gray-900 ${
                  isActive 
                    ? "font-bold" 
                    : "hover:bg-gray-100"
                }`}
              >
                <Icon className="w-7 h-7" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
        <Button className="w-full !mt-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold text-lg h-12">
          Post
        </Button>
      </div>

      {user && (
         <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="p-2 hover:bg-gray-100 rounded-full cursor-pointer transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-base font-semibold">
                      {user.username?.charAt(0).toUpperCase() || "U"}
                    </span>
                  </div>
                  <div className="text-left hidden xl:block">
                    <p className="font-bold text-sm text-gray-900">{user.username}</p>
                    <p className="text-gray-500 text-sm">@{user.username}</p>
                  </div>
                </div>
                <MoreHorizontal className="w-5 h-5 hidden xl:block text-gray-500" />
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 mb-2">
             <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Log out @{user.username}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
} 