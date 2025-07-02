"use client";

import { useEffect, useState } from "react";
import { IdeaCard } from "./idea-card";
import { CreateIdeaForm } from "./create-idea-form";
import type { Idea } from "@/lib/types";

interface IdeasFeedProps {
  filter: string;
  user: { username: string };
}

export function IdeasFeed({ filter, user }: IdeasFeedProps) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = async () => {
    try {
    setIsLoading(true);
      const response = await fetch(`http://localhost:8000/api/v1/ideas/?filter_type=${filter}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch ideas");
      }

      const data = await response.json();
      setIdeas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIdeas();
  }, [filter]);

  const handleIdeaUpdate = (updatedIdea: Idea) => {
    setIdeas(prev => prev.map(idea => 
      idea.idea_id === updatedIdea.idea_id ? updatedIdea : idea
    ));
  };
  
  const handleIdeaDelete = (ideaId: number) => {
    setIdeas(prev => prev.filter(idea => idea.idea_id !== ideaId));
  };

  const handleIdeaCreate = (newIdea: Idea) => {
    setIdeas(prev => [newIdea, ...prev]);
  };

  const getEmptyMessage = () => {
    switch (filter) {
      case 'trending':
        return {
          title: "No trending ideas yet",
          description: "Be the first to submit a popular market idea!"
        };
      case 'bookmarked':
        return {
          title: "No saved ideas",
          description: "Save interesting market ideas to find them here later."
        };
      case 'replies':
        return {
          title: "No comments yet",
          description: "Start engaging with the community by commenting on market ideas."
        };
      default:
        return {
          title: "No market ideas yet",
          description: "Be the first to submit an idea for a new prediction market!"
        };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading market ideas...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  const emptyMessage = getEmptyMessage();

  return (
    <div className="bg-white">
      {filter === "home" && (
        <CreateIdeaForm onSubmit={handleIdeaCreate} user={user} />
      )}
      
      {ideas.length === 0 ? (
        <div className="text-center py-16 px-6">
          <div className="max-w-sm mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {emptyMessage.title}
            </h3>
            <p className="text-gray-600 mb-6">
              {emptyMessage.description}
            </p>
          </div>
        </div>
      ) : (
      <div className="divide-y divide-gray-200">
        {ideas.map((idea) => (
          <IdeaCard 
            key={idea.idea_id} 
            idea={idea} 
            onUpdate={handleIdeaUpdate}
              onDelete={handleIdeaDelete}
          />
        ))}
        </div>
      )}
    </div>
  );
} 