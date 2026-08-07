'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './Navbar.module.css';

function UserAvatar({ name, role }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';
  const hue = [...(name || '')].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <span
      className={styles.avatarCircle}
      style={{ background: `hsl(${hue},55%,32%)`, borderColor: `hsl(${hue},55%,48%)` }}
      title={`${name} (${role})`}
    >
      {initials}
    </span>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);
  const [dropOpen,  setDropOpen]  = useState(false);
  const dropRef = useRef(null);

  // Scroll-aware background
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); setDropOpen(false); }, [pathname]);

  const isActive = (href) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      <nav className={`${styles.nav} ${scrolled ? styles.scrolled : ''}`}>
        <div className={`container ${styles.inner}`}>

          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>⬡</span>
            <span className={styles.logoText}>Nexus<strong>Base</strong></span>
          </Link>

          {/* Desktop links */}
          <div className={styles.links}>
            <Link href="/gigs" className={`${styles.link} ${isActive('/gigs') ? styles.active : ''}`}>
              Browse Gigs
            </Link>
            {user?.role === 'freelancer' && (
              <Link href="/gigs/new" className={`${styles.link} ${isActive('/gigs/new') ? styles.active : ''}`}>
                Post a Gig
              </Link>
            )}
            {user && (
              <Link href="/dashboard" className={`${styles.link} ${isActive('/dashboard') ? styles.active : ''}`}>
                Dashboard
              </Link>
            )}
          </div>

          {/* Desktop actions */}
          <div className={styles.actions}>
            {user ? (
              <div className={styles.userMenu} ref={dropRef}>
                <button
                  className={styles.avatarBtn}
                  onClick={() => setDropOpen(d => !d)}
                  id="nav-user-menu-btn"
                  aria-expanded={dropOpen}
                >
                  <UserAvatar name={user.name} role={user.role} />
                  <span className={styles.userName}>{user.name.split(' ')[0]}</span>
                  <span className={`${styles.caret} ${dropOpen ? styles.caretOpen : ''}`}>▾</span>
                </button>

                {dropOpen && (
                  <div className={styles.dropdown}>
                    <div className={styles.dropHeader}>
                      <span className={styles.dropName}>{user.name}</span>
                      <span className={`badge badge-${user.role === 'freelancer' ? 'in_progress' : 'completed'}`}>
                        {user.role}
                      </span>
                    </div>
                    <hr className={styles.dropDivider} />
                    <Link href="/dashboard" className={styles.dropItem} id="nav-dashboard-link">
                      📊 Dashboard
                    </Link>
                    {user.role === 'freelancer' && (
                      <Link href="/gigs/new" className={styles.dropItem} id="nav-post-gig-link">
                        ➕ Post a Gig
                      </Link>
                    )}
                    <hr className={styles.dropDivider} />
                    <button className={`${styles.dropItem} ${styles.dropLogout}`} onClick={logout} id="nav-logout-btn">
                      🚪 Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/auth/login"  className="btn btn-ghost btn-sm"   id="nav-login-btn">Log In</Link>
                <Link href="/auth/signup" className="btn btn-primary btn-sm" id="nav-signup-btn">Get Started</Link>
              </>
            )}
          </div>

          {/* Hamburger */}
          <button
            className={`${styles.hamburger} ${menuOpen ? styles.hamburgerOpen : ''}`}
            onClick={() => setMenuOpen(m => !m)}
            id="nav-hamburger"
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      <div className={`${styles.drawer} ${menuOpen ? styles.drawerOpen : ''}`}>
        <div className={styles.drawerInner}>
          {user && (
            <div className={styles.drawerUser}>
              <UserAvatar name={user.name} role={user.role} />
              <div>
                <div className={styles.drawerName}>{user.name}</div>
                <span className={`badge badge-${user.role === 'freelancer' ? 'in_progress' : 'completed'}`}>{user.role}</span>
              </div>
            </div>
          )}
          <Link href="/gigs"      className={`${styles.drawerLink} ${isActive('/gigs') ? styles.drawerActive : ''}`}>Browse Gigs</Link>
          {user?.role === 'freelancer' && (
            <Link href="/gigs/new" className={`${styles.drawerLink} ${isActive('/gigs/new') ? styles.drawerActive : ''}`}>Post a Gig</Link>
          )}
          {user && (
            <Link href="/dashboard" className={`${styles.drawerLink} ${isActive('/dashboard') ? styles.drawerActive : ''}`}>Dashboard</Link>
          )}
          <div className={styles.drawerActions}>
            {user ? (
              <button className="btn btn-danger" onClick={logout} id="nav-logout-mobile-btn" style={{width:'100%'}}>Sign Out</button>
            ) : (
              <>
                <Link href="/auth/login"  className="btn btn-secondary" style={{flex:1}} id="nav-login-mobile">Log In</Link>
                <Link href="/auth/signup" className="btn btn-primary"   style={{flex:1}} id="nav-signup-mobile">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </div>
      {menuOpen && <div className={styles.drawerOverlay} onClick={() => setMenuOpen(false)} />}
    </>
  );
}
