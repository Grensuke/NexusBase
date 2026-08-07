import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/context/AuthContext';
import Navbar from '@/components/Navbar';

const inter = Inter({ subsets: ['latin'], display: 'swap' });

export const metadata = {
  title: 'NexusBase — Freelance Services Marketplace',
  description: 'Connect with top freelancers for web development, design, marketing, and more. Post gigs, place orders, and get work done fast on NexusBase.',
  keywords: 'freelance, marketplace, gigs, web development, design, marketing',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <AuthProvider>
          <div className="page-wrapper">
            <Navbar />
            <main>{children}</main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
