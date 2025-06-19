"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Bookmark, Share, MoreHorizontal, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Idea } from "@/lib/types";

interface User {
  user_id: number;
  username: string;
}

interface IdeaCardProps {
  idea: Idea;
  currentUser: User | null;
  onUpdate: (updatedIdea: Idea) => void;
  onDelete: (ideaId: number) => void;
}

export function IdeaCard({ idea, currentUser, onUpdate, onDelete }: IdeaCardProps) {
  const router = useRouter();

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const handleAction = async (url: string) => {
    try {
      const response = await fetch(url, { method: "POST", credentials: "include" });
      if (response.ok) {
        const updatedIdea = await response.json();
        onUpdate({ ...idea, ...updatedIdea });
      }
    } catch (error) {
      console.error("Failed to perform action:", error);
    }
  };
  
  const handleDelete = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/ideas/${idea.idea_id}`, { method: "DELETE", credentials: "include" });
      if(response.ok) {
        onDelete(idea.idea_id);
      }
    } catch (error) {
      console.error("Failed to delete idea:", error);
    }
  }

  const handleCardClick = () => router.push(`/ideas/${idea.idea_id}`);
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  const userInitial = idea.submitted_by_user?.username?.charAt(0).toUpperCase() || 'A';
  const isOwner = currentUser?.user_id === idea.submitted_by;

  return (
    <article 
      className="p-4 hover:bg-gray-50/50 cursor-pointer transition-colors border-b border-gray-200"
      onClick={handleCardClick}
    >
      <div className="flex items-start space-x-3">
        {idea.submitted_by_user?.profile_picture ? (
          <img
            src={`http://localhost:8000${idea.submitted_by_user.profile_picture}`}
            alt={idea.submitted_by_user.username}
            className="w-11 h-11 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-11 h-11 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-semibold">{userInitial}</span>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span 
                className="font-bold text-gray-900 truncate hover:underline cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (idea.submitted_by_user?.username) {
                    router.push(`/profile/${idea.submitted_by_user.username}`);
                  }
                }}
              >
                {idea.submitted_by_user?.username || "Anonymous"}
              </span>
              <span className="hidden sm:inline">·</span>
              <span className="hidden sm:inline">{formatTimeAgo(idea.created_at)}</span>
            </div>
            {isOwner && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button onClick={stopPropagation} className="-mr-2 p-2 rounded-full hover:bg-blue-100 text-gray-500">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent onClick={stopPropagation}>
                  <DropdownMenuItem onClick={handleDelete} className="text-red-500 cursor-pointer">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <p className="text-base my-1 text-gray-900">{idea.title}</p>

          <div className="flex items-center justify-between mt-3 text-gray-500 max-w-xs">
            <ActionButton 
              icon={MessageCircle} 
              count={idea.comments_count}
              hoverColor="hover:text-blue-500"
              groupHoverColor="group-hover:bg-blue-100/50"
              onClick={() => router.push(`/ideas/${idea.idea_id}`)}
            />
            <ActionButton 
              icon={Heart} 
              count={idea.likes_count} 
              isActive={idea.is_liked}
              activeColor="text-red-500"
              hoverColor="hover:text-red-500"
              groupHoverColor="group-hover:bg-red-100/50"
              onClick={() => handleAction(`http://localhost:8000/api/v1/ideas/${idea.idea_id}/like`)}
            />
            <ActionButton
              icon={Bookmark}
              isActive={idea.is_bookmarked}
              activeColor="text-yellow-500"
              hoverColor="hover:text-yellow-500"
              groupHoverColor="group-hover:bg-yellow-100/50"
              onClick={() => handleAction(`http://localhost:8000/api/v1/ideas/${idea.idea_id}/bookmark`)}
            />
            <ActionButton 
              icon={Share} 
              hoverColor="hover:text-green-500" 
              groupHoverColor="group-hover:bg-green-100/50"
            />
          </div>
        </div>
      </div>
    </article>
  );
}

interface ActionButtonProps {
  icon: React.ElementType;
  count?: number;
  isActive?: boolean;
  activeColor?: string;
  hoverColor?: string;
  groupHoverColor?: string;
  onClick?: () => void;
}

function ActionButton({ icon: Icon, count, isActive, activeColor, hoverColor, groupHoverColor, onClick }: ActionButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick?.();
  };
  
  return (
    <button onClick={handleClick} className={`flex items-center space-x-2 text-sm group transition-colors duration-150 ${hoverColor}`}>
      <div className={`p-2 rounded-full transition-colors duration-150 ${groupHoverColor}`}>
        <Icon className={`w-5 h-5 ${isActive ? activeColor : ""} ${isActive && (Icon === Heart || Icon === Bookmark) ? 'fill-current' : ''}`} />
      </div>
      {count !== undefined && <span className={`transition-colors duration-150 ${isActive ? activeColor : ""}`}>{count}</span>}
    </button>
  );
} 