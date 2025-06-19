"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Bookmark, Share, ArrowLeft, MoreHorizontal, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { IdeaDetail, IdeaComment, UserInfo } from "@/lib/types";

export default function IdeaDetailPage() {
  const router = useRouter();
  const params = useParams();
  const ideaId = params.id as string;
  
  const [user, setUser] = useState<UserInfo | null>(null);
  const [idea, setIdea] = useState<IdeaDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const fetchPageData = async () => {
    try {
      const userRes = await fetch("http://localhost:8000/api/v1/users/me", { credentials: "include" });
      if (!userRes.ok) throw new Error("Not authenticated");
      const userData = await userRes.json();
      setUser(userData);

      const ideaRes = await fetch(`http://localhost:8000/api/v1/ideas/${ideaId}`, { credentials: "include" });
      if (!ideaRes.ok) throw new Error("Failed to fetch idea");
      const ideaData = await ideaRes.json();
      setIdea(ideaData);
    } catch (err) {
      if (err instanceof Error && err.message === 'Not authenticated') {
        router.push("/login");
      } else {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPageData();
  }, [ideaId, router]);

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      hour: "numeric",
      minute: "numeric",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };
  
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
    if (!idea) return;
    try {
      const response = await fetch(url, { method: "POST", credentials: "include" });
      if (response.ok) {
        const updatedIdea = await response.json();
        setIdea({ ...idea, ...updatedIdea });
      }
    } catch (error) {
      console.error("Failed to perform action:", error);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !idea) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetch(`http://localhost:8000/api/v1/ideas/${idea.idea_id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: newComment.trim() }),
      });

      if (response.ok) {
        const newCommentData = await response.json();
        setIdea({
          ...idea,
          comments: [...idea.comments, newCommentData],
          comments_count: idea.comments_count + 1,
        });
        setNewComment("");
      }
    } catch (error) {
      console.error("Failed to submit comment:", error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="text-center p-8 text-red-500">{error}</div>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="text-center p-8">Idea not found.</div>
      </div>
    );
  }
  
  const userInitial = user?.username?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <main className="max-w-xl mx-auto border-x border-gray-200 bg-white">
        <header className="sticky top-[80px] flex items-center space-x-6 p-4 bg-white/80 backdrop-blur-md z-10 border-b border-gray-200">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">Idea</h1>
        </header>

        <div className="p-4 border-b border-gray-200">
          <div className="flex items-start space-x-4 mb-4">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex-shrink-0 flex items-center justify-center">
              <span className="text-white font-bold text-xl">{idea.submitted_by_user?.username?.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <p 
                className="font-bold text-gray-900 hover:underline cursor-pointer"
                onClick={() => {
                  if (idea.submitted_by_user?.username) {
                    router.push(`/profile/${idea.submitted_by_user.username}`);
                  }
                }}
              >
                {idea.submitted_by_user?.username}
              </p>
              <p className="text-sm text-gray-500">@{idea.submitted_by_user?.username}</p>
            </div>
          </div>

          <p className="text-xl my-4 text-gray-900">{idea.title}</p>
          {idea.description && <p className="text-base text-gray-700 my-4">{idea.description}</p>}
          
          <p className="text-sm text-gray-500 border-b border-gray-200 pb-4">
            {formatFullDate(idea.created_at)}
          </p>

          <div className="flex items-center space-x-6 py-3 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="font-bold">{idea.likes_count}</span>
              <span className="text-gray-500">Likes</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="font-bold">{idea.comments_count}</span>
              <span className="text-gray-500">Replies</span>
            </div>
          </div>

          <div className="flex items-center justify-around mt-1 text-gray-500">
            <ActionButton icon={MessageCircle} hoverColor="hover:text-blue-500" />
            <ActionButton icon={Heart} isActive={idea.is_liked} activeColor="text-red-500" hoverColor="hover:text-red-500" onClick={() => handleAction(`http://localhost:8000/api/v1/ideas/${idea.idea_id}/like`)} />
            <ActionButton icon={Bookmark} isActive={idea.is_bookmarked} activeColor="text-yellow-500" hoverColor="hover:text-yellow-500" onClick={() => handleAction(`http://localhost:8000/api/v1/ideas/${idea.idea_id}/bookmark`)} />
            <ActionButton icon={Share} hoverColor="hover:text-green-500" />
          </div>
        </div>

        <div className="p-4 border-b border-gray-200">
          <form onSubmit={handleSubmitComment} className="flex items-start space-x-4">
            <div className="w-11 h-11 bg-orange-500 rounded-full flex-shrink-0 flex items-center justify-center">
              <span className="text-white font-semibold">{userInitial}</span>
            </div>
            <div className="flex-1">
              <Textarea
                placeholder="Post your reply"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={1}
                className="w-full bg-transparent border-none focus:ring-0 resize-none p-2 text-lg placeholder-gray-500"
              />
              <div className="flex justify-end mt-2">
                <Button type="submit" disabled={isSubmittingComment || !newComment.trim()} className="bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold px-5 py-2 text-sm">
                  {isSubmittingComment ? "Replying..." : "Reply"}
                </Button>
              </div>
            </div>
          </form>
        </div>

        <div className="divide-y divide-gray-200">
          {idea.comments.map((comment) => (
            <div key={comment.comment_id} className="p-4 hover:bg-gray-50/50">
              <div className="flex items-start space-x-3">
                <div className="w-11 h-11 bg-orange-500 rounded-full flex-shrink-0 flex items-center justify-center">
                  <span className="text-white font-semibold">{comment.user.username.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 text-sm">
                    <span 
                      className="font-bold text-gray-900 hover:underline cursor-pointer"
                      onClick={() => router.push(`/profile/${comment.user.username}`)}
                    >
                      {comment.user.username}
                    </span>
                    <span className="text-gray-500">· {formatTimeAgo(comment.created_at)}</span>
                  </div>
                  <p className="text-base mt-1 text-gray-900">{comment.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {idea.comments.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p>No replies yet.</p>
          </div>
        )}
      </main>
    </div>
  );
}

function ActionButton({ icon: Icon, isActive, activeColor, hoverColor, onClick }: { icon: React.ElementType, isActive?: boolean, activeColor?: string, hoverColor?: string, onClick?: () => void }) {
  return (
    <button onClick={onClick} className={`flex items-center space-x-2 group transition-colors duration-150 p-2 rounded-full ${hoverColor}`}>
      <Icon className={`w-6 h-6 ${isActive ? activeColor : ""} ${isActive && (Icon === Heart || Icon === Bookmark) ? 'fill-current' : ''}`} />
    </button>
  );
}