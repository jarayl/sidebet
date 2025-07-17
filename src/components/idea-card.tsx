"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Bookmark, CheckCircle, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Idea } from "@/lib/types";

interface IdeaCardProps {
  idea: Idea;
  onUpdate: (updatedIdea: Idea) => void;
  onDelete: (ideaId: number) => void;
}

export function IdeaCard({ idea, onUpdate, onDelete }: IdeaCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
            <Clock className="w-3 h-3 mr-1" />
            Under Review
          </Badge>
        );
      case 'accepted':
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            Accepted
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return null;
    }
  };

  const handleAction = async (url: string, actionType: 'like' | 'bookmark') => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const response = await fetch(url, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        
        if (actionType === 'like') {
          onUpdate({
            ...idea,
            is_liked: result.is_liked,
            likes_count: result.likes_count,
          });
        } else if (actionType === 'bookmark') {
          if (result.is_bookmarked) {
            onUpdate({
              ...idea,
              is_bookmarked: result.is_bookmarked,
            });
          } else {
            // If unbookmarked, remove from view if we're in bookmarked filter
            onDelete(idea.idea_id);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to ${actionType}:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border-b border-gray-200 p-4 hover:bg-gray-50/50 transition-colors cursor-pointer">
      <div className="flex items-start space-x-3">
        {idea.submitted_by_user?.profile_picture ? (
          <img
            src={`http://localhost:8000${idea.submitted_by_user.profile_picture}`}
            alt={idea.submitted_by_user.username}
            className="w-12 h-12 rounded-full flex-shrink-0 object-cover"
          />
        ) : (
          <img
            src="/default_icon.jpg"
            alt={idea.submitted_by_user?.username || "User"}
            className="w-12 h-12 rounded-full flex-shrink-0 object-cover"
          />
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span 
                className="font-bold text-gray-900 hover:underline cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  if (idea.submitted_by_user?.username) {
                    router.push(`/profile/${idea.submitted_by_user.username}`);
                  }
                }}
              >
                {idea.submitted_by_user?.username}
              </span>
              <span className="text-gray-500">·</span>
              <span className="text-gray-500 text-sm">{formatTimeAgo(idea.created_at)}</span>
            </div>
            {getStatusBadge(idea.status)}
          </div>
          
          <div 
            onClick={() => router.push(`/ideas/${idea.idea_id}`)}
            className="mb-3"
          >
            <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{idea.title}</h3>
            {idea.description && (
              <p className="text-gray-700 text-sm line-clamp-2">{idea.description}</p>
            )}
          </div>

          <div className="flex items-center space-x-6 text-gray-500">
            <ActionButton 
              icon={MessageCircle} 
              count={idea.comments_count}
              onClick={() => router.push(`/ideas/${idea.idea_id}`)}
              hoverColor="hover:text-blue-500"
            />
            <ActionButton 
              icon={Heart} 
              count={idea.likes_count} 
              isActive={idea.is_liked}
              activeColor="text-red-500"
              hoverColor="hover:text-red-500"
              onClick={() => handleAction(`http://localhost:8000/api/v1/ideas/${idea.idea_id}/like`, 'like')}
              disabled={isLoading}
            />
            <ActionButton
              icon={Bookmark}
              isActive={idea.is_bookmarked}
              activeColor="text-yellow-500"
              hoverColor="hover:text-yellow-500"
              onClick={() => handleAction(`http://localhost:8000/api/v1/ideas/${idea.idea_id}/bookmark`, 'bookmark')}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionButton({ 
  icon: Icon, 
  count, 
  isActive, 
  activeColor, 
  hoverColor, 
  onClick, 
  disabled 
}: { 
  icon: React.ElementType;
  count?: number;
  isActive?: boolean;
  activeColor?: string;
  hoverColor?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      disabled={disabled}
      className={`flex items-center space-x-2 group transition-colors duration-150 p-2 rounded-full ${hoverColor} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        <Icon className={`w-5 h-5 ${isActive ? activeColor : ""} ${isActive && (Icon === Heart || Icon === Bookmark) ? 'fill-current' : ''}`} />
      {count !== undefined && <span className="text-sm">{count}</span>}
    </button>
  );
} 