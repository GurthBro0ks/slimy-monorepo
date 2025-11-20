import { Metadata } from 'next';
import OpportunitiesRadarClient from './OpportunitiesRadarClient';

export const metadata: Metadata = {
  title: 'Opportunities Radar - Experimental',
  description: 'Experimental opportunities radar view for the Slimy web app',
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * /opps route - Experimental Opportunities Radar
 *
 * This route is isolated and not linked in the main navigation.
 * Access via direct URL only: /opps
 *
 * Features:
 * - Mode switcher (Quick/Daily)
 * - Domain filters (Markets, Trends, Class Actions, Freebies)
 * - Client-side filtering
 * - Debug panel for development
 */
export default function OpportunitiesPage() {
  return <OpportunitiesRadarClient />;
}
