import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Supersnail Dashboard | Slimy.ai',
};

export default function SupersnailDashboard() {
  const mockLeaderboard = [
    { rank: 1, player: 'GurthBr00ks', score: 1250000, boosts: '+10%', dailyGain: '+50k' },
    { rank: 2, player: 'ClubMate1', score: 1180000, boosts: '+8%', dailyGain: '+45k' },
    { rank: 3, player: 'ClubMate2', score: 1150000, boosts: '+7%', dailyGain: '+40k' },
    // Mock top 10
    { rank: 4, player: 'Player4', score: 1100000, boosts: '+6%', dailyGain: '+35k' },
    { rank: 5, player: 'Player5', score: 1080000, boosts: '+5%', dailyGain: '+30k' },
    { rank: 6, player: 'Player6', score: 1050000, boosts: '+4%', dailyGain: '+28k' },
    { rank: 7, player: 'Player7', score: 1020000, boosts: '+3%', dailyGain: '+25k' },
    { rank: 8, player: 'Player8', score: 1000000, boosts: '+2%', dailyGain: '+22k' },
    { rank: 9, player: 'Player9', score: 980000, boosts: '+1%', dailyGain: '+20k' },
    { rank: 10, player: 'Player10', score: 960000, boosts: '0%', dailyGain: '+18k' },
  ];

  return (
    <div className="prose mx-auto max-w-4xl p-8">
      <h1>🎮 Supersnail Club Dashboard</h1>
      
      <section>
        <h2>Your Stats</h2>
        <p>Score: 1.25M | Rank: #1/60 | Boosts: +10% | Daily: +50k</p>
        <a href="/api/supersnail/scores">Refresh Scores</a>
      </section>
      
      <section>
        <h2>Top 10 Leaderboard</h2>
        <table className="table-auto w-full">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Score</th>
              <th>Boosts</th>
              <th>Daily Gain</th>
            </tr>
          </thead>
          <tbody>
            {mockLeaderboard.map((player) => (
              <tr key={player.rank}>
                <td>{player.rank}</td>
                <td>{player.player}</td>
                <td>{player.score.toLocaleString()}</td>
                <td>{player.boosts}</td>
                <td>{player.dailyGain}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      
      <section>
        <h2>Bot Alerts</h2>
        <p>Score milestone → Telegram "1M → Edge market?" (stub)</p>
      </section>
      
      <hr />
      <p><em>Private club MVP. Proof-gated. @GurthBr00ks</em></p>
    </div>
  );
}