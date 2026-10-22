import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'MilestoneTrust — Funding by progress', description: 'A relief-funding prototype with independent approvals and TideCloak identity governance.' };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
