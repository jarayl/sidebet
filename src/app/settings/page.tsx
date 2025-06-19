"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { ArrowLeft, Upload, Trash2 } from "lucide-react";
// No longer using next/image for the preview
// import Image from "next/image";

interface User {
  user_id: number;
  username: string;
  email: string;
  profile_picture?: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Profile form state
  const [username, setUsername] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>("");
  const [originalProfilePicture, setOriginalProfilePicture] = useState<string>("");
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Error states - separate for each section
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/v1/users/me", {
          credentials: "include",
        });
        if (!response.ok) throw new Error("Not authenticated");
        const userData = await response.json();
        setUser(userData);
        setUsername(userData.username);
        
        // Set both current and original profile picture
        const currentPicture = userData.profile_picture 
          ? `http://localhost:8000${userData.profile_picture}` 
          : "/default_icon.jpg";
        setProfilePicturePreview(currentPicture);
        setOriginalProfilePicture(currentPicture);
      } catch (err) {
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setProfileError("Profile picture must be under 10MB");
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setProfileError("Please select an image file");
        return;
      }
      
      setProfilePicture(file);
      
      // Create client-side preview using createObjectURL (more efficient than FileReader)
      const previewUrl = URL.createObjectURL(file);
      setProfilePicturePreview(previewUrl);
      
      // Clear any previous errors
      setProfileError("");
    }
  };

  const handleCancelProfilePicture = () => {
    // Revert to original profile picture
    setProfilePicture(null);
    setProfilePicturePreview(originalProfilePicture);
    
    // Clear the file input
    const fileInput = document.getElementById('profile-picture') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setProfileError("");
    setProfileSuccess("");

    // Validate username
    if (username.length > 12) {
      setProfileError("Username must be 12 characters or less");
      setIsUpdating(false);
      return;
    }

    if (username.includes(" ")) {
      setProfileError("Username cannot contain spaces");
      setIsUpdating(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setProfileError("Username can only contain letters, numbers, and underscores");
      setIsUpdating(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("username", username);
      
      // Only append profile picture if user selected a new one
      if (profilePicture) {
        formData.append("profile_picture", profilePicture);
      }

      const response = await fetch("http://localhost:8000/api/v1/users/profile", {
        method: "PUT",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update profile");
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      setProfileSuccess("Profile updated successfully!");
      
      // Update the original profile picture reference and clear the pending file
      const newPicture = updatedUser.profile_picture 
        ? `http://localhost:8000${updatedUser.profile_picture}` 
        : "/default_icon.jpg";
      setOriginalProfilePicture(newPicture);
      setProfilePicturePreview(newPicture);
      setProfilePicture(null);
      
      // Clear the file input
      const fileInput = document.getElementById('profile-picture') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setPasswordError("");
    setPasswordSuccess("");

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords don't match");
      setIsUpdating(false);
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      setIsUpdating(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/v1/users/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update password");
      }

      setPasswordSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await fetch("http://localhost:8000/api/v1/users/me", {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      router.push("/");
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "An error occurred");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const sidebarItems = [
    { id: "profile", label: "Profile" },
    { id: "password", label: "Password" },
    { id: "terms", label: "Terms of Service" },
    { id: "privacy", label: "Privacy Policy" },
  ];

  // Check if there are unsaved changes
  const hasUnsavedChanges = profilePicture !== null || username !== user.username;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                  className="rounded-full"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
              </div>
              
              <nav className="space-y-2">
                {sidebarItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      // Clear all messages when switching tabs
                      setProfileError("");
                      setProfileSuccess("");
                      setPasswordError("");
                      setPasswordSuccess("");
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      activeTab === item.id
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {/* Header */}
              <div className="px-8 py-6 border-b border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                  <span>Account settings</span>
                  <span>/</span>
                  <span className="text-gray-900 font-medium">
                    {sidebarItems.find(item => item.id === activeTab)?.label}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {sidebarItems.find(item => item.id === activeTab)?.label}
                </h2>
                <p className="text-gray-600 mt-1">
                  {activeTab === "profile" && "Manage settings for your SideBet profile"}
                  {activeTab === "password" && "Update your account password"}
                  {activeTab === "terms" && "Review our terms of service"}
                  {activeTab === "privacy" && "Review our privacy policy"}
                </p>
              </div>

              {/* Content */}
              <div className="p-8">

                {activeTab === "profile" && (
                  <div className="space-y-8">
                    {profileError && (
                      <div className="p-4 bg-red-50 border border-red-300 rounded-lg text-red-800 text-sm">
                        {profileError}
                      </div>
                    )}
                    
                    {profileSuccess && (
                      <div className="p-4 bg-green-50 border border-green-300 rounded-lg text-green-800 text-sm">
                        {profileSuccess}
                      </div>
                    )}
                    
                    <form onSubmit={handleProfileUpdate} className="space-y-6">
                      {/* Profile Picture Section */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile picture</h3>
                        <p className="text-sm text-gray-600 mb-4">We support PNGs, JPEGs and GIFs under 10MB</p>
                        
                        <div className="flex items-center gap-6">
                          <div className="relative">
                            <img
                              src={profilePicturePreview}
                              alt="Profile"
                              className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                            />
                            {hasUnsavedChanges && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                          
                          <div className="flex gap-3">
                            <Label htmlFor="profile-picture" className="cursor-pointer">
                              <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-300 transition-colors">
                                <Upload className="w-4 h-4" />
                                <span className="text-sm font-medium">Upload image</span>
                              </div>
                            </Label>
                            <Input
                              id="profile-picture"
                              type="file"
                              accept="image/*"
                              onChange={handleProfilePictureChange}
                              className="hidden"
                            />
                            
                            {profilePicture && (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleCancelProfilePicture}
                                className="px-4 py-2"
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        {profilePicture && (
                          <p className="text-xs text-blue-600 mt-2">
                            Preview only - click "Update Profile" to save changes
                          </p>
                        )}
                      </div>

                      <div className="border-t border-gray-200 my-6" />

                      {/* Username and Email */}
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                            Username
                          </Label>
                          <Input
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="mt-1"
                            maxLength={12}
                            pattern="[a-zA-Z0-9_]+"
                            title="Username can only contain letters, numbers, and underscores (max 12 characters)"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {username.length}/12 characters. Letters, numbers, and underscores only.
                          </p>
                        </div>
                        
                        <div>
                          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                            Email Address
                          </Label>
                          <Input
                            id="email"
                            value={user.email}
                            disabled
                            className="mt-1 bg-gray-50"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            You may need to log out and back in to see any change.
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={isUpdating || !hasUnsavedChanges} 
                          className="px-6"
                        >
                          {isUpdating ? "Updating..." : "Update Profile"}
                        </Button>
                      </div>
                    </form>

                    <div className="border-t border-gray-200 my-6" />

                    {/* Danger Zone */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Danger zone</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Permanently delete this account and all of its data.
                      </p>
                      
                      <Button
                        variant="destructive"
                        onClick={handleDeleteAccount}
                        className="flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete account
                      </Button>
                    </div>
                  </div>
                )}

                {activeTab === "password" && (
                  <div className="max-w-md">
                    {passwordError && (
                      <div className="mb-6 p-4 bg-red-50 border border-red-300 rounded-lg text-red-800 text-sm">
                        {passwordError}
                      </div>
                    )}
                    
                    {passwordSuccess && (
                      <div className="mb-6 p-4 bg-green-50 border border-green-300 rounded-lg text-green-800 text-sm">
                        {passwordSuccess}
                      </div>
                    )}
                    
                    <form onSubmit={handlePasswordUpdate} className="space-y-6">
                    <div>
                      <Label htmlFor="current-password" className="text-sm font-medium text-gray-700">
                        Current Password
                      </Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="new-password" className="text-sm font-medium text-gray-700">
                        New Password
                      </Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="confirm-password" className="text-sm font-medium text-gray-700">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="mt-1"
                        required
                      />
                    </div>

                      <Button type="submit" disabled={isUpdating} className="w-full">
                        {isUpdating ? "Updating..." : "Update Password"}
                      </Button>
                    </form>
                  </div>
                )}

                {activeTab === "terms" && (
                  <div className="prose max-w-none">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Terms of Service</h3>
                    <div className="text-gray-600 space-y-4">
                      <p>
                        [Terms of Service content will be added here. This is placeholder text that you can replace with your actual terms of service.]
                      </p>
                      <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                      </p>
                      <p>
                        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "privacy" && (
                  <div className="prose max-w-none">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Policy</h3>
                    <div className="text-gray-600 space-y-4">
                      <p>
                        [Privacy Policy content will be added here. This is placeholder text that you can replace with your actual privacy policy.]
                      </p>
                      <p>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                      </p>
                      <p>
                        Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 