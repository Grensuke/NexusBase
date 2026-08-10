'use client';

import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerSeparator} />
      <div className={`container ${styles.footerInner}`}>
        {/* Brand column */}
        <div className={styles.brandCol}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoMark}>N</span>
            <span className={styles.logoText}>Nexus<strong>Base</strong></span>
          </Link>
          <p className={styles.tagline}>
            A marketplace where every rating is earned and every portfolio is real.
          </p>
        </div>

        {/* Quick Links */}
        <div className={styles.col}>
          <h4 className={styles.colTitle}>Quick Links</h4>
          <Link href="/" className={styles.colLink}>Home</Link>
          <Link href="/gigs" className={styles.colLink}>Browse Gigs</Link>
          <Link href="/dashboard" className={styles.colLink}>Dashboard</Link>
        </div>

        {/* For Freelancers */}
        <div className={styles.col}>
          <h4 className={styles.colTitle}>For Freelancers</h4>
          <Link href="/auth/signup?role=freelancer" className={styles.colLink}>Become a Freelancer</Link>
          <Link href="/gigs/new" className={styles.colLink}>Post a Gig</Link>
          <Link href="/dashboard" className={styles.colLink}>Manage Orders</Link>
        </div>

        {/* Contact */}
        <div className={styles.col}>
          <h4 className={styles.colTitle}>Contact</h4>
          <a href="mailto:support@nexusbase.dev" className={styles.colLink}>support@nexusbase.dev</a>
          <p className={styles.colText}>Available 24/7</p>
        </div>
      </div>

      {/* Bottom bar */}
      <div className={styles.bottomBar}>
        <div className={`container ${styles.bottomInner}`}>
          <span className={styles.copyright}>© {new Date().getFullYear()} NexusBase. All rights reserved.</span>
          <div className={styles.bottomLinks}>
            <span className={styles.bottomLink}>Privacy</span>
            <span className={styles.bottomLink}>Terms</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
