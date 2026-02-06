// Game Center scores stub (mock QCPlay Supersnail data)
import { NextResponse } from 'next/server';

export async function GET() {
  const mockScores = [
    { player: 'GurthBr00ks', score: 1250000, rank: 1, boosts: '+10%', club: 'QCPlay 60' },
    { player: 'ClubMate1', score: 1180000, rank: 2, boosts: '+8%', club: 'QCPlay 60' },
    // ... 58 more mock
  ];

  return NextResponse.json({
    scores: mockScores.slice(0,10),
    yourScore: mockScores[0],
    message: 'Proof: Mock Game Center data (real auth pending).'
  });
}