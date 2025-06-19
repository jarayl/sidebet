"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { IdeaCard } from "@/components/idea-card";
import { CalendarDays, Plus } from "lucide-react";
import type { UserProfile, UserActivity, Idea } from "@/lib/types";

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  
  const [currentUser, setCurrentUser] = useState<{ user_id: number; username: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activity, setActivity] = useState<UserActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const userRes = await fetch("http://localhost:8000/api/v1/users/me", { credentials: "include" });
        if (!userRes.ok) throw new Error("Not authenticated");
        const userData = await userRes.json();
        setCurrentUser(userData);

        // Get profile data
        const profileRes = await fetch(`http://localhost:8000/api/v1/profiles/${username}`, { credentials: "include" });
        if (!profileRes.ok) throw new Error("Profile not found");
        const profileData = await profileRes.json();
        setProfile(profileData);
        setIsFollowing(profileData.is_following);

        // Get activity if it's own profile
        if (profileData.is_own_profile) {
          const activityRes = await fetch(`http://localhost:8000/api/v1/profiles/${username}/activity`, { credentials: "include" });
          if (activityRes.ok) {
            const activityData = await activityRes.json();
            setActivity(activityData);
          }
        }
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

    fetchData();
  }, [username, router]);

  const handleFollow = async () => {
    if (!profile) return;
    
    try {
      const response = await fetch(`http://localhost:8000/api/v1/profiles/${username}/follow`, {
        method: "POST",
        credentials: "include",
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsFollowing(data.is_following);
        setProfile({
          ...profile,
          followers_count: data.followers_count,
          is_following: data.is_following,
        });
      }
    } catch (error) {
      console.error("Failed to toggle follow:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
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

  // Convert UserIdea to Idea format for IdeaCard
  const convertToIdeaFormat = (userIdea: any): Idea => ({
    idea_id: userIdea.idea_id,
    title: userIdea.title,
    description: userIdea.description,
    submitted_by: profile?.user_id || 0,
    created_at: userIdea.created_at,
    updated_at: userIdea.created_at,
    status: "pending" as const,
    linked_market_id: null,
    likes_count: userIdea.likes_count,
    comments_count: userIdea.comments_count,
    submitted_by_user: {
      user_id: profile?.user_id || 0,
      username: profile?.username || "",
    },
    is_liked: false,
    is_bookmarked: false,
  });

  const handleIdeaUpdate = (updatedIdea: Idea) => {
    // Update the idea in the profile
    if (profile) {
      const updatedIdeas = profile.ideas.map(idea => 
        idea.idea_id === updatedIdea.idea_id 
          ? { ...idea, likes_count: updatedIdea.likes_count }
          : idea
      );
      setProfile({ ...profile, ideas: updatedIdeas });
    }
  };

  const handleIdeaDelete = (ideaId: number) => {
    // Remove the idea from the profile
    if (profile) {
      const filteredIdeas = profile.ideas.filter(idea => idea.idea_id !== ideaId);
      setProfile({ ...profile, ideas: filteredIdeas });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={currentUser} />
        <div className="text-center p-8 text-red-500">{error}</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={currentUser} />
        <div className="text-center p-8">Profile not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={currentUser} />
      
      <div className="max-w-5xl mx-auto bg-white">
        {/* Profile Header - Matching the example UI exactly */}
        <div className="bg-gradient-to-r from-blue-400 to-purple-500 h-64 relative">
          <div className="absolute -bottom-20 left-12">
            {profile.profile_picture ? (
              <img
                src={`http://localhost:8000${profile.profile_picture}`}
                alt={profile.username}
                className="w-40 h-40 rounded-full border-4 border-white shadow-lg object-cover"
              />
            ) : (
              <div className="w-40 h-40 bg-orange-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
                <span className="text-white text-5xl font-bold">
                  {profile.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Profile Info - Exact layout from example */}
        <div className="px-12 pt-24 pb-8">
          <div className="flex justify-between items-start">
            {/* Left side: name, title, location, date */}
            <div className="flex-1 max-w-md">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold text-gray-900">{profile.username}</h1>
              </div>
              {profile.email && (
                <p className="text-gray-500 mb-4">{profile.email}</p>
              )}
              <div className="flex items-center text-gray-500">
                <CalendarDays className="w-4 h-4 mr-2" />
                <span>Joined {formatDate(profile.created_at)}</span>
              </div>
            </div>
            
            {/* Right side: stats and buttons - Exact layout from example */}
            <div className="flex flex-col items-end gap-6">
              <div className="flex items-center gap-8">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{profile.followers_count}</div>
                  <div className="text-sm text-gray-500">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{profile.following_count}</div>
                  <div className="text-sm text-gray-500">Following</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{profile.likes_count}</div>
                  <div className="text-sm text-gray-500">Likes</div>
                </div>
                {profile.balance !== undefined && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">${profile.balance}</div>
                    <div className="text-sm text-gray-500">Balance</div>
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                {!profile.is_own_profile && (
                  <Button
                    onClick={handleFollow}
                    variant={isFollowing ? "outline" : "default"}
                    className="px-8 py-2 rounded-full font-semibold text-sm"
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                )}
                {profile.is_own_profile && (
                  <Button 
                    variant="outline" 
                    className="px-8 py-2 rounded-full font-semibold text-sm"
                    onClick={() => router.push('/settings')}
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs - Matching example layout with left alignment and proper styling */}
        <div className="border-t border-gray-200">
          <Tabs defaultValue="bets" className="w-full">
            <div className="flex border-b border-gray-200">
              <TabsList className="bg-transparent p-0 h-auto space-x-0">
                <TabsTrigger 
                  value="bets" 
                  className="bg-transparent border-0 rounded-none px-6 py-4 text-gray-600 font-semibold relative data-[state=active]:bg-transparent data-[state=active]:text-black hover:text-black transition-colors data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-black"
                >
                  Bets <sup className="text-xs ml-1 font-normal">{profile.bets.length}</sup>
                </TabsTrigger>
                <TabsTrigger 
                  value="posts" 
                  className="bg-transparent border-0 rounded-none px-6 py-4 text-gray-600 font-semibold relative data-[state=active]:bg-transparent data-[state=active]:text-black hover:text-black transition-colors data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-black"
                >
                  Posts
                </TabsTrigger>
                <TabsTrigger 
                  value="replies" 
                  className="bg-transparent border-0 rounded-none px-6 py-4 text-gray-600 font-semibold relative data-[state=active]:bg-transparent data-[state=active]:text-black hover:text-black transition-colors data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-black"
                >
                  Replies
                </TabsTrigger>
                {profile.is_own_profile && (
                  <TabsTrigger 
                    value="activity" 
                    className="bg-transparent border-0 rounded-none px-6 py-4 text-gray-600 font-semibold relative data-[state=active]:bg-transparent data-[state=active]:text-black hover:text-black transition-colors data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-black"
                  >
                    Activity
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* Bets Tab - Market Grid Layout */}
            <TabsContent value="bets" className="p-12">
              {profile.bets.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <p className="text-xl">No active bets</p>
                  <p className="text-sm mt-2">When you place bets, they'll show up here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {profile.bets.map((bet) => (
                    <div key={`bet-${bet.market_id}-${bet.outcome}`} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-shadow flex flex-col h-full min-h-[320px]">
                      {/* Header with category and title */}
                      <div className="flex items-start gap-4 mb-6">
                        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex-shrink-0 flex items-center justify-center">
                          <span className="text-white text-sm font-bold">BET</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          {bet.market_category && (
                            <div className="text-xs text-gray-500 mb-2 uppercase tracking-wide font-semibold">{bet.market_category}</div>
                          )}
                          <h3 className="text-lg font-bold text-gray-900 leading-tight line-clamp-2">
                            {bet.market_title}
                          </h3>
                        </div>
                      </div>

                      {/* Bet details */}
                      <div className="space-y-4 mb-6 flex-grow">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-700 font-medium">Position</span>
                            <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${
                              bet.outcome === 'YES' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {bet.outcome}
                            </span>
                          </div>
                        </div>
                        
                        {bet.quantity !== undefined && bet.avg_price !== undefined && (
                          <div className="space-y-3 text-sm text-gray-600">
                            <div className="flex justify-between">
                              <span>Shares:</span>
                              <span className="font-semibold text-gray-900">{bet.quantity}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Avg Price:</span>
                              <span className="font-semibold text-gray-900">${Number(bet.avg_price)?.toFixed(2)}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bottom section */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                        <div className="text-sm text-gray-500 font-medium">
                          Active Position
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="w-10 h-10 rounded-full hover:bg-gray-100"
                        >
                          <Plus className="w-5 h-5 text-gray-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Posts Tab - Using IdeaCard component */}
            <TabsContent value="posts" className="p-0">
              {profile.ideas.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <p className="text-xl">No posts yet</p>
                  <p className="text-sm mt-2">When you post ideas, they'll show up here.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {profile.ideas.map((idea) => (
                    <IdeaCard 
                      key={`idea-${idea.idea_id}`}
                      idea={convertToIdeaFormat(idea)} 
                      currentUser={currentUser}
                      onUpdate={handleIdeaUpdate}
                      onDelete={handleIdeaDelete}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Replies Tab */}
            <TabsContent value="replies" className="p-12">
              <div className="space-y-6">
                {profile.replies.length === 0 ? (
                  <div className="text-center py-16 text-gray-500">
                    <p className="text-xl">No replies yet</p>
                    <p className="text-sm mt-2">When you reply to posts, they'll show up here.</p>
                  </div>
                ) : (
                  profile.replies.map((reply) => (
                    <Card key={`reply-${reply.comment_id}`} className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => router.push(`/ideas/${reply.idea_id}`)}>
                      <CardContent className="p-6">
                        <div className="text-sm text-gray-500 mb-3">
                          Replying to: <span className="font-medium text-gray-700">{reply.idea_title}</span>
                        </div>
                        <p className="text-gray-900 mb-3 text-base">{reply.content}</p>
                        <div className="text-sm text-gray-500">
                          {formatTimeAgo(reply.created_at)}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Activity Tab - Own profile only */}
            {profile.is_own_profile && (
              <TabsContent value="activity" className="p-12">
                <div className="space-y-6">
                  {activity.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                      <p className="text-xl">No recent activity</p>
                      <p className="text-sm mt-2">Your activity will show up here.</p>
                    </div>
                  ) : (
                    activity.map((item, index) => (
                      <Card key={`activity-${item.type}-${index}-${item.created_at}`} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start">
                            <p className="text-gray-900 text-base">{item.description}</p>
                            <span className="text-sm text-gray-500">{formatTimeAgo(item.created_at)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
} 