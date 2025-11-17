"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Play,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

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

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [task, setTask] = useState<AgentTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTask();
  }, [taskId]);

  const loadTask = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/agents/tasks/${taskId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch task");
      }

      const data = await response.json();
      setTask(data.task);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load task");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-6 w-6 text-yellow-500" />;
      case "running":
        return <Play className="h-6 w-6 text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "failed":
        return <XCircle className="h-6 w-6 text-red-500" />;
      default:
        return <AlertCircle className="h-6 w-6 text-gray-500" />;
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
      <Badge variant={variants[status] || "default"} className="gap-1 text-base px-3 py-1">
        {getStatusIcon(status)}
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="container px-4 py-8">
        <div className="flex items-center justify-center">
          <div className="text-muted-foreground">Loading task...</div>
        </div>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="container px-4 py-8">
        <Card className="p-6">
          <div className="text-center">
            <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Task Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {error || "The requested task could not be found."}
            </p>
            <Link href="/agents">
              <Button>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Agents
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6">
          <Link href="/agents">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Agents
            </Button>
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Task #{task.id}</h1>
              <div className="flex items-center gap-3">
                <span className="text-lg text-muted-foreground">
                  {task.agentName}
                </span>
                {getStatusBadge(task.status)}
              </div>
            </div>
            <Button variant="outline" onClick={loadTask}>
              Refresh
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Metadata */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Task Information</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Task ID
                </dt>
                <dd className="mt-1 text-lg font-mono">{task.id}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Agent Name
                </dt>
                <dd className="mt-1 text-lg">{task.agentName}</dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Created At
                </dt>
                <dd className="mt-1">
                  {new Date(task.createdAt).toLocaleString()}
                </dd>
              </div>

              <div>
                <dt className="text-sm font-medium text-muted-foreground">
                  Updated At
                </dt>
                <dd className="mt-1">
                  {new Date(task.updatedAt).toLocaleString()}
                </dd>
              </div>

              {task.triggeredBy && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Triggered By
                  </dt>
                  <dd className="mt-1">{task.triggeredBy}</dd>
                </div>
              )}

              {task.tags.length > 0 && (
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">
                    Tags
                  </dt>
                  <dd className="mt-1 flex gap-2">
                    {task.tags.map((tag, i) => (
                      <Badge key={i} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          {/* Input */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Input</h2>
            <pre className="rounded-lg bg-muted p-4 overflow-auto">
              <code className="text-sm">
                {JSON.stringify(task.input, null, 2)}
              </code>
            </pre>
          </Card>

          {/* Output */}
          {task.output && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 text-green-600">
                Output
              </h2>
              <pre className="rounded-lg bg-muted p-4 overflow-auto">
                <code className="text-sm">
                  {JSON.stringify(task.output, null, 2)}
                </code>
              </pre>
            </Card>
          )}

          {/* Error */}
          {task.error && (
            <Card className="p-6 border-red-500">
              <h2 className="text-xl font-semibold mb-4 text-red-600">
                Error
              </h2>
              <div className="rounded-lg bg-red-500/10 p-4">
                <p className="text-red-600">{task.error}</p>
              </div>
            </Card>
          )}

          {/* Status Message */}
          {task.status === "pending" && (
            <Card className="p-4 bg-yellow-500/10 border-yellow-500">
              <div className="flex items-center gap-2 text-yellow-700">
                <Clock className="h-5 w-5" />
                <span>This task is waiting to be processed.</span>
              </div>
            </Card>
          )}

          {task.status === "running" && (
            <Card className="p-4 bg-blue-500/10 border-blue-500">
              <div className="flex items-center gap-2 text-blue-700">
                <Play className="h-5 w-5" />
                <span>This task is currently running...</span>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
