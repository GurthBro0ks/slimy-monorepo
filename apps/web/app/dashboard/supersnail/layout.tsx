import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Supersnail Dashboard | Slimy.ai',
  description: 'QCPlay Supersnail Club 60 leaderboard and stats dashboard',
};

export default function SupersnailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
