import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/Toast';
import { CurrencyProvider } from '@/context/CurrencyContext';
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
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <AuthProvider>
          <CurrencyProvider>
            <ToastProvider>
              <div className="page-wrapper">
                <Navbar />
                <main>{children}</main>
                <Footer />
              </div>
            </ToastProvider>
          </CurrencyProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
