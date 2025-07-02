"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";
import type { Idea } from "@/lib/types";

interface CreateIdeaFormProps {
  onSubmit: (idea: Idea) => void;
  user: { username: string };
}

export function CreateIdeaForm({ onSubmit, user }: CreateIdeaFormProps) {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleReset = () => {
    setStep(1);
    setTitle("");
    setDescription("");
    setError("");
    setIsSubmitting(false);
  };

  const handleNext = () => {
    if (!title.trim()) {
      setError("Please enter a market title");
      return;
    }
    if (title.length > 200) {
      setError("Title must be 200 characters or less");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError("Please enter a market title");
      return;
    }
    
    if (description.length > 1000) {
      setError("Description must be 1000 characters or less");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/v1/ideas/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to submit idea");
      }

      const newIdea = await response.json();
      onSubmit(newIdea);
      handleReset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit idea");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const userInitial = user?.username?.charAt(0).toUpperCase() || 'U';

  return (
    <div className="border-b border-gray-200 p-6 bg-white">
    <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-white font-semibold text-lg">{userInitial}</span>
        </div>
        
        <div className="w-full">
          {step === 2 && (
            <div className="flex items-center gap-3 mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="rounded-full hover:bg-gray-100"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <span className="text-sm text-gray-600">Step 2 of 2</span>
            </div>
          )}
          
          <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNext(); } : handleSubmit} className="w-full space-y-4">
            {step === 1 ? (
              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="What market would you like to see?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xl border-none focus:ring-0 p-0 placeholder-gray-500 bg-transparent shadow-none"
                  maxLength={200}
                  autoFocus
                />
                {title.length > 200 && (
                  <div className="text-xs text-red-500">
                    {title.length}/200 characters (too long)
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
      </div>
                <div>
        <Textarea
                    placeholder="Provide more details about this market idea (optional)..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full resize-none border-gray-200 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-transparent"
                    maxLength={1000}
                    autoFocus
                  />
                  {description.length > 1000 && (
                    <div className="text-xs text-red-500 mt-2">
                      {description.length}/1000 characters (too long)
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div className="flex justify-between items-center">
              {step === 1 ? (
                <p className="text-xs text-gray-500">
                  Your idea will be reviewed by administrators before being turned into a market.
                </p>
              ) : (
                <div></div>
              )}
          <Button
            type="submit"
                disabled={isSubmitting || (step === 1 && !title.trim())}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full font-bold px-6 py-2"
          >
                {isSubmitting 
                  ? "Submitting..." 
                  : step === 1 
                    ? "Next" 
                    : "Submit Idea"
                }
          </Button>
        </div>
      </form>
        </div>
      </div>
    </div>
  );
} 