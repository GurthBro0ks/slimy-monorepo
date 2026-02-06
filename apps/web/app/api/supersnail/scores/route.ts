// Game Center scores stub (mock QCPlay Supersnail data)
import { NextResponse } from "next/server";

export async function GET() {
  const mockScores = [
    { player: "GurthBr00ks", score: 1250000, rank: 1, boosts: "+10%", dailyGain: "+50k", trend: "up" as const, streak: 14, club: "QCPlay 60" },
    { player: "ClubMate1", score: 1180000, rank: 2, boosts: "+8%", dailyGain: "+45k", trend: "up" as const, streak: 7, club: "QCPlay 60" },
    { player: "ClubMate2", score: 1150000, rank: 3, boosts: "+7%", dailyGain: "+40k", trend: "flat" as const, streak: 3, club: "QCPlay 60" },
    { player: "Player4", score: 1100000, rank: 4, boosts: "+6%", dailyGain: "+35k", trend: "up" as const, streak: 5, club: "QCPlay 60" },
    { player: "Player5", score: 1080000, rank: 5, boosts: "+5%", dailyGain: "+30k", trend: "down" as const, streak: 0, club: "QCPlay 60" },
    { player: "Player6", score: 1050000, rank: 6, boosts: "+4%", dailyGain: "+28k", trend: "flat" as const, streak: 2, club: "QCPlay 60" },
    { player: "Player7", score: 1020000, rank: 7, boosts: "+3%", dailyGain: "+25k", trend: "up" as const, streak: 1, club: "QCPlay 60" },
    { player: "Player8", score: 1000000, rank: 8, boosts: "+2%", dailyGain: "+22k", trend: "down" as const, streak: 0, club: "QCPlay 60" },
    { player: "Player9", score: 980000, rank: 9, boosts: "+1%", dailyGain: "+20k", trend: "flat" as const, streak: 0, club: "QCPlay 60" },
    { player: "Player10", score: 960000, rank: 10, boosts: "0%", dailyGain: "+18k", trend: "down" as const, streak: 0, club: "QCPlay 60" },
  ];

  return NextResponse.json({
    scores: mockScores,
    yourScore: mockScores[0],
    lastUpdated: new Date().toISOString(),
    message: "Proof: Mock Game Center data (real auth pending).",
  });
}
