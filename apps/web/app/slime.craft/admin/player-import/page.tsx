"use client";

import { useState } from "react";
import Link from "next/link";

interface ImportResult {
  success: boolean;
  imported?: number;
  results?: Array<{ player: string; statId: number }>;
  error?: string;
}

export default function PlayerImportPage() {
  const [jsonData, setJsonData] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const handleImport = async () => {
    setImporting(true);
    setResult(null);

    try {
      // Parse JSON
      const data = JSON.parse(jsonData);

      // Validate structure
      if (!data.players || !Array.isArray(data.players)) {
        throw new Error("Invalid JSON: 'players' array is required");
      }

      // Submit to API
      const response = await fetch("/api/slimecraft/player-stats/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to import player stats");
      }

      const responseData = await response.json();
      setResult({ success: true, ...responseData });
      setJsonData(""); // Clear on success
    } catch (err) {
      setResult({
        success: false,
        error: err instanceof Error ? err.message : "An error occurred",
      });
    } finally {
      setImporting(false);
    }
  };

  const exampleJson = JSON.stringify(
    {
      snapshotDate: new Date().toISOString(),
      players: [
        {
          minecraftName: "Steve",
          playTime: 1200,
          deaths: 5,
          mobsKilled: 150,
          blocksBroken: 3000,
          blocksPlaced: 2500,
        },
        {
          minecraftName: "Alex",
          playTime: 800,
          deaths: 3,
          mobsKilled: 100,
          blocksBroken: 2000,
          blocksPlaced: 1800,
        },
      ],
    },
    null,
    2
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/slime.craft/players"
        className="text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Back to Players
      </Link>

      <h1 className="text-3xl font-bold mb-6">Import Player Stats</h1>

      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">JSON Data</h2>

        <div className="mb-4">
          <label
            htmlFor="jsonInput"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Paste your JSON data here:
          </label>
          <textarea
            id="jsonInput"
            value={jsonData}
            onChange={(e) => setJsonData(e.target.value)}
            className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm"
            placeholder={exampleJson}
          />
        </div>

        <button
          onClick={handleImport}
          disabled={importing || !jsonData.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {importing ? "Importing..." : "Import Stats"}
        </button>

        {result && (
          <div
            className={`mt-4 p-4 rounded-lg ${
              result.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {result.success ? (
              <div>
                <p className="text-green-800 font-semibold">
                  Successfully imported {result.imported} player stats!
                </p>
                {result.results && result.results.length > 0 && (
                  <ul className="mt-2 text-sm text-green-700">
                    {result.results.map((r, i) => (
                      <li key={i}>
                        ✓ {r.player} (stat ID: {r.statId})
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <p className="text-red-800">Error: {result.error}</p>
            )}
          </div>
        )}
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Example JSON Format</h2>
        <pre className="bg-white p-4 rounded-lg border border-gray-300 overflow-x-auto text-sm">
          {exampleJson}
        </pre>

        <div className="mt-4 text-sm text-gray-700">
          <h3 className="font-semibold mb-2">Field Descriptions:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>
              <code className="bg-gray-200 px-1 rounded">snapshotDate</code>:
              Optional ISO date string (defaults to now)
            </li>
            <li>
              <code className="bg-gray-200 px-1 rounded">players</code>: Array
              of player stat objects
            </li>
            <li>
              <code className="bg-gray-200 px-1 rounded">minecraftName</code>:
              Required - player's Minecraft username
            </li>
            <li>
              <code className="bg-gray-200 px-1 rounded">playTime</code>:
              Optional - play time in minutes
            </li>
            <li>
              <code className="bg-gray-200 px-1 rounded">deaths</code>: Optional
              - number of deaths
            </li>
            <li>
              <code className="bg-gray-200 px-1 rounded">mobsKilled</code>:
              Optional - number of mobs killed
            </li>
            <li>
              <code className="bg-gray-200 px-1 rounded">blocksBroken</code>:
              Optional - number of blocks broken
            </li>
            <li>
              <code className="bg-gray-200 px-1 rounded">blocksPlaced</code>:
              Optional - number of blocks placed
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
