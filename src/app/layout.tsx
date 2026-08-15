import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RESCUE AI — Resource Recovery & Intelligent Allocation',
  description: 'AI-powered platform that discovers hidden resources inside organizations and matches them to unmet needs before new resources are purchased.',
  keywords: 'resource management, sustainability, AI, circular economy, procurement optimization',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
