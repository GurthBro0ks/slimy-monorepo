"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

interface PlayerStat {
  id: number;
  snapshotDate: string;
  playTime?: number;
  deaths?: number;
  mobsKilled?: number;
  blocksBroken?: number;
  blocksPlaced?: number;
}

interface Player {
  id: number;
  minecraftName: string;
  discordTag?: string;
  discordId?: string;
  joinedAt: string;
  notes?: string;
  isActive: boolean;
  stats: PlayerStat[];
}

export default function PlayerDetailPage() {
  const params = useParams();
  const playerId = params.id as string;

  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPlayer() {
      try {
        const response = await fetch(`/api/slimecraft/players/${playerId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch player details");
        }
        const data = await response.json();
        setPlayer(data.player);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchPlayer();
  }, [playerId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link href="/slime.craft/players" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Players
        </Link>
        <p className="text-gray-600">Loading player details...</p>
      </div>
    );
  }

  if (error || !player) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link href="/slime.craft/players" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to Players
        </Link>
        <p className="text-red-600">Error: {error || "Player not found"}</p>
      </div>
    );
  }

  const latestStat = player.stats[0];

  return (
    <div className="container mx-auto px-4 py-8">
      <Link href="/slime.craft/players" className="text-blue-600 hover:underline mb-4 inline-block">
        ← Back to Players
      </Link>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-4">{player.minecraftName}</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-600">Discord Tag</p>
            <p className="text-lg font-semibold">{player.discordTag || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Joined At</p>
            <p className="text-lg font-semibold">
              {new Date(player.joinedAt).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <p className="text-lg font-semibold">
              {player.isActive ? (
                <span className="text-green-600">Active</span>
              ) : (
                <span className="text-gray-600">Inactive</span>
              )}
            </p>
          </div>
        </div>

        {player.notes && (
          <div className="mb-6">
            <p className="text-sm text-gray-600">Notes</p>
            <p className="text-gray-800">{player.notes}</p>
          </div>
        )}

        {latestStat ? (
          <div>
            <h2 className="text-xl font-bold mb-4">Latest Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {latestStat.playTime !== null && latestStat.playTime !== undefined && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Play Time</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {latestStat.playTime} min
                  </p>
                </div>
              )}
              {latestStat.deaths !== null && latestStat.deaths !== undefined && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Deaths</p>
                  <p className="text-2xl font-bold text-red-600">
                    {latestStat.deaths}
                  </p>
                </div>
              )}
              {latestStat.mobsKilled !== null && latestStat.mobsKilled !== undefined && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Mobs Killed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {latestStat.mobsKilled}
                  </p>
                </div>
              )}
              {latestStat.blocksBroken !== null && latestStat.blocksBroken !== undefined && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Blocks Broken</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {latestStat.blocksBroken}
                  </p>
                </div>
              )}
              {latestStat.blocksPlaced !== null && latestStat.blocksPlaced !== undefined && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Blocks Placed</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {latestStat.blocksPlaced}
                  </p>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Last updated: {new Date(latestStat.snapshotDate).toLocaleString()}
            </p>
          </div>
        ) : (
          <div className="text-gray-600">
            <p>No stats yet</p>
          </div>
        )}
      </div>

      {player.stats.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold mb-4">Stats History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                    Date
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">
                    Play Time
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">
                    Deaths
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">
                    Mobs Killed
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">
                    Blocks Broken
                  </th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">
                    Blocks Placed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {player.stats.map((stat) => (
                  <tr key={stat.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {new Date(stat.snapshotDate).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 text-right">
                      {stat.playTime ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 text-right">
                      {stat.deaths ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 text-right">
                      {stat.mobsKilled ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 text-right">
                      {stat.blocksBroken ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600 text-right">
                      {stat.blocksPlaced ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
