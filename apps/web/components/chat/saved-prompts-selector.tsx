'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BookmarkPlus, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SavedPrompt {
  id: number;
  title: string;
  content: string;
  tags: string | null;
}

interface SavedPromptsSelectorProps {
  onSelectPrompt: (content: string) => void;
  disabled?: boolean;
}

export function SavedPromptsSelector({ onSelectPrompt, disabled }: SavedPromptsSelectorProps) {
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/saved-prompts');

      // If user is not authenticated, just don't show prompts
      if (response.status === 401) {
        setPrompts([]);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch prompts');
      }

      const data = await response.json();
      setPrompts(data);
    } catch (err) {
      console.error('Error fetching saved prompts:', err);
      setError('Failed to load prompts');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPrompt = (prompt: SavedPrompt) => {
    onSelectPrompt(prompt.content);
  };

  // Don't render if no prompts and not loading
  if (!loading && prompts.length === 0 && !error) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || loading}
          className="border-neon-purple/30 text-neon-purple hover:bg-neon-purple/10"
        >
          <BookmarkPlus className="mr-2 h-4 w-4" />
          Saved Prompts
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Select a Saved Prompt</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {loading ? (
          <DropdownMenuItem disabled>Loading prompts...</DropdownMenuItem>
        ) : error ? (
          <DropdownMenuItem disabled className="text-red-500">
            {error}
          </DropdownMenuItem>
        ) : prompts.length === 0 ? (
          <DropdownMenuItem disabled>No saved prompts</DropdownMenuItem>
        ) : (
          <>
            {prompts.map((prompt) => (
              <DropdownMenuItem
                key={prompt.id}
                onClick={() => handleSelectPrompt(prompt)}
                className="cursor-pointer"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{prompt.title}</span>
                  {prompt.tags && (
                    <span className="text-xs text-muted-foreground">
                      {prompt.tags}
                    </span>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/profile/prompts" className="cursor-pointer">
                Manage Prompts →
              </a>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
