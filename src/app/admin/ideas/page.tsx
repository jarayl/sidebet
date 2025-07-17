"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  Lightbulb,
  User,
  Calendar,
  MessageSquare,
  Heart,
  Link,
  AlertCircle,
  TrendingUp,
  Users
} from "lucide-react";

interface Idea {
  idea_id: number;
  title: string;
  description: string;
  submitted_by: number;
  created_at: string;
  updated_at: string;
  status: "pending" | "accepted" | "rejected";
  linked_market_id?: number;
  likes_count: number;
  comments_count: number;
  submitted_by_user?: {
    user_id: number;
    username: string;
    profile_picture?: string;
  };
  is_liked: boolean;
  is_bookmarked: boolean;
}

interface Market {
  market_id: number;
  title: string;
  status: string;
}

interface IdeasStats {
  total_ideas: number;
  pending_ideas: number;
  accepted_ideas: number;
  rejected_ideas: number;
  recent_ideas_30d: number;
  linked_to_markets: number;
  approval_rate: number;
}

export default function AdminIdeas() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [filteredIdeas, setFilteredIdeas] = useState<Idea[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [ideasStats, setIdeasStats] = useState<IdeasStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [linkedMarketId, setLinkedMarketId] = useState<string>("");
  const [backendError, setBackendError] = useState<string | null>(null);

  useEffect(() => {
    fetchIdeas();
    fetchMarkets();
    fetchIdeasStats();
  }, []);

  useEffect(() => {
    filterIdeas();
  }, [ideas, searchTerm, statusFilter]);

  const fetchIdeas = async () => {
    try {
      setBackendError(null);
      let url = "http://localhost:8000/api/v1/admin/ideas";
      if (statusFilter !== "all") {
        url += `?status_filter=${statusFilter}`;
      }
      
      const response = await fetch(url, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setIdeas(data);
      } else if (response.status === 401) {
        setBackendError("Authentication required. Please log in as an administrator.");
      } else if (response.status === 403) {
        setBackendError("Access denied. Administrator privileges required.");
      } else {
        setBackendError(`Server error: ${response.status}`);
        console.error("Failed to fetch ideas:", response.status, await response.text());
      }
    } catch (error) {
      console.error("Failed to fetch ideas:", error);
      setBackendError("Unable to connect to server. Please ensure the backend is running.");
      // Set empty array on error to prevent UI issues
      setIdeas([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMarkets = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/markets/", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setMarkets(data.filter((market: Market) => market.status === "open"));
      } else {
        console.error("Failed to fetch markets:", response.status);
      }
    } catch (error) {
      console.error("Failed to fetch markets:", error);
      setMarkets([]);
    }
  };

  const fetchIdeasStats = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/admin/ideas/stats", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setIdeasStats(data);
      } else {
        console.error("Failed to fetch ideas stats:", response.status);
      }
    } catch (error) {
      console.error("Failed to fetch ideas stats:", error);
      setIdeasStats(null);
    }
  };

  const filterIdeas = () => {
    let filtered = ideas;

    if (searchTerm) {
      filtered = filtered.filter(idea =>
        idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idea.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idea.submitted_by_user?.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(idea => idea.status === statusFilter);
    }

    setFilteredIdeas(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Pending</Badge>;
      case "accepted":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Accepted</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleUpdateIdeaStatus = async (ideaId: number, newStatus: "accepted" | "rejected", marketId?: string) => {
    try {
      const body: any = { status: newStatus };
      if (newStatus === "accepted" && marketId) {
        body.linked_market_id = parseInt(marketId);
      }

      const response = await fetch(`http://localhost:8000/api/v1/admin/ideas/${ideaId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log("Idea status updated:", responseData);
        fetchIdeas();
        fetchIdeasStats();
        setIsDetailModalOpen(false);
        setLinkedMarketId("");
      } else {
        const errorData = await response.json();
        alert(`Failed to update idea status: ${errorData.detail || errorData.message || JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error("Failed to update idea status:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`An unexpected error occurred: ${errorMessage}`);
    }
  };

  const IdeaActions = ({ idea }: { idea: Idea }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => {
          setSelectedIdea(idea);
          setIsDetailModalOpen(true);
        }}>
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </DropdownMenuItem>
        
        {idea.status === "pending" && (
          <>
            <DropdownMenuItem onClick={() => handleUpdateIdeaStatus(idea.idea_id, "accepted")} className="text-green-600">
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleUpdateIdeaStatus(idea.idea_id, "rejected")} className="text-red-600">
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </DropdownMenuItem>
          </>
        )}
        
        {idea.status === "accepted" && (
          <DropdownMenuItem onClick={() => handleUpdateIdeaStatus(idea.idea_id, "rejected")} className="text-red-600">
            <XCircle className="w-4 h-4 mr-2" />
            Reject
          </DropdownMenuItem>
        )}
        
        {idea.status === "rejected" && (
          <DropdownMenuItem onClick={() => handleUpdateIdeaStatus(idea.idea_id, "accepted")} className="text-green-600">
            <CheckCircle className="w-4 h-4 mr-2" />
            Approve
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading ideas...</div>
        </div>
      </div>
    );
  }

  if (backendError) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <div className="text-lg text-gray-900 mb-2">Unable to Load Ideas</div>
              <div className="text-gray-600 mb-4">{backendError}</div>
              <Button onClick={() => {
                setIsLoading(true);
                fetchIdeas();
                fetchMarkets();
                fetchIdeasStats();
              }}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ideas Management</h1>
              <p className="text-gray-600 mt-2">Review and moderate user-submitted market ideas</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="px-3 py-1">
                {filteredIdeas.length} ideas
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {ideasStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Ideas</p>
                    <p className="text-2xl font-bold text-gray-900">{ideasStats.total_ideas}</p>
                    <p className="text-xs text-gray-500 mt-1">+{ideasStats.recent_ideas_30d} this month</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Lightbulb className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-900">{ideasStats.pending_ideas}</p>
                    <p className="text-xs text-gray-500 mt-1">Awaiting review</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Approved</p>
                    <p className="text-2xl font-bold text-gray-900">{ideasStats.accepted_ideas}</p>
                    <p className="text-xs text-gray-500 mt-1">{ideasStats.approval_rate.toFixed(1)}% approval rate</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Linked to Markets</p>
                    <p className="text-2xl font-bold text-gray-900">{ideasStats.linked_to_markets}</p>
                    <p className="text-xs text-gray-500 mt-1">Active markets</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Link className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search ideas by title, description, or author..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ideas List */}
        <div className="space-y-4">
          {filteredIdeas.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <Lightbulb className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-xl text-gray-500 mb-2">No ideas found</p>
                <p className="text-gray-400">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your search or filter criteria" 
                    : "No ideas have been submitted yet"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredIdeas.map((idea) => (
              <Card key={idea.idea_id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{idea.title}</h3>
                        {getStatusBadge(idea.status)}
                        {idea.linked_market_id && (
                          <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                            <Link className="w-3 h-3 mr-1" />
                            Linked
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">{idea.description}</p>
                      
                      <div className="flex items-center gap-6 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <User className="w-4 h-4" />
                          <div>
                            <p className="font-medium">Submitted by</p>
                            <p>{idea.submitted_by_user?.username || "Unknown User"}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <div>
                            <p className="font-medium">Created</p>
                            <p>{formatDate(idea.created_at)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Heart className="w-4 h-4" />
                            <span>{idea.likes_count}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            <span>{idea.comments_count}</span>
                          </div>
                        </div>
                      </div>
                      
                      {idea.status === "pending" && (
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleUpdateIdeaStatus(idea.idea_id, "accepted")}
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-600 border-red-600 hover:bg-red-50"
                            onClick={() => handleUpdateIdeaStatus(idea.idea_id, "rejected")}
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-6">
                      <IdeaActions idea={idea} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Idea Detail Modal */}
        {selectedIdea && (
          <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Lightbulb className="w-6 h-6 text-purple-600" />
                  <div className="flex flex-col">
                    <span>{selectedIdea.title}</span>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(selectedIdea.status)}
                      {selectedIdea.linked_market_id && (
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                          <Link className="w-3 h-3 mr-1" />
                          Market #{selectedIdea.linked_market_id}
                        </Badge>
                      )}
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Idea Details */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                  <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{selectedIdea.description}</p>
                </div>
                
                {/* Author Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Submitted by</h4>
                    <div className="flex items-center gap-2">
                      {selectedIdea.submitted_by_user?.profile_picture ? (
                        <img
                          src={`http://localhost:8000${selectedIdea.submitted_by_user.profile_picture}`}
                          alt={selectedIdea.submitted_by_user.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-500" />
                        </div>
                      )}
                      <span className="text-gray-900">{selectedIdea.submitted_by_user?.username || "Unknown User"}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Engagement</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        <span>{selectedIdea.likes_count} likes</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{selectedIdea.comments_count} comments</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Timestamps */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Created</h4>
                    <p className="text-gray-600">{formatDate(selectedIdea.created_at)}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-1">Last Updated</h4>
                    <p className="text-gray-600">{formatDate(selectedIdea.updated_at)}</p>
                  </div>
                </div>
                
                {/* Action Section */}
                {selectedIdea.status === "pending" && (
                  <div className="border-t pt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-4">Moderation Actions</h4>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-600 mb-2 block">Link to Market (Optional)</label>
                        <select
                          value={linkedMarketId}
                          onChange={(e) => setLinkedMarketId(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        >
                          <option value="">Select a market (optional)</option>
                          {markets.map((market) => (
                            <option key={market.market_id} value={market.market_id.toString()}>
                              #{market.market_id} - {market.title}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="flex gap-3">
                        <Button 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleUpdateIdeaStatus(selectedIdea.idea_id, "accepted", linkedMarketId || undefined)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve{linkedMarketId ? " & Link" : ""}
                        </Button>
                        <Button 
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => handleUpdateIdeaStatus(selectedIdea.idea_id, "rejected")}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedIdea.status !== "pending" && (
                  <div className="border-t pt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-4">Change Status</h4>
                    <div className="flex gap-3">
                      {selectedIdea.status === "rejected" && (
                        <Button 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleUpdateIdeaStatus(selectedIdea.idea_id, "accepted")}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approve
                        </Button>
                      )}
                      {selectedIdea.status === "accepted" && (
                        <Button 
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => handleUpdateIdeaStatus(selectedIdea.idea_id, "rejected")}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Reject
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
} 