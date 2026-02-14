import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Albion Market Arbitrage Dashboard',
  description: 'Live arbitrage opportunities from Albion Online Data Project market prices.'
};

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
// END OF FILE
