"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Callout } from "@/components/ui/callout";
import { BookmarkPlus, Edit2, Trash2, Save, X, Tag } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/protected-route";

interface SavedPrompt {
  id: number;
  title: string;
  content: string;
  tags: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function SavedPromptsPage() {
  const [prompts, setPrompts] = useState<SavedPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New prompt form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit prompt
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editTags, setEditTags] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/saved-prompts");

      if (response.status === 401) {
        setError("Please log in to view your saved prompts");
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to fetch prompts");
      }

      const data = await response.json();
      setPrompts(data);
    } catch (err) {
      console.error("Error fetching prompts:", err);
      setError("Failed to load saved prompts");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTitle.trim() || !newContent.trim()) {
      setError("Title and content are required");
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const response = await fetch("/api/saved-prompts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          tags: newTags || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create prompt");
      }

      const newPrompt = await response.json();
      setPrompts([newPrompt, ...prompts]);
      setNewTitle("");
      setNewContent("");
      setNewTags("");
      setShowNewForm(false);
      setSuccess("Prompt created successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error creating prompt:", err);
      setError("Failed to create prompt");
    } finally {
      setCreating(false);
    }
  };

  const handleStartEdit = (prompt: SavedPrompt) => {
    setEditingId(prompt.id);
    setEditTitle(prompt.title);
    setEditContent(prompt.content);
    setEditTags(prompt.tags || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditContent("");
    setEditTags("");
  };

  const handleUpdate = async (id: number) => {
    if (!editTitle.trim() || !editContent.trim()) {
      setError("Title and content are required");
      return;
    }

    try {
      setUpdating(true);
      setError(null);

      const response = await fetch(`/api/saved-prompts/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: editTitle,
          content: editContent,
          tags: editTags || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update prompt");
      }

      const updatedPrompt = await response.json();
      setPrompts(prompts.map((p) => (p.id === id ? updatedPrompt : p)));
      setEditingId(null);
      setSuccess("Prompt updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error updating prompt:", err);
      setError("Failed to update prompt");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this prompt?")) {
      return;
    }

    try {
      setError(null);

      const response = await fetch(`/api/saved-prompts/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete prompt");
      }

      setPrompts(prompts.filter((p) => p.id !== id));
      setSuccess("Prompt deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error deleting prompt:", err);
      setError("Failed to delete prompt");
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="container px-4 py-8">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading saved prompts...</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookmarkPlus className="h-10 w-10 text-neon-purple" />
              <div>
                <h1 className="text-4xl font-bold">Saved Prompts</h1>
                <p className="text-muted-foreground">
                  Manage your favorite prompts and macros
                </p>
              </div>
            </div>
            <Button asChild variant="outline">
              <a href="/profile">Back to Profile</a>
            </Button>
          </div>

          {success && (
            <Callout variant="success" className="mb-6">
              {success}
            </Callout>
          )}

          {error && (
            <Callout variant="destructive" className="mb-6">
              {error}
            </Callout>
          )}

          {/* New Prompt Button/Form */}
          {!showNewForm && (
            <div className="mb-6">
              <Button onClick={() => setShowNewForm(true)}>
                <BookmarkPlus className="mr-2 h-4 w-4" />
                New Prompt
              </Button>
            </div>
          )}

          {showNewForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Create New Prompt</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div>
                    <Label htmlFor="newTitle">Title</Label>
                    <Input
                      id="newTitle"
                      type="text"
                      placeholder="Enter prompt title"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="mt-1"
                      required
                      maxLength={200}
                    />
                  </div>

                  <div>
                    <Label htmlFor="newContent">Prompt Content</Label>
                    <Textarea
                      id="newContent"
                      placeholder="Enter your prompt text here..."
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      className="mt-1 min-h-[150px]"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="newTags" className="flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Tags (optional)
                    </Label>
                    <Input
                      id="newTags"
                      type="text"
                      placeholder="e.g., coding, writing, analysis"
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                      className="mt-1"
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Comma-separated tags for organizing your prompts
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button type="submit" disabled={creating}>
                      {creating ? "Creating..." : "Create Prompt"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowNewForm(false);
                        setNewTitle("");
                        setNewContent("");
                        setNewTags("");
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Prompts List */}
          {prompts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookmarkPlus className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">
                  No saved prompts yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Create your first prompt to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {prompts.map((prompt) => (
                <Card key={prompt.id}>
                  {editingId === prompt.id ? (
                    // Edit Mode
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={`editTitle-${prompt.id}`}>Title</Label>
                          <Input
                            id={`editTitle-${prompt.id}`}
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="mt-1"
                            required
                            maxLength={200}
                          />
                        </div>

                        <div>
                          <Label htmlFor={`editContent-${prompt.id}`}>Content</Label>
                          <Textarea
                            id={`editContent-${prompt.id}`}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="mt-1 min-h-[150px]"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor={`editTags-${prompt.id}`}>Tags</Label>
                          <Input
                            id={`editTags-${prompt.id}`}
                            type="text"
                            value={editTags}
                            onChange={(e) => setEditTags(e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleUpdate(prompt.id)}
                            disabled={updating}
                          >
                            <Save className="mr-2 h-4 w-4" />
                            {updating ? "Saving..." : "Save"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleCancelEdit}
                            disabled={updating}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  ) : (
                    // View Mode
                    <>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle>{prompt.title}</CardTitle>
                            {prompt.tags && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {prompt.tags.split(",").map((tag, i) => (
                                  <span
                                    key={i}
                                    className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs text-primary"
                                  >
                                    <Tag className="mr-1 h-3 w-3" />
                                    {tag.trim()}
                                  </span>
                                ))}
                              </div>
                            )}
                            <CardDescription className="mt-2">
                              Created {new Date(prompt.createdAt).toLocaleDateString()}
                              {prompt.updatedAt !== prompt.createdAt && (
                                <> • Updated {new Date(prompt.updatedAt).toLocaleDateString()}</>
                              )}
                            </CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStartEdit(prompt)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(prompt.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="rounded-md bg-muted p-4">
                          <pre className="whitespace-pre-wrap font-mono text-sm">
                            {prompt.content}
                          </pre>
                        </div>
                      </CardContent>
                    </>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
