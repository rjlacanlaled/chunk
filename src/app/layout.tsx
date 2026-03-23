import type { Metadata, Viewport } from 'next';
import { Poppins, Syne, DM_Sans } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

const syne = Syne({
  subsets: ['latin'],
  weight: ['700', '800'],
  variable: '--font-syne',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://chunk-production.up.railway.app'),
  title: {
    default: 'Chunk — AI Productivity Agent',
    template: '%s | Chunk',
  },
  description: 'Chat-first AI productivity app that breaks big goals into manageable tasks. Talk to Chunky, your AI productivity agent.',
  openGraph: {
    title: 'Chunk — AI Productivity Agent',
    description: 'Chat-first AI productivity app that breaks big goals into manageable tasks.',
    siteName: 'Chunk',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Chunk — AI Productivity Agent',
    description: 'Chat-first AI productivity app that breaks big goals into manageable tasks.',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/chunk-logos/chunk-ai-icon.svg',
    apple: '/chunk-logos/chunk-icon-80.svg',
  },
  manifest: '/manifest.json',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#060D1F',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${poppins.variable} ${syne.variable} ${dmSans.variable} h-full scroll-smooth antialiased`}>
      <body className="font-sans min-h-full flex flex-col" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
