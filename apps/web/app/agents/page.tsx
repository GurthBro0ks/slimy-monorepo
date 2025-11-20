"use client";

import { useEffect, useState } from "react";
import { Bot, Play, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Agent {
  name: string;
  description: string;
  supportedTaskTypes: string[];
  metadata?: {
    model?: string;
    provider?: string;
    costTier?: string;
  };
}

interface AgentTask {
  id: number;
  agentName: string;
  status: "pending" | "running" | "completed" | "failed";
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  triggeredBy?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface CreateTaskForm {
  agentName: string;
  input: string;
  tags: string;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateTaskForm>({
    agentName: "",
    input: "{}",
    tags: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [agentsRes, tasksRes] = await Promise.all([
        fetch("/api/agents"),
        fetch("/api/agents/tasks?limit=20"),
      ]);

      if (!agentsRes.ok || !tasksRes.ok) {
        throw new Error("Failed to fetch data");
      }

      const agentsData = await agentsRes.json();
      const tasksData = await tasksRes.json();

      setAgents(agentsData.agents || []);
      setTasks(tasksData.tasks || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.agentName) {
      setError("Please select an agent");
      return;
    }

    try {
      setCreating(true);
      setError(null);

      // Parse input JSON
      let inputData: Record<string, unknown>;
      try {
        inputData = JSON.parse(formData.input);
      } catch {
        throw new Error("Invalid JSON in input field");
      }

      const response = await fetch("/api/agents/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentName: formData.agentName,
          input: inputData,
          tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()) : [],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create task");
      }

      // Reset form and reload tasks
      setFormData({ agentName: "", input: "{}", tags: "" });
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setCreating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "running":
        return <Play className="h-4 w-4 text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      running: "default",
      completed: "outline",
      failed: "destructive",
    };

    return (
      <Badge variant={variants[status] || "default"} className="gap-1">
        {getStatusIcon(status)}
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center gap-3">
          <Bot className="h-10 w-10 text-neon-green" />
          <div>
            <h1 className="text-4xl font-bold">Agent Orchestration</h1>
            <p className="text-muted-foreground">
              Manage and monitor AI agent tasks
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 p-4 text-red-500">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left Column: Agents List */}
          <Card className="p-6">
            <h2 className="mb-4 text-xl font-semibold">Available Agents</h2>
            <div className="space-y-3">
              {agents.map((agent) => (
                <div
                  key={agent.name}
                  className="rounded-lg border p-3 hover:bg-accent"
                >
                  <h3 className="font-medium">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {agent.description}
                  </p>
                  {agent.metadata && (
                    <div className="mt-2 flex gap-2 text-xs">
                      {agent.metadata.provider && (
                        <Badge variant="outline">{agent.metadata.provider}</Badge>
                      )}
                      {agent.metadata.costTier && (
                        <Badge variant="secondary">{agent.metadata.costTier}</Badge>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Right Column: Create Task Form & Recent Tasks */}
          <div className="lg:col-span-2 space-y-6">
            {/* Create Task Form */}
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-semibold">Create New Task</h2>
              <form onSubmit={handleCreateTask} className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Agent
                  </label>
                  <select
                    value={formData.agentName}
                    onChange={(e) =>
                      setFormData({ ...formData, agentName: e.target.value })
                    }
                    className="w-full rounded-md border bg-background px-3 py-2"
                    required
                  >
                    <option value="">Select an agent...</option>
                    {agents.map((agent) => (
                      <option key={agent.name} value={agent.name}>
                        {agent.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Input (JSON)
                  </label>
                  <textarea
                    value={formData.input}
                    onChange={(e) =>
                      setFormData({ ...formData, input: e.target.value })
                    }
                    className="w-full rounded-md border bg-background px-3 py-2 font-mono text-sm"
                    rows={6}
                    placeholder='{"task": "example", "params": {}}'
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Tags (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                    className="w-full rounded-md border bg-background px-3 py-2"
                    placeholder="urgent, test, feature-x"
                  />
                </div>

                <Button type="submit" disabled={creating} className="w-full">
                  {creating ? "Creating..." : "Create Task"}
                </Button>
              </form>
            </Card>

            {/* Recent Tasks */}
            <Card className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Recent Tasks</h2>
                <Button variant="outline" size="sm" onClick={loadData}>
                  Refresh
                </Button>
              </div>

              {tasks.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  No tasks yet. Create one to get started!
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <Link
                      key={task.id}
                      href={`/agents/tasks/${task.id}`}
                      className="block rounded-lg border p-4 hover:bg-accent"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">#{task.id}</span>
                            <span className="text-sm text-muted-foreground">
                              {task.agentName}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            {getStatusBadge(task.status)}
                            {task.tags.length > 0 && (
                              <div className="flex gap-1">
                                {task.tags.map((tag, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right text-sm text-muted-foreground">
                          <div>{new Date(task.createdAt).toLocaleDateString()}</div>
                          <div>{new Date(task.createdAt).toLocaleTimeString()}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
