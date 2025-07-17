"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IdeaCard } from "@/components/idea-card";
import { CalendarDays, Plus, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, DollarSign, BarChart3 } from "lucide-react";
import type { UserProfile, UserActivity, Idea } from "@/lib/types";

interface Order {
  order_id: number;
  contract_id: number;
  side: string;
  contract_side: string;
  order_type: string;
  price: string;
  quantity: number;
  filled_quantity: number;
  status: string;
  created_at: string;
  contract: {
    contract_id: number;
    title: string;
    market: {
      market_id: number;
      title: string;
      category: string;
      status: string;
    };
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const username = params.username as string;
  
  const [currentUser, setCurrentUser] = useState<{ user_id: number; username: string; email: string } | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activity, setActivity] = useState<UserActivity[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
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

          // Get user's orders
          const ordersRes = await fetch("http://localhost:8000/api/v1/orders/", { credentials: "include" });
          if (ordersRes.ok) {
            const ordersData = await ordersRes.json();
            setOrders(ordersData);
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
    linked_market_id: undefined,
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

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Open</Badge>;
      case 'partially_filled':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Partial</Badge>;
      case 'filled':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Filled</Badge>;
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPositionValue = (position: any) => {
    // Handle cases where quantity or avg_price might be undefined (for other users)
    const quantity = position.quantity || 0;
    const avgPrice = position.avg_price ? parseFloat(position.avg_price) : 0;
    
    const currentValue = quantity * 1.0; // Assuming $1 max payout
    const costBasis = quantity * avgPrice;
    const pnl = currentValue - costBasis;
    return { currentValue, costBasis, pnl };
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
        {/* Profile Header */}
        <div className="bg-gray-900 h-64 relative">
          <div className="absolute -bottom-20 left-12">
            {profile.profile_picture ? (
              <img
                src={`http://localhost:8000${profile.profile_picture}`}
                alt={profile.username}
                className="w-40 h-40 rounded-full border-4 border-white shadow-lg object-cover"
              />
            ) : (
              <img
                src="/default_icon.jpg"
                alt={profile.username}
                className="w-40 h-40 rounded-full border-4 border-white shadow-lg object-cover"
              />
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="px-12 pt-24 pb-8">
          <div className="flex justify-between items-start">
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
                {profile.balance !== undefined && profile.is_own_profile && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">${(profile.balance / 100).toFixed(2)}</div>
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

        {/* Tabs */}
        <div className="border-t border-gray-200">
          <Tabs defaultValue={profile.is_own_profile ? "positions" : "ideas"} className="w-full">
            <div className="flex border-b border-gray-200">
              <TabsList className="bg-transparent p-0 h-auto space-x-0">
                {profile.is_own_profile && (
                  <>
                <TabsTrigger 
                      value="positions" 
                  className="bg-transparent border-0 rounded-none px-6 py-4 text-gray-600 font-semibold relative data-[state=active]:bg-transparent data-[state=active]:text-black hover:text-black transition-colors data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-black"
                >
                      Active Positions <sup className="text-xs ml-1 font-normal">{profile.bets.length}</sup>
                </TabsTrigger>
                <TabsTrigger 
                      value="orders" 
                  className="bg-transparent border-0 rounded-none px-6 py-4 text-gray-600 font-semibold relative data-[state=active]:bg-transparent data-[state=active]:text-black hover:text-black transition-colors data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-black"
                >
                      Pending Orders <sup className="text-xs ml-1 font-normal">{orders.filter(o => o.status === 'open' || o.status === 'partially_filled').length}</sup>
                </TabsTrigger>
                  </>
                )}
                <TabsTrigger 
                  value="ideas" 
                  className="bg-transparent border-0 rounded-none px-6 py-4 text-gray-600 font-semibold relative data-[state=active]:bg-transparent data-[state=active]:text-black hover:text-black transition-colors data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-black"
                >
                  Market Ideas <sup className="text-xs ml-1 font-normal">{profile.ideas.length}</sup>
                </TabsTrigger>
                {profile.is_own_profile && (
                  <TabsTrigger 
                    value="activity" 
                    className="bg-transparent border-0 rounded-none px-6 py-4 text-gray-600 font-semibold relative data-[state=active]:bg-transparent data-[state=active]:text-black hover:text-black transition-colors data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-black"
                  >
                    Recent Activity
                  </TabsTrigger>
                )}
              </TabsList>
            </div>

            {/* Active Positions Tab */}
            {profile.is_own_profile && (
              <TabsContent value="positions" className="p-12">
              {profile.bets.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-xl">No active positions</p>
                  <p className="text-sm mt-2">When you place bets, they'll show up here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {profile.bets.map((bet) => {
                    const { currentValue, costBasis, pnl } = getPositionValue(bet);
                    const isProfit = pnl >= 0;
                    
                    return (
                      <Card 
                        key={`bet-${bet.market_id}-${bet.outcome}`} 
                        className="hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => router.push(`/markets/${bet.market_id}`)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <span className="text-gray-600 text-xs font-bold">
                                    {bet.market_category?.charAt(0) || "M"}
                                  </span>
                        </div>
                                <div>
                                  <h3 className="font-semibold text-gray-900 line-clamp-1">{bet.contract_title}</h3>
                                  <p className="text-sm text-gray-500">{bet.market_title}</p>
                        </div>
                      </div>

                              <div className="flex items-center gap-4 mb-3">
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                              bet.outcome === 'YES' ? 'bg-gray-100 text-gray-900' : 'bg-gray-100 text-gray-900'
                            }`}>
                              {bet.outcome}
                            </span>
                                {bet.quantity !== undefined && (
                                  <span className="text-gray-600">
                                    {bet.quantity} shares
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-900">
                                ${currentValue.toFixed(2)}
                              </div>
                              <div className={`text-sm font-medium ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
                                {isProfit ? '+' : ''}${pnl.toFixed(2)}
                                {isProfit ? (
                                  <TrendingUp className="w-4 h-4 inline ml-1" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 inline ml-1" />
                                )}
                              </div>
                              {bet.avg_price !== undefined && (
                                <div className="text-xs text-gray-500">
                                  Avg: ${Number(bet.avg_price)?.toFixed(2)}
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
            )}

            {/* Pending Orders Tab */}
            {profile.is_own_profile && (
              <TabsContent value="orders" className="p-12">
              {orders.filter(o => o.status === 'open' || o.status === 'partially_filled').length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-xl">No pending orders</p>
                  <p className="text-sm mt-2">Your open orders will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.filter(o => o.status === 'open' || o.status === 'partially_filled').map((order) => (
                    <Card 
                      key={order.order_id} 
                      className="hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => router.push(`/markets/${order.contract.market.market_id}`)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                <span className="text-gray-600 text-xs font-bold">
                                  {order.contract.market.category?.charAt(0) || "M"}
                                </span>
                              </div>
                              <div>
                                <h3 className="font-semibold text-gray-900 line-clamp-1">{order.contract.title}</h3>
                                <p className="text-sm text-gray-500">{order.contract.market.title}</p>
                          </div>
                        </div>
                        
                            <div className="flex items-center gap-4 mb-2">
                              <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                                order.side === 'BUY' ? 'bg-gray-100 text-gray-900' : 'bg-gray-100 text-gray-900'
                              }`}>
                                {order.side} {order.contract_side}
                              </span>
                              {getOrderStatusBadge(order.status)}
                            </div>
                            
                            <div className="text-sm text-gray-600">
                              {order.filled_quantity}/{order.quantity} filled at ${parseFloat(order.price).toFixed(2)}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              ${(parseFloat(order.price) * order.quantity).toFixed(2)}
                      </div>
                            <div className="text-sm text-gray-500">
                              {formatTimeAgo(order.created_at)}
                        </div>
                            <Button variant="outline" size="sm" className="mt-2">
                              Cancel
                        </Button>
                      </div>
                    </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
            )}

            {/* Market Ideas Tab */}
            <TabsContent value="ideas" className="p-0">
              {profile.ideas.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-xl">No market ideas yet</p>
                  <p className="text-sm mt-2">When you submit ideas for new markets, they'll show up here.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {profile.ideas.map((idea) => (
                    <IdeaCard 
                      key={`idea-${idea.idea_id}`}
                      idea={convertToIdeaFormat(idea)} 
                      onUpdate={handleIdeaUpdate}
                      onDelete={handleIdeaDelete}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Recent Activity Tab - Own profile only */}
            {profile.is_own_profile && (
              <TabsContent value="activity" className="p-12">
                <div className="space-y-6">
                  {activity.length === 0 ? (
                    <div className="text-center py-16 text-gray-500">
                      <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-xl">No recent activity</p>
                      <p className="text-sm mt-2">Your activity will show up here.</p>
                    </div>
                  ) : (
                    activity.map((item, index) => (
                      <Card key={`activity-${item.type}-${index}-${item.created_at}`} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              {item.type === 'idea_created' && <DollarSign className="w-5 h-5 text-gray-600" />}
                              {item.type === 'comment_created' && <Clock className="w-5 h-5 text-gray-600" />}
                              {item.type === 'bet_resolved' && <CheckCircle className="w-5 h-5 text-gray-600" />}
                            </div>
                            <div className="flex-1">
                            <p className="text-gray-900 text-base">{item.description}</p>
                            <span className="text-sm text-gray-500">{formatTimeAgo(item.created_at)}</span>
                            </div>
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