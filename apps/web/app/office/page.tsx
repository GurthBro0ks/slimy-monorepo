"use client";

// Use relative import to avoid path resolution issues
import { useOfficeState } from '../../hooks/useOfficeState';

// Team roster with agent details
const AGENT_ROSTER = [
  { name: 'ChrissG41nz', role: 'Orchestrator', personality: 'The Boss', emoji: '👑' },
  { name: 'Stitch', role: 'Web Developer', personality: 'The Surgeon', emoji: '🧑‍⚕️' },
  { name: 'Riley', role: 'Researcher', personality: 'The Detective', emoji: '🕵️' },
  { name: 'Bads', role: 'DevOps', personality: 'Systems Thinker', emoji: '⚙️' },
  { name: 'Anchor', role: 'Infrastructure', personality: 'Foundation Builder', emoji: '⚓' },
  { name: 'Forge', role: 'Toolmaker', personality: 'The Builder', emoji: '🔨' },
];

// Check if an agent has an active session
function getAgentStatus(agentName: string, sessions: any[]): { isActive: boolean; message: string } {
  if (!Array.isArray(sessions) || sessions.length === 0) {
    return { isActive: false, message: 'Waiting for tasks...' };
  }

  const hasActiveSession = sessions.some((s: any) => {
    const sessionKey = (s.key || s.id || '').toLowerCase();
    return sessionKey.includes(agentName.toLowerCase());
  });

  return hasActiveSession
    ? { isActive: true, message: 'Processing task...' }
    : { isActive: false, message: 'Waiting for tasks...' };
}

export default function OfficeDashboard() {
  const { status, sessions, presence, lastUpdated } = useOfficeState();

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 p-4 flex items-center justify-between bg-gray-950">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold text-purple-400">SlimyAI Office</div>
          <div className={`w-3 h-3 rounded-full ${
            status === 'connected' ? 'bg-green-500' :
            status === 'error' ? 'bg-red-500' : 'bg-yellow-500'
          }`}></div>
          <span className="text-xs text-gray-400 uppercase">{status}</span>
        </div>
        <div className="text-xs text-gray-500">
          {lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : '...'}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        {status === 'connecting' && (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            <span className="ml-3 text-gray-400">Connecting to Office...</span>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-red-900/20 border border-red-500 text-red-300 px-4 py-3 rounded">
            Connection error. Please check gateway.
          </div>
        )}

        {status === 'connected' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AGENT_ROSTER.map((agent) => {
              const { isActive, message } = getAgentStatus(agent.name, sessions);
              return (
                <div
                  key={agent.name}
                  className={`bg-gray-800 border rounded-lg p-4 shadow-sm transition-all ${
                    isActive
                      ? 'border-green-500/50 shadow-lg shadow-green-500/10'
                      : 'border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="text-2xl">{agent.emoji}</div>
                    <div>
                      <div className="font-semibold text-white">{agent.name}</div>
                      <div className="text-xs text-purple-400">{agent.role}</div>
                    </div>
                    <div className="ml-auto">
                      <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${
                        isActive
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-700 text-gray-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
                        }`}></span>
                        {isActive ? 'ACTIVE' : 'IDLE'}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mb-2">
                    "{agent.personality}"
                  </div>
                  <div className="bg-gray-900/50 rounded p-2 text-xs text-gray-300">
                    {message}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

    </div>
  );
}
