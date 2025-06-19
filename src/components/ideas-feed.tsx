"use client";

import { useEffect, useState } from "react";
import { IdeaCard } from "@/components/idea-card";
import { CreateIdeaForm } from "@/components/create-idea-form";
import type { Idea, UserInfo } from "@/lib/types";

interface IdeasFeedProps {
  filter: string;
  user: UserInfo | null;
}

export function IdeasFeed({ filter, user }: IdeasFeedProps) {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIdeas = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`http://localhost:8000/api/v1/ideas/?filter_type=${filter}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch ideas");
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

  const handleIdeaCreated = (newIdea: Idea) => {
    setIdeas([newIdea, ...ideas]);
  };

  const handleIdeaUpdate = (updatedIdea: Idea) => {
    setIdeas(ideas.map(idea => idea.idea_id === updatedIdea.idea_id ? updatedIdea : idea));
  };
  
  const handleIdeaDeleted = (ideaId: number) => {
    setIdeas(ideas.filter(idea => idea.idea_id !== ideaId));
  }

  if (isLoading) {
    return <div className="p-4 text-center">Loading ideas...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  return (
    <div>
      {filter === "home" && (
        <div className="border-b border-gray-200 p-4">
          <CreateIdeaForm onIdeaCreated={handleIdeaCreated} user={user}/>
        </div>
      )}
      <div className="divide-y divide-gray-200">
        {ideas.map((idea) => (
          <IdeaCard 
            key={idea.idea_id} 
            idea={idea} 
            currentUser={user}
            onUpdate={handleIdeaUpdate}
            onDelete={handleIdeaDeleted}
          />
        ))}
      </div>
      {ideas.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <h3 className="text-xl font-bold">No ideas yet</h3>
          <p>When there are new ideas, they'll show up here.</p>
        </div>
      )}
    </div>
  );
} 