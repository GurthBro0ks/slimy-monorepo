"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { useRouter } from "next/navigation";

interface Task {
  id: number;
  title: string;
  description: string;
  status: string;
  assignee: string;
  priority: string;
  progress: number;
}

export default function MissionControlPage() {
  const { role, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }
      if (role !== "owner") {
        router.push("/login-landing");
        return;
      }
    }
  }, [isAuthenticated, isLoading, role, router]);

  useEffect(() => {
    if (isAuthenticated && role === "owner") {
      fetch("/api/mission-control/tasks")
        .then(res => res.json())
        .then(data => {
          setTasks(data.tasks || []);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch tasks:", err);
          setLoading(false);
        });
    }
  }, [isAuthenticated, role]);

  if (isLoading || role !== "owner") {
    return <div className="min-h-screen bg-black" />;
  }

  const inProgressTasks = tasks.filter(t => t.status === "in_progress");
  const todoTasks = tasks.filter(t => t.status === "todo");
  const doneTasks = tasks.filter(t => t.status === "done");

  return (
    <div className="min-h-screen bg-black text-[#d6b4fc] p-8 font-mono">
      <h1 className="text-4xl font-bold text-[#00ffff] tracking-widest drop-shadow-[0_0_15px_#00ffff] mb-8" style={{ fontFamily: '"Press Start 2P", cursive' }}>
        MISSION CONTROL
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* IN PROGRESS */}
        <div className="bg-[#0a0412] border-2 border-[#39ff14] p-4">
          <h2 className="text-xl text-[#39ff14] mb-4">IN PROGRESS ({inProgressTasks.length})</h2>
          {inProgressTasks.map(task => (
            <div key={task.id} className="bg-[#1a0b2e] p-3 mb-2 border border-[#39ff14]/30">
              <div className="text-[#ff7ae9] font-bold">{task.title}</div>
              <div className="text-sm opacity-70">{task.assignee} • {task.progress}%</div>
            </div>
          ))}
          {inProgressTasks.length === 0 && <p className="opacity-50">No active missions</p>}
        </div>

        {/* TODO */}
        <div className="bg-[#0a0412] border-2 border-[#ff7ae9] p-4">
          <h2 className="text-xl text-[#ff7ae9] mb-4">TODO ({todoTasks.length})</h2>
          {todoTasks.map(task => (
            <div key={task.id} className="bg-[#1a0b2e] p-3 mb-2 border border-[#ff7ae9]/30">
              <div className="text-[#ff7ae9] font-bold">{task.title}</div>
              <div className="text-sm opacity-70">{task.assignee || "Unassigned"}</div>
            </div>
          ))}
          {todoTasks.length === 0 && <p className="opacity-50">All clear!</p>}
        </div>

        {/* DONE */}
        <div className="bg-[#0a0412] border-2 border-[#00ffff] p-4">
          <h2 className="text-xl text-[#00ffff] mb-4">COMPLETED ({doneTasks.length})</h2>
          {doneTasks.slice(0, 5).map(task => (
            <div key={task.id} className="bg-[#1a0b2e] p-3 mb-2 border border-[#00ffff]/30">
              <div className="text-[#00ffff] font-bold line-through">{task.title}</div>
            </div>
          ))}
          {doneTasks.length === 0 && <p className="opacity-50">No completed missions</p>}
        </div>
      </div>

      {loading && <p className="text-[#39ff14] mt-8 animate-pulse">LOADING MISSION DATA...</p>}
    </div>
  );
}
