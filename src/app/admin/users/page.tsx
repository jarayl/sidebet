"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Users, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Shield, 
  ShieldOff, 
  DollarSign,
  Activity,
  Calendar,
  Mail,
  Search,
  Filter,
  Download,
  UserCheck,
  UserX,
  Plus,
  Minus,
  Eye,
  AlertTriangle
} from "lucide-react";

interface User {
  user_id: number;
  username: string;
  email: string;
  status: string;
  balance: number;
  is_active: boolean;
  is_superuser: boolean;
  is_verified: boolean;
  created_at: string;
  profile_picture?: string;
}

interface UserStats {
  total_orders: number;
  total_trades: number;
  total_volume: number;
  last_activity: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceOperation, setBalanceOperation] = useState<"add" | "subtract">("add");

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, statusFilter]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/users/", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserStats = async (userId: number) => {
    try {
      // Mock user stats - in real implementation, this would be an API call
      setUserStats({
        total_orders: Math.floor(Math.random() * 100),
        total_trades: Math.floor(Math.random() * 50),
        total_volume: Math.floor(Math.random() * 10000),
        last_activity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      });
    } catch (error) {
      console.error("Failed to fetch user stats:", error);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      switch (statusFilter) {
        case "active":
          filtered = filtered.filter(user => user.is_active && user.status === "active");
          break;
        case "suspended":
          filtered = filtered.filter(user => !user.is_active || user.status === "suspended");
          break;
        case "admin":
          filtered = filtered.filter(user => user.is_superuser);
          break;
        case "unverified":
          filtered = filtered.filter(user => !user.is_verified);
          break;
      }
    }

    setFilteredUsers(filtered);
  };

  const getStatusBadge = (user: User) => {
    if (!user.is_active) {
      return <Badge className="bg-red-100 text-red-800 border-red-200">Suspended</Badge>;
    }
    if (!user.is_verified) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Unverified</Badge>;
    }
    if (user.is_superuser) {
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">Admin</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800 border-green-200">Active</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const handleUserAction = async (userId: number, action: string) => {
    try {
      let endpoint = "";
      let method = "PUT";
      let body = {};

      switch (action) {
        case "suspend":
          // In real implementation, this would be a specific endpoint
          alert("Suspend user functionality would be implemented here");
          return;
        case "activate":
          alert("Activate user functionality would be implemented here");
          return;
        case "make_admin":
          alert("Make admin functionality would be implemented here");
          return;
        case "remove_admin":
          alert("Remove admin functionality would be implemented here");
          return;
        case "delete":
          if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
            return;
          }
          endpoint = `/api/v1/users/${userId}`;
          method = "DELETE";
          break;
      }

      const response = await fetch(`http://localhost:8000${endpoint}`, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
      });

      if (response.ok) {
        fetchUsers();
      } else {
        const errorData = await response.json();
        alert(`Failed to ${action} user: ${errorData.detail}`);
      }
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
      alert(`Failed to ${action} user`);
    }
  };

  const handleBalanceUpdate = async () => {
    if (!selectedUser || !balanceAmount) return;

    try {
      const amount = parseInt(balanceAmount) * 100; // Convert to cents
      const finalAmount = balanceOperation === "subtract" ? -amount : amount;

      const response = await fetch("http://localhost:8000/api/v1/users/balance/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ amount: finalAmount }),
      });

      if (response.ok) {
        setIsBalanceModalOpen(false);
        setBalanceAmount("");
        fetchUsers();
      } else {
        const errorData = await response.json();
        alert(`Failed to update balance: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Failed to update balance:", error);
      alert("Failed to update balance");
    }
  };

  const UserActions = ({ user }: { user: User }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => {
          setSelectedUser(user);
          fetchUserStats(user.user_id);
        }}>
          <Eye className="w-4 h-4 mr-2" />
          View Details
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => {
          setSelectedUser(user);
          setIsBalanceModalOpen(true);
        }}>
          <DollarSign className="w-4 h-4 mr-2" />
          Adjust Balance
        </DropdownMenuItem>
        
        {user.is_active ? (
          <DropdownMenuItem onClick={() => handleUserAction(user.user_id, "suspend")} className="text-yellow-600">
            <UserX className="w-4 h-4 mr-2" />
            Suspend User
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => handleUserAction(user.user_id, "activate")} className="text-green-600">
            <UserCheck className="w-4 h-4 mr-2" />
            Activate User
          </DropdownMenuItem>
        )}
        
        {user.is_superuser ? (
          <DropdownMenuItem onClick={() => handleUserAction(user.user_id, "remove_admin")} className="text-orange-600">
            <ShieldOff className="w-4 h-4 mr-2" />
            Remove Admin
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem onClick={() => handleUserAction(user.user_id, "make_admin")} className="text-blue-600">
            <Shield className="w-4 h-4 mr-2" />
            Make Admin
          </DropdownMenuItem>
        )}
        
        <DropdownMenuItem onClick={() => handleUserAction(user.user_id, "delete")} className="text-red-600">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading users...</div>
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
              <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
              <p className="text-gray-600 mt-2">Manage user accounts, permissions, and balances</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="px-3 py-1">
                {filteredUsers.length} users
              </Badge>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter(u => u.is_active).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Admins</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter(u => u.is_superuser).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unverified</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter(u => !u.is_verified).length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="border-0 shadow-sm mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search users by username or email..."
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
                  <option value="all">All Users</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="admin">Admins</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-xl text-gray-500 mb-2">No users found</p>
                        <p className="text-gray-400">
                          {searchTerm || statusFilter !== "all" 
                            ? "Try adjusting your search or filter criteria" 
                            : "No users have been registered yet"
                          }
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.user_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {user.profile_picture ? (
                              <img
                                src={`http://localhost:8000${user.profile_picture}`}
                                alt={user.username}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <img
                                src="/default_icon.jpg"
                                alt={user.username}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{user.username}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(user)}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900">{formatCurrency(user.balance)}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-500">{formatDate(user.created_at)}</p>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <UserActions user={user} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* User Details Modal */}
        {selectedUser && userStats && (
          <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  {selectedUser.profile_picture ? (
                    <img
                      src={`http://localhost:8000${selectedUser.profile_picture}`}
                      alt={selectedUser.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <img
                      src="/default_icon.jpg"
                      alt={selectedUser.username}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      {selectedUser.username}
                      {getStatusBadge(selectedUser)}
                    </div>
                    <p className="text-sm font-normal text-gray-500">{selectedUser.email}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* User Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">User ID</Label>
                    <p className="text-sm text-gray-900">{selectedUser.user_id}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Balance</Label>
                    <p className="text-sm text-gray-900">{formatCurrency(selectedUser.balance)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Joined</Label>
                    <p className="text-sm text-gray-900">{formatDate(selectedUser.created_at)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Last Activity</Label>
                    <p className="text-sm text-gray-900">{formatDate(userStats.last_activity)}</p>
                  </div>
                </div>

                {/* User Stats */}
                <div>
                  <Label className="text-sm font-medium text-gray-600 mb-3 block">Trading Activity</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-gray-900">{userStats.total_orders}</p>
                      <p className="text-sm text-gray-600">Total Orders</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-gray-900">{userStats.total_trades}</p>
                      <p className="text-sm text-gray-600">Completed Trades</p>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(userStats.total_volume)}</p>
                      <p className="text-sm text-gray-600">Trading Volume</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setSelectedUser(null)}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    setIsBalanceModalOpen(true);
                  }}>
                    Adjust Balance
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Balance Adjustment Modal */}
        <Dialog open={isBalanceModalOpen} onOpenChange={setIsBalanceModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adjust User Balance</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>User</Label>
                <p className="text-sm text-gray-600">{selectedUser?.username} ({selectedUser?.email})</p>
                <p className="text-sm text-gray-500">Current balance: {selectedUser ? formatCurrency(selectedUser.balance) : "$0.00"}</p>
              </div>
              
              <div>
                <Label>Operation</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant={balanceOperation === "add" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBalanceOperation("add")}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add
                  </Button>
                  <Button
                    variant={balanceOperation === "subtract" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBalanceOperation("subtract")}
                  >
                    <Minus className="w-4 h-4 mr-2" />
                    Subtract
                  </Button>
                </div>
              </div>
              
              <div>
                <Label htmlFor="amount">Amount (USD)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsBalanceModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleBalanceUpdate} disabled={!balanceAmount}>
                  {balanceOperation === "add" ? "Add" : "Subtract"} ${balanceAmount}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 