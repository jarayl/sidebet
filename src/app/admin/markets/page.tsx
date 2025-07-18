"use client";

import { config } from "@/lib/config";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
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
  Upload,
  ImageIcon
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

interface FormContract {
  contract_id?: number;
  title: string;
  description: string;
}

export default function AdminMarkets() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [filteredMarkets, setFilteredMarkets] = useState<Market[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingMarket, setEditingMarket] = useState<Market | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Create/Edit form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Sports",
    image_url: "",
    start_time: "",
    close_time: "",
    resolve_time: "",
    contracts: [{ title: "", description: "" }] as FormContract[]
  });

  useEffect(() => {
    fetchMarkets();
  }, []);

  useEffect(() => {
    filterMarkets();
  }, [markets, searchTerm, statusFilter]);

      const fetchMarkets = async () => {
      try {
        const response = await fetch(`${config.apiUrl}/api/v1/markets/`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setMarkets(data);
      } else {
        const errorData = await response.json();
        console.error("Failed to fetch markets:", errorData);
      }
    } catch (error) {
      console.error("Failed to fetch markets:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Network error:", errorMessage);
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMarket) {
      await handleUpdateMarket();
    } else {
      await handleCreateMarket();
    }
  };

  const handleCreateMarket = async () => {
    try {
      // Create FormData for multipart/form-data submission
      const submitFormData = new FormData();
      submitFormData.append('title', formData.title);
      submitFormData.append('description', formData.description);
      submitFormData.append('category', formData.category);
      submitFormData.append('start_time', new Date(formData.start_time).toISOString());
      submitFormData.append('close_time', new Date(formData.close_time).toISOString());
      if (formData.resolve_time) {
        submitFormData.append('resolve_time', new Date(formData.resolve_time).toISOString());
      }
      
      // Add image file if selected
      if (imageFile) {
        submitFormData.append('image', imageFile);
      }
      
      const response = await fetch(`${config.apiUrl}/api/v1/markets/`, {
        method: "POST",
        credentials: "include",
        body: submitFormData, // Don't set Content-Type header, let browser set it with boundary
      });

      if (response.ok) {
        setIsCreateModalOpen(false);
        resetForm();
        fetchMarkets();
      } else {
        const errorData = await response.json();
        console.error("Failed to create market:", errorData);
        alert(`Failed to create market: ${errorData.detail || errorData.message || JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error("Failed to create market:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`An unexpected error occurred: ${errorMessage}`);
    }
  };

  const handleUpdateMarket = async () => {
    if (!editingMarket) return;
    try {
      console.log("Updating market with data:", formData);
      
      // Create FormData for multipart/form-data submission
      const submitFormData = new FormData();
      submitFormData.append('title', formData.title);
      submitFormData.append('description', formData.description);
      submitFormData.append('category', formData.category);
      submitFormData.append('start_time', new Date(formData.start_time).toISOString());
      submitFormData.append('close_time', new Date(formData.close_time).toISOString());
      if (formData.resolve_time) {
        submitFormData.append('resolve_time', new Date(formData.resolve_time).toISOString());
      }
      
      // Add image file if selected
      if (imageFile) {
        submitFormData.append('image', imageFile);
      }
      
      console.log("Formatted submit data:", submitFormData);
      
      const response = await fetch(`${config.apiUrl}/api/v1/markets/${editingMarket.market_id}`, {
        method: "PUT",
        credentials: "include",
        body: submitFormData, // Don't set Content-Type header, let browser set it with boundary
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log("Market update successful:", responseData);
        setIsCreateModalOpen(false);
        resetForm();
        fetchMarkets();
      } else {
        const errorData = await response.json();
        console.error("Failed to update market:", errorData);
        alert(`Failed to update market: ${errorData.detail || errorData.message || JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error("Failed to update market:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`An unexpected error occurred: ${errorMessage}`);
    }
  };

  const handleUpdateMarketStatus = async (marketId: number, action: string, result?: string) => {
    try {
      let url = `${config.apiUrl}/api/v1/markets/${marketId}`;
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
        const responseData = await response.json();
        console.log(`Market ${action} successful:`, responseData);
        fetchMarkets();
        
        // Show success message if payouts were processed
        if (responseData.payouts_processed) {
          alert(`Market ${action} successful! Payouts have been automatically processed for all users.`);
        }
      } else {
        const errorData = await response.json();
        alert(`Failed to ${action} market: ${errorData.detail || errorData.message || JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error(`Failed to ${action} market:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to ${action} market: ${errorMessage}`);
    }
  };

  const handleResolveContract = async (marketId: number, contractId: number, resolution: string, contractTitle: string) => {
    if (!confirm(`Are you sure you want to resolve "${contractTitle}" as ${resolution}? This will process payouts immediately and cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`${config.apiUrl}/api/v1/markets/${marketId}/contracts/${contractId}/resolve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ resolution }),
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log("Contract resolution successful:", responseData);
        fetchMarkets();
        
        alert(`Contract "${contractTitle}" resolved as ${resolution}! Payouts have been processed automatically.`);
      } else {
        const errorData = await response.json();
        alert(`Failed to resolve contract: ${errorData.detail || errorData.message || JSON.stringify(errorData)}`);
      }
    } catch (error) {
      console.error("Failed to resolve contract:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to resolve contract: ${errorMessage}`);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      category: "Sports",
      image_url: "",
      start_time: "",
      close_time: "",
      resolve_time: "",
      contracts: [{ title: "", description: "" }] as FormContract[]
    });
    setEditingMarket(null);
    setImageFile(null);
    setImagePreview("");
  };

  const addContract = () => {
    setFormData(prev => ({
      ...prev,
      contracts: [...prev.contracts, { title: "", description: "" } as FormContract]
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
    setFormData(prev => ({ ...prev, image_url: "" }));
  };

  const ContractActions = ({ market, contract }: { market: Market, contract: Contract }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <MoreHorizontal className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {contract.status !== "resolved" && (market.status === "closed" || market.status === "open") && (
          <>
            <DropdownMenuItem onClick={() => handleResolveContract(market.market_id, contract.contract_id, "YES", contract.title)}>
              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
              Resolve as YES
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleResolveContract(market.market_id, contract.contract_id, "NO", contract.title)}>
              <XCircle className="w-4 h-4 mr-2 text-red-600" />
              Resolve as NO
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleResolveContract(market.market_id, contract.contract_id, "UNDECIDED", contract.title)}>
              <XCircle className="w-4 h-4 mr-2 text-gray-600" />
              Resolve as Undecided
            </DropdownMenuItem>
          </>
        )}
        {contract.status === "resolved" && (
          <DropdownMenuItem disabled>
            <CheckCircle className="w-4 h-4 mr-2 text-gray-400" />
            Already Resolved
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const MarketActions = ({ market }: { market: Market }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
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
            contracts: market.contracts.map(c => ({ 
              contract_id: c.contract_id, 
              title: c.title, 
              description: c.description || "" 
            }))
          });
          // Set image preview for existing image
          if (market.image_url) {
            setImagePreview(`${config.apiUrl}${market.image_url}`);
          } else {
            setImagePreview("");
          }
          setImageFile(null);
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
            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Resolve All Contracts
            </div>
            <DropdownMenuItem onClick={() => {
              if (confirm(`Resolve ALL contracts in this market as YES? This will process payouts immediately.`)) {
                handleUpdateMarketStatus(market.market_id, "resolve", "YES");
              }
            }}>
              <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
              All as YES
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              if (confirm(`Resolve ALL contracts in this market as NO? This will process payouts immediately.`)) {
                handleUpdateMarketStatus(market.market_id, "resolve", "NO");
              }
            }}>
              <XCircle className="w-4 h-4 mr-2 text-red-600" />
              All as NO
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              if (confirm(`Resolve ALL contracts in this market as UNDECIDED? This will refund all users.`)) {
                handleUpdateMarketStatus(market.market_id, "resolve", "UNDECIDED");
              }
            }}>
              <XCircle className="w-4 h-4 mr-2 text-gray-600" />
              All as Undecided
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
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-black/50 border-0 shadow-2xl">
                <div className="bg-white rounded-lg p-0 max-h-[85vh] overflow-y-auto">
                  <DialogHeader className="p-6 pb-4 border-b border-gray-200">
                    <DialogTitle className="text-2xl font-bold text-gray-900">
                      {editingMarket ? "Edit Market" : "Create New Market"}
                    </DialogTitle>
                    <p className="text-gray-600 mt-1">
                      {editingMarket ? "Update market details and contracts" : "Set up a new prediction market for users to trade on"}
                    </p>
                  </DialogHeader>
                  
                  <form onSubmit={handleFormSubmit} className="p-6">
                    {/* Basic Information Section */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                        Basic Information
                      </h3>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="lg:col-span-2">
                          <Label htmlFor="title" className="text-sm font-medium text-gray-700">Market Title *</Label>
                          <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="e.g., Harvard Basketball Championship 2024"
                            className="mt-2"
                            required
                          />
                        </div>
                        
                        <div className="lg:col-span-2">
                          <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Detailed description of the market conditions and resolution criteria..."
                            rows={4}
                            className="mt-2"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="category" className="text-sm font-medium text-gray-700">Category *</Label>
                          <Select
                            id="category"
                            value={formData.category}
                            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                            className="mt-2"
                            required
                          >
                            <option value="Sports">Sports</option>
                            <option value="IMs">IMs</option>
                            <option value="Student Gov">Student Gov</option>
                            <option value="Admin">Admin</option>
                          </Select>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-gray-700">Market Image</Label>
                          <div className="mt-2">
                            {imagePreview ? (
                              <div className="relative">
                                <img
                                  src={imagePreview}
                                  alt="Market preview"
                                  className="w-full aspect-square object-cover rounded-lg border border-gray-300"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={removeImage}
                                  className="absolute top-2 right-2 bg-red-500 text-white hover:bg-red-600 h-8 w-8 p-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors aspect-square flex items-center justify-center">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleImageChange}
                                  className="hidden"
                                  id="image-upload"
                                />
                                <label htmlFor="image-upload" className="cursor-pointer">
                                  <div className="flex flex-col items-center">
                                    <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                                    <span className="text-sm font-medium text-gray-900">Upload an image</span>
                                    <span className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</span>
                                  </div>
                                </label>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timing Section */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                        Market Timing
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="start_time" className="text-sm font-medium text-gray-700">Start Time *</Label>
                          <Input
                            id="start_time"
                            type="datetime-local"
                            value={formData.start_time}
                            onChange={(e) => setFormData(prev => ({ ...prev, start_time: e.target.value }))}
                            className="mt-2"
                            required
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="close_time" className="text-sm font-medium text-gray-700">Close Time *</Label>
                          <Input
                            id="close_time"
                            type="datetime-local"
                            value={formData.close_time}
                            onChange={(e) => setFormData(prev => ({ ...prev, close_time: e.target.value }))}
                            className="mt-2"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Contracts Section */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                          <div className="w-2 h-2 bg-green-600 rounded-full mr-3"></div>
                          Prediction Contracts
                        </h3>
                        <Button type="button" variant="outline" size="sm" onClick={addContract} className="text-green-600 border-green-600 hover:bg-green-50">
                          <Plus className="w-4 h-4 mr-2" />
                          Add Contract
                        </Button>
                      </div>
                      
                      <div className="space-y-4">
                        {formData.contracts.map((contract, index) => (
                          <div key={index} className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                                  <span className="text-sm font-medium text-gray-700">{index + 1}</span>
                                </div>
                                <span className="text-base font-medium text-gray-900">Contract {index + 1}</span>
                              </div>
                              {formData.contracts.length > 1 && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeContract(index)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor={`contract-title-${index}`} className="text-sm font-medium text-gray-700">Contract Title *</Label>
                                <Input
                                  id={`contract-title-${index}`}
                                  value={contract.title}
                                  onChange={(e) => updateContract(index, "title", e.target.value)}
                                  placeholder="e.g., Harvard will win the championship"
                                  className="mt-2"
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor={`contract-description-${index}`} className="text-sm font-medium text-gray-700">Description (optional)</Label>
                                <Input
                                  id={`contract-description-${index}`}
                                  value={contract.description}
                                  onChange={(e) => updateContract(index, "description", e.target.value)}
                                  placeholder="Additional details about this outcome..."
                                  className="mt-2"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsCreateModalOpen(false)}
                        className="px-6"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        className="bg-purple-600 hover:bg-purple-700 px-6"
                      >
                        {editingMarket ? "Update Market" : "Create Market"}
                      </Button>
                    </div>
                  </form>
                </div>
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
                        {market.image_url ? (
                          <img
                            src={`${config.apiUrl}${market.image_url}`}
                            alt={market.title}
                            className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
                            <span className="text-gray-400 text-lg font-bold">
                              {market.category?.charAt(0) || "M"}
                            </span>
                          </div>
                        )}
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
                        <div className="space-y-2">
                          {market.contracts.map((contract) => (
                            <div key={contract.contract_id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-700">{contract.title}</span>
                                {contract.resolution && (
                                  <Badge className={`text-xs ${
                                    contract.resolution === "YES" ? "bg-green-100 text-green-800" : 
                                    contract.resolution === "NO" ? "bg-red-100 text-red-800" : 
                                    "bg-gray-100 text-gray-800"
                                  }`}>
                                    {contract.resolution}
                                  </Badge>
                                )}
                                {contract.status !== "resolved" && (
                                  <Badge variant="secondary" className="text-xs">
                                    Pending
                                  </Badge>
                                )}
                              </div>
                              <ContractActions market={market} contract={contract} />
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