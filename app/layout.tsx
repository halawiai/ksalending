import './globals.css';
import type { Metadata } from 'next';
// import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers';
import { PWAProvider } from '@/components/pwa/pwa-provider';

// const inter = Inter({ subsets: ['latin'] });
// TEMP for StackBlitz dev: use Tailwind system font stack instead of Google font

export const metadata: Metadata = {
  title: 'KSA Lending Nervous System',
  description: 'Central platform for Saudi Arabia\'s lending ecosystem',
  manifest: '/manifest.json',
  themeColor: '#10b981',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'KSA Lending',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'KSA Lending',
    'application-name': 'KSA Lending',
    'msapplication-TileColor': '#10b981',
    'msapplication-config': '/browserconfig.xml',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        {/* <body className={inter.className}> */}  {/* ← original, keep for prod */}
        <Providers>
          <PWAProvider>
            {children}
          </PWAProvider>
        </Providers>
      </body>
    </html>
  );
}