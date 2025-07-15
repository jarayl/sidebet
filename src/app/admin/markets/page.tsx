"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Play, 
  Pause, 
  CheckCircle, 
  XCircle,
  Calendar,
  Users,
  TrendingUp,
  Search,
  Filter,
  Download
} from "lucide-react";

interface Market {
  market_id: number;
  title: string;
  description: string;
  category: string;
  image_url?: string;
  start_time: string;
  close_time: string;
  resolve_time?: string;
  status: string;
  result?: string;
  contracts: Contract[];
}

interface Contract {
  contract_id: number;
  title: string;
  description?: string;
  status: string;
  resolution?: string;
}

export default function AdminMarkets() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [filteredMarkets, setFilteredMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMarket, setEditingMarket] = useState<Market | null>(null);

  // Create/Edit form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    image_url: "",
    start_time: "",
    close_time: "",
    resolve_time: "",
    contracts: [{ title: "", description: "" }]
  });

  useEffect(() => {
    fetchMarkets();
  }, []);

  useEffect(() => {
    filterMarkets();
  }, [markets, searchTerm, statusFilter]);

  const fetchMarkets = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/markets/", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setMarkets(data);
      }
    } catch (error) {
      console.error("Failed to fetch markets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterMarkets = () => {
    let filtered = markets;

    if (searchTerm) {
      filtered = filtered.filter(market =>
        market.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        market.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        market.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(market => market.status === statusFilter);
    }

    setFilteredMarkets(filtered);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-green-100 text-green-800 border-green-200">Open</Badge>;
      case "closed":
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Closed</Badge>;
      case "resolved":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Resolved</Badge>;
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800 border-red-200">Cancelled</Badge>;
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

  const handleCreateMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:8000/api/v1/markets/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsCreateModalOpen(false);
        resetForm();
        fetchMarkets();
      } else {
        const errorData = await response.json();
        alert(`Failed to create market: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Failed to create market:", error);
      alert("Failed to create market");
    }
  };

  const handleUpdateMarketStatus = async (marketId: number, action: string, result?: string) => {
    try {
      let url = `http://localhost:8000/api/v1/markets/${marketId}`;
      let body: any = {};

      if (action === "resolve") {
        url += "/resolve";
        body = { result: result || "UNDECIDED" };
      } else if (action === "close") {
        url += "/close";
      }

      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
      });

      if (response.ok) {
        fetchMarkets();
      } else {
        const errorData = await response.json();
        alert(`Failed to ${action} market: ${errorData.detail}`);
      }
    } catch (error) {
      console.error(`Failed to ${action} market:`, error);
      alert(`Failed to ${action} market`);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "",
      image_url: "",
      start_time: "",
      close_time: "",
      resolve_time: "",
      contracts: [{ title: "", description: "" }]
    });
    setEditingMarket(null);
  };

  const addContract = () => {
    setFormData(prev => ({
      ...prev,
      contracts: [...prev.contracts, { title: "", description: "" }]
    }));
  };

  const removeContract = (index: number) => {
    setFormData(prev => ({
      ...prev,
      contracts: prev.contracts.filter((_, i) => i !== index)
    }));
  };

  const updateContract = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      contracts: prev.contracts.map((contract, i) =>
        i === index ? { ...contract, [field]: value } : contract
      )
    }));
  };

  const MarketActions = ({ market }: { market: Market }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => {
          setEditingMarket(market);
          setFormData({
            title: market.title,
            description: market.description,
            category: market.category,
            image_url: market.image_url || "",
            start_time: market.start_time.slice(0, 16),
            close_time: market.close_time.slice(0, 16),
            resolve_time: market.resolve_time?.slice(0, 16) || "",
            contracts: market.contracts.map(c => ({ title: c.title, description: c.description || "" }))
          });
          setIsCreateModalOpen(true);
        }}>
          <Edit className="w-4 h-4 mr-2" />
          Edit Market
        </DropdownMenuItem>
        
        {market.status === "open" && (
          <DropdownMenuItem onClick={() => handleUpdateMarketStatus(market.market_id, "close")}>
            <Pause className="w-4 h-4 mr-2" />
            Close Market
          </DropdownMenuItem>
        )}
        
        {(market.status === "closed" || market.status === "open") && (
          <>
            <DropdownMenuItem onClick={() => handleUpdateMarketStatus(market.market_id, "resolve", "YES")}>
              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
              Resolve as YES
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleUpdateMarketStatus(market.market_id, "resolve", "NO")}>
              <XCircle className="w-4 h-4 mr-2 text-red-600" />
              Resolve as NO
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleUpdateMarketStatus(market.market_id, "resolve", "UNDECIDED")}>
              <XCircle className="w-4 h-4 mr-2 text-gray-600" />
              Resolve as Undecided
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading markets...</div>
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
              <h1 className="text-3xl font-bold text-gray-900">Markets Management</h1>
              <p className="text-gray-600 mt-2">Create, manage, and resolve prediction markets</p>
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700" onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Market
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingMarket ? "Edit Market" : "Create New Market"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateMarket} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="title">Market Title</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g., Harvard Basketball Championship 2024"
                        required
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Detailed description of the market conditions..."
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        value={formData.category}
                        onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                        placeholder="Sports, Politics, etc."
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="image_url">Image URL (optional)</Label>
                      <Input
                        id="image_url"
                        value={formData.image_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="start_time">Start Time</Label>
                      <Input
                        id="start_time"
                        type="datetime-local"
                        value={formData.start_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="close_time">Close Time</Label>
                      <Input
                        id="close_time"
                        type="datetime-local"
                        value={formData.close_time}
                        onChange={(e) => setFormData(prev => ({ ...prev, close_time: e.target.value }))}
                        required
                      />
                    </div>
                  </div>

                  {/* Contracts Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <Label className="text-base font-semibold">Contracts</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addContract}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Contract
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      {formData.contracts.map((contract, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-gray-700">Contract {index + 1}</span>
                            {formData.contracts.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeContract(index)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor={`contract-title-${index}`}>Title</Label>
                              <Input
                                id={`contract-title-${index}`}
                                value={contract.title}
                                onChange={(e) => updateContract(index, "title", e.target.value)}
                                placeholder="e.g., Harvard will win the championship"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor={`contract-description-${index}`}>Description (optional)</Label>
                              <Input
                                id={`contract-description-${index}`}
                                value={contract.description}
                                onChange={(e) => updateContract(index, "description", e.target.value)}
                                placeholder="Additional details about this outcome..."
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                      {editingMarket ? "Update Market" : "Create Market"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search markets..."
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
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                  <option value="resolved">Resolved</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Markets List */}
        <div className="space-y-4">
          {filteredMarkets.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="p-12 text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-xl text-gray-500 mb-2">No markets found</p>
                <p className="text-gray-400">
                  {searchTerm || statusFilter !== "all" 
                    ? "Try adjusting your search or filter criteria" 
                    : "Create your first market to get started"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredMarkets.map((market) => (
              <Card key={market.market_id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{market.title}</h3>
                        {getStatusBadge(market.status)}
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                          {market.category}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">{market.description}</p>
                      
                      <div className="grid grid-cols-3 gap-6 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <div>
                            <p className="font-medium">Closes</p>
                            <p>{formatDate(market.close_time)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Users className="w-4 h-4" />
                          <div>
                            <p className="font-medium">Contracts</p>
                            <p>{market.contracts.length} options</p>
                          </div>
                        </div>
                        
                        {market.result && (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <CheckCircle className="w-4 h-4" />
                            <div>
                              <p className="font-medium">Result</p>
                              <p className="font-semibold text-gray-900">{market.result}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Contracts */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">Contracts:</p>
                        <div className="flex flex-wrap gap-2">
                          {market.contracts.map((contract) => (
                            <div key={contract.contract_id} className="flex items-center gap-2 px-3 py-1 bg-gray-50 rounded-full">
                              <span className="text-sm text-gray-700">{contract.title}</span>
                              {contract.resolution && (
                                <Badge size="sm" className={`text-xs ${
                                  contract.resolution === "YES" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                                }`}>
                                  {contract.resolution}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-6">
                      <MarketActions market={market} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
} 