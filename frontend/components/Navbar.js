'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './Navbar.module.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className={styles.nav}>
      <div className={`container ${styles.inner}`}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className={styles.logoIcon}>⬡</span>
          <span>Nexus<strong>Base</strong></span>
        </Link>

        {/* Desktop links */}
        <div className={styles.links}>
          <Link href="/gigs" className={styles.link}>Browse Gigs</Link>
          {user?.role === 'freelancer' && (
            <Link href="/gigs/new" className={styles.link}>Post a Gig</Link>
          )}
          {user && (
            <Link href="/dashboard" className={styles.link}>Dashboard</Link>
          )}
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          {user ? (
            <>
              <span className={styles.userName}>
                <span className={styles.roleTag}>{user.role}</span>
                {user.name}
              </span>
              <button className="btn btn-ghost btn-sm" onClick={logout} id="nav-logout-btn">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link href="/auth/login"  className="btn btn-ghost btn-sm" id="nav-login-btn">Log In</Link>
              <Link href="/auth/signup" className="btn btn-primary btn-sm" id="nav-signup-btn">Get Started</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className={styles.hamburger} onClick={() => setMenuOpen(!menuOpen)} id="nav-hamburger">
          <span /><span /><span />
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          <Link href="/gigs"      onClick={() => setMenuOpen(false)}>Browse Gigs</Link>
          {user?.role === 'freelancer' && (
            <Link href="/gigs/new" onClick={() => setMenuOpen(false)}>Post a Gig</Link>
          )}
          {user && <Link href="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>}
          {!user ? (
            <>
              <Link href="/auth/login"  onClick={() => setMenuOpen(false)}>Log In</Link>
              <Link href="/auth/signup" onClick={() => setMenuOpen(false)}>Get Started</Link>
            </>
          ) : (
            <button onClick={() => { logout(); setMenuOpen(false); }}>Sign Out</button>
          )}
        </div>
      )}
    </nav>
  );
}
