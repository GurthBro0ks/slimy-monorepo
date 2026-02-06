import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tutorial | Slimy.ai',
};

export default function TutorialPage() {
  return (
    <div className="prose mx-auto max-w-4xl p-8">
      <h1>🚀 Slimy.ai Tutorial</h1>
      
      <section>
        <h2>1. Quick Auth</h2>
        <p>Sign in → Access trader/proofs/dashboard. Proof-gated: All actions logged/verifiable.</p>
      </section>
      
      <section>
        <h2>2. Proof Viewer</h2>
        <p>/trader/proofs → Filter edges {'>'} fees. View /tmp/proof_* packs (gates/PnL).</p>
      </section>
      
      <section>
        <h2 id="supersnail">🎮 Supersnail Club Integration</h2>
        <p>For QCPlay Supersnail players (~60 club-mates):</p>
        <ul>
          <li>Connect Apple Music/Game Center → Track scores/boosts.</li>
          <li>Bot dashboard: Shadow trades tied to game events (e.g., "Edge on [market] → snail boost?").</li>
          <li>Private MVP: Alerts → Discord/Telegram ("Score 1M → bet $0.01?").</li>
        </ul>
        <p><strong>Next:</strong> /dashboard/supersnail stub → full tie-in.</p>
      </section>
      
      <section>
        <h2>3. Trading Bot</h2>
        <p>Shadow → micro-live → scale. Gates: VenueBook/Stale-Edge/Launch Radar.</p>
        <details>
          <summary>Verify Shadow</summary>
          <pre>ssh nuc2 'cd /opt/slimy/pm_updown_bot_bundle && ./scripts/run_tests.sh'</pre>
        </details>
      </section>
      
      <hr />
      <p><em>Built with proof-packs. Questions? @GurthBr00ks</em></p>
    </div>
  );
}