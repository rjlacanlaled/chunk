import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import { Providers } from '@/components/providers';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Chunk',
  description: 'Chat-first AI productivity app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${poppins.variable} h-full antialiased`}>
      <body className="font-sans min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
