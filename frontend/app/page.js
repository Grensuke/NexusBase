'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getGigs, getCategories, getTopFreelancers } from '@/lib/api';
import GigCard from '@/components/GigCard';
import styles from './page.module.css';




const CATEGORY_THEMES = {
  'Web Development':       { icon: '💻', gradient: 'linear-gradient(135deg,#1e3a8a,#3b82f6,#06b6d4)', count: null },
  'Graphic Design':        { icon: '🎨', gradient: 'linear-gradient(135deg,#581c87,#a855f7,#ec4899)', count: null },
  'Digital Marketing':     { icon: '📣', gradient: 'linear-gradient(135deg,#065f46,#10b981,#34d399)', count: null },
  'Writing & Translation': { icon: '✍️', gradient: 'linear-gradient(135deg,#7c2d12,#ea580c,#fbbf24)', count: null },
  'Video & Animation':     { icon: '🎬', gradient: 'linear-gradient(135deg,#1e1b4b,#6366f1,#a78bfa)', count: null },
  'Data Science':          { icon: '📊', gradient: 'linear-gradient(135deg,#164e63,#0891b2,#67e8f9)', count: null },
};

const TYPING_PHRASES = ['React developer…', 'Logo design…', 'SEO audit…', 'Video editing…', 'Data analysis…', 'Copywriting…'];

function Stars({ rating }) {
  return (
    <div className="stars">
      {[1,2,3,4,5].map(n => (
        <span key={n} className={`star ${n <= Math.round(rating) ? 'filled' : ''}`}>★</span>
      ))}
    </div>
  );
}

function CountUp({ target, suffix = '' }) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const animated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !animated.current) {
        animated.current = true;
        const num = parseFloat(target.replace(/[^0-9.]/g, ''));
        const dur = 1400;
        const start = performance.now();
        const step = (now) => {
          const progress = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setValue(Math.round(eased * num));
          if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  const raw = target.replace(/[^0-9.]/g, '');
  const prefix = target.replace(/[0-9.,+%]/g, '').trim();
  const hasSuffix = target.includes('+') ? '+' : (target.includes('%') ? '%' : suffix);

  return <span ref={ref}>{prefix}{value.toLocaleString()}{hasSuffix}</span>;
}

function FreelancerAvatar({ name, size = 64 }) {
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '?';
  const hue = [...(name || '')].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className={styles.flAvatarCircle}
      style={{
        width: size, height: size,
        background: `hsl(${hue},55%,28%)`,
        border: `2px solid hsl(${hue},55%,45%)`,
        fontSize: size * 0.3,
      }}
    >
      {initials}
    </div>
  );
}

export default function HomePage() {
  const [gigs,        setGigs]        = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [freelancers, setFreelancers] = useState([]);
  const [search,      setSearch]      = useState('');
  const [loading,     setLoading]     = useState(true);
  const [typingIdx,   setTypingIdx]   = useState(0);
  const [typingText,  setTypingText]  = useState('');
  const [typingDel,   setTypingDel]   = useState(false);

  // Fetch data
  useEffect(() => {
    Promise.all([getGigs({ limit: 6 }), getCategories(), getTopFreelancers()])
      .then(([gigsRes, catsRes, flRes]) => {
        setGigs(gigsRes.data.gigs || []);
        setCategories(catsRes.data || []);
        setFreelancers(flRes.data?.slice(0, 4) || []);
      }).catch(console.error)
        .finally(() => setLoading(false));
  }, []);

  // Typing effect
  useEffect(() => {
    const phrase = TYPING_PHRASES[typingIdx];
    const timeout = setTimeout(() => {
      if (!typingDel) {
        if (typingText.length < phrase.length) {
          setTypingText(phrase.slice(0, typingText.length + 1));
        } else {
          setTimeout(() => setTypingDel(true), 1400);
        }
      } else {
        if (typingText.length > 0) {
          setTypingText(typingText.slice(0, -1));
        } else {
          setTypingDel(false);
          setTypingIdx((typingIdx + 1) % TYPING_PHRASES.length);
        }
      }
    }, typingDel ? 45 : 80);
    return () => clearTimeout(timeout);
  }, [typingText, typingDel, typingIdx]);

  // Scroll-reveal
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [loading]);

  // Scroll indicator
  const [showScroll, setShowScroll] = useState(true);
  useEffect(() => {
    const h = () => setShowScroll(window.scrollY < 80);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) window.location.href = `/gigs?search=${encodeURIComponent(search)}`;
  };

  return (
    <div className={styles.page}>

      {/* ── VIDEO HERO ── */}
      <section className={`${styles.hero} hero-no-offset`}>
        {/* Looping background video — local file */}
        <video
          className={styles.heroBgVideo}
          autoPlay
          muted
          loop
          playsInline
          src="/spaceV.mp4"
        />

        {/* Deep overlay so text reads well */}
        <div className={styles.heroOverlay} />

        {/* Vignette edges */}
        <div className={styles.heroVignette} />

        {/* Content */}
        <div className={styles.heroInner}>
          <div className={`${styles.heroBadge} animate-fade-in-up`}>
            <span className={styles.heroBadgeDot} />
            Trusted by 10,000+ clients worldwide
          </div>

          <h1 className={`${styles.heroTitle} animate-fade-in-up stagger-2`}>
            Find <span className={styles.heroGradientText}>Expert Freelancers</span><br />
            for Any Project
          </h1>

          <p className={`${styles.heroSub} animate-fade-in-up stagger-3`}>
            Connect with top freelancers for web development, design, marketing,
            data science, and more. Get work done — fast.
          </p>

          <form className={`${styles.searchBar} animate-fade-in-up stagger-4`} onSubmit={handleSearch} id="hero-search-form">
            <input
              id="hero-search-input"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.searchInput}
              placeholder=""
            />
            <span className={styles.typingPlaceholder} aria-hidden="true">
              {search.length === 0 && (
                <>{typingText}<span className={styles.cursor}>|</span></>
              )}
            </span>
            <button type="submit" className={styles.searchBtn} id="hero-search-btn">
              🔍 Search
            </button>
          </form>

          <div className={`${styles.heroPills} animate-fade-in-up stagger-5`}>
            <span className={styles.pillLabel}>Popular:</span>
            {categories.slice(0, 4).map((c) => (
              <Link key={c.category_id} href={`/gigs?category=${c.category_id}`} className={styles.pill}>
                {CATEGORY_THEMES[c.category_name]?.icon || '🔷'} {c.category_name}
              </Link>
            ))}
          </div>

          {/* Liquid-glass CTA */}
          <a href="/gigs" className={`${styles.liquidGlassBtn} animate-fade-in-up stagger-6`}>
            Explore All Services
          </a>
        </div>

        {/* Scroll indicator */}
        <div className={`${styles.scrollHint} ${!showScroll ? styles.scrollHintHidden : ''}`}>
          <span>Explore</span>
          <div className={styles.scrollArrow}>▾</div>
        </div>
      </section>

      {/* ── Statement divider ── */}
      <div className={styles.sectionDivider}>Where talent meets opportunity</div>

      {/* ── Stats ── */}
      <section className={styles.stats}>
        <div className="container">
          <div className={styles.statsGrid}>
            {[
              { value: '500+', label: 'Expert Freelancers', icon: '👥' },
              { value: '2000+', label: 'Gigs Available',    icon: '🛍️' },
              { value: '98%',  label: 'Satisfaction Rate',  icon: '⭐' },
              { value: '24',   label: 'Hour Support',        icon: '🕐' },
            ].map(s => (
              <div key={s.label} className={`${styles.statItem} reveal`}>
                <span className={styles.statIcon}>{s.icon}</span>
                <span className={styles.statValue}>
                  <CountUp target={s.value} />
                </span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Statement divider ── */}
      <div className={styles.sectionDivider}>Find your next project</div>

      {/* ── Browse Categories ── */}
      <section className={styles.section}>
        <div className="container">
          <h2 className={`section-title ${styles.sectionHead} reveal`}>Browse by Category</h2>
          <div className={styles.categoriesGrid}>
            {categories.map((c, i) => {
              const theme = CATEGORY_THEMES[c.category_name] || { icon: '🔷', gradient: 'linear-gradient(135deg,#3b1fa8,#7c3aed)' };
              return (
                <Link
                  key={c.category_id}
                  href={`/gigs?category=${c.category_id}`}
                  className={`${styles.categoryCard} reveal reveal-delay-${Math.min(i+1,4)}`}
                  id={`category-${c.category_id}`}
                >
                  <span className={styles.catNumber}>{String(i + 1).padStart(2, '0')}</span>
                  <div className={styles.catBanner} style={{ background: theme.gradient }}>
                    <span className={styles.catBannerIcon}>{theme.icon}</span>
                  </div>
                  <div className={styles.catBody}>
                    <span className={styles.catName}>{c.category_name}</span>
                    <span className={styles.catArrow}>→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Statement divider ── */}
      <div className={styles.sectionDivider}>Top rated services</div>

      {/* ── Featured Gigs ── */}
      <section className={styles.section}>
        <div className="container">
          <div className={`flex-between ${styles.sectionHead} reveal`}>
            <h2 className="section-title">Featured Gigs</h2>
            <Link href="/gigs" className="btn btn-secondary btn-sm">View All →</Link>
          </div>
          {loading ? (
            <div className="grid-auto">
              {[...Array(6)].map((_,i) => <div key={i} className="skeleton" style={{ height: 300 }} />)}
            </div>
          ) : (
            <div className="grid-auto">
              {gigs.map((g, i) => (
                <div key={g.gig_id} className={`reveal reveal-delay-${Math.min(i % 3 + 1, 4)}`}>
                  <GigCard gig={g} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Statement divider ── */}
      <div className={styles.sectionDivider}>Expert talent on demand</div>

      {/* ── Top Freelancers ── */}
      <section className={styles.section}>
        <div className="container">
          <h2 className={`section-title ${styles.sectionHead} reveal`}>Top Rated Freelancers</h2>
          <div className={styles.freelancersGrid}>
            {freelancers.map((f, i) => (
              <div key={f.user_id} className={`glass-card ${styles.freelancerCard} reveal reveal-delay-${i+1}`}>
                <FreelancerAvatar name={f.name} size={72} />
                <h3 className={styles.flName}>{f.name}</h3>
                <Stars rating={parseFloat(f.avg_rating || 0)} />
                <p className={styles.flMeta}>
                  <strong className="text-gradient">{parseFloat(f.avg_rating || 0).toFixed(1)}</strong>
                  &nbsp;· {f.completed_orders} completed
                </p>
                {f.bio && <p className={styles.flBio}>{f.bio.slice(0, 80)}…</p>}
                {f.skills?.length > 0 && (
                  <div className={styles.flSkills}>
                    {f.skills.slice(0, 3).map(s => (
                      <span key={s} className={styles.skillChip}>{s}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={`${styles.cta} reveal`}>
        <div className="container">
          <div className={styles.ctaBox}>
            <div className={styles.ctaOrb1} />
            <div className={styles.ctaOrb2} />
            <div className={styles.ctaContent}>
              <div className={styles.heroBadge} style={{ marginBottom: '1rem' }}>
                <span className={styles.heroBadgeDot} />
                🚀 Join the community
              </div>
              <h2 className={`${styles.ctaTitle} display-font`}>Ready to get started?</h2>
              <p className={styles.ctaSub}>Join NexusBase today as a freelancer or find the perfect talent for your project.</p>
              <div className={styles.ctaActions}>
                <Link href="/auth/signup?role=freelancer" className="btn btn-primary btn-xl" id="cta-freelancer-btn">
                  🎯 Become a Freelancer
                </Link>
                <Link href="/auth/signup?role=client" className="btn btn-secondary btn-xl" id="cta-client-btn">
                  💼 Hire Talent
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
