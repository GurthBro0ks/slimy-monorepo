"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Player {
  id: number;
  minecraftName: string;
  discordTag?: string;
  joinedAt: string;
  isActive: boolean;
}

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlayers() {
      try {
        const response = await fetch("/api/slimecraft/players?activeOnly=true");
        if (!response.ok) {
          throw new Error("Failed to fetch players");
        }
        const data = await response.json();
        setPlayers(data.players || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchPlayers();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Slime.craft Players</h1>
        <p className="text-gray-600">Loading players...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Slime.craft Players</h1>
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Slime.craft Players</h1>

      {players.length === 0 ? (
        <p className="text-gray-600">No active players found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-300 rounded-lg shadow">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Minecraft Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Discord Tag
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Joined At
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {players.map((player) => (
                <tr key={player.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {player.minecraftName}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {player.discordTag || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(player.joinedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <Link
                      href={`/slime.craft/players/${player.id}`}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
