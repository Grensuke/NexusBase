import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/Toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'NexusBase — Freelance Services Marketplace',
  description: 'Connect with top freelancers for web development, design, marketing, and more. Post gigs, place orders, and get work done fast on NexusBase.',
  keywords: 'freelance, marketplace, gigs, web development, design, marketing',
  openGraph: {
    title: 'NexusBase — Freelance Services Marketplace',
    description: 'Find expert freelancers for any project. Fast, reliable, affordable.',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>
            <div className="page-wrapper">
              <Navbar />
              <main>{children}</main>
              <Footer />
            </div>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

