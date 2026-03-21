export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "pending" | "in-progress" | "completed" | "failed";
  priority: "low" | "medium" | "high" | "critical";
  assignedTo?: string; // Agent ID
  createdAt: string;
  updatedAt: string;
  deadline?: string;
}

export interface Mission {
  id: string;
  name: string;
  description: string;
  status: "active" | "completed" | "archived";
  taskIds: string[];
  startDate: string;
  endDate?: string;
}

export interface Agent {
  id: string;
  name: string;
  type: "onboarding" | "support" | "growth" | "system";
  status: "online" | "idle" | "busy" | "offline";
  lastHeartbeat: string;
  capabilities: string[];
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: "task" | "mission" | "event";
  refId: string;
}

class MissionControlClient {
  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`/api/mission-control${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Mission Control Error: ${res.status} - ${errorText}`);
    }

    return res.json();
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    return this.fetch<Task[]>("/tasks");
  }

  async createTask(task: Partial<Task>): Promise<Task> {
    return this.fetch<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify(task),
    });
  }

  async updateTaskStatus(taskId: string, status: Task["status"]): Promise<Task> {
    return this.fetch<Task>(`/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  async delegateTask(taskId: string, agentId: string): Promise<Task> {
    return this.fetch<Task>(`/tasks/${taskId}`, {
      method: "PUT",
      body: JSON.stringify({ assignedTo: agentId }),
    });
  }

  // Missions
  async getMissions(): Promise<Mission[]> {
    return this.fetch<Mission[]>("/missions");
  }

  // Agents
  async getAgents(): Promise<Agent[]> {
    return this.fetch<Agent[]>("/agents");
  }

  // Calendar
  async getCalendar(): Promise<CalendarEvent[]> {
    return this.fetch<CalendarEvent[]>("/calendar");
  }
}

export const missionControlClient = new MissionControlClient();
