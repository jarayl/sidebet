"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Idea, UserInfo } from "@/lib/types";

interface CreateIdeaFormProps {
  onIdeaCreated: (idea: Idea) => void;
  user: UserInfo | null;
}

export function CreateIdeaForm({ onIdeaCreated, user }: CreateIdeaFormProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8000/api/v1/ideas/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: content.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create idea");
      }

      const newIdea = await response.json();
      onIdeaCreated(newIdea);
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const userInitial = user?.username?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="flex items-start space-x-4">
      <div className="w-11 h-11 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
        <span className="text-white font-semibold">{userInitial}</span>
      </div>
      <form onSubmit={handleSubmit} className="w-full">
        <Textarea
          placeholder="What's your prediction?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full bg-transparent border-none focus:ring-0 resize-none p-2 text-xl placeholder-gray-500"
          rows={2}
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        <div className="flex justify-end items-center mt-2">
          <Button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold px-6 py-2"
          >
            {isSubmitting ? "Posting..." : "Post"}
          </Button>
        </div>
      </form>
    </div>
  );
} 