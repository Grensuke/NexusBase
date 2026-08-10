'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { getGigs, getCategories, getTopFreelancers } from '@/lib/api';
import GigCard from '@/components/GigCard';
import Icon, { CATEGORY_ICON_MAP } from '@/components/Icons';
import styles from './page.module.css';

const TYPING_PHRASES = ['React developer…', 'Logo design…', 'SEO audit…', 'Video editing…', 'Data analysis…', 'Copywriting…'];

// Hardcoded proof cards from seed data — real completed work
const PROOF_CARDS = [
  { name: 'Alex Rivera', rating: 5, gig: 'Full-stack React & Node.js web app', review: 'Outstanding web app. Clean code, on time, and great communication!' },
  { name: 'Sofia Chen', rating: 5, gig: 'Modern UI/UX design', review: 'Incredible designer. The UI is exactly what I envisioned.' },
  { name: 'Marcus Johnson', rating: 4, gig: 'SEO audit and optimization', review: 'Solid SEO audit. Already seeing improvements in rankings.' },
];

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
        background: `hsl(${hue},25%,20%)`,
        border: `2px solid hsl(${hue},25%,35%)`,
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) window.location.href = `/gigs?search=${encodeURIComponent(search)}`;
  };

  return (
    <div className={styles.page}>

      {/* ── HERO ── */}
      <section className={`${styles.hero} hero-no-offset`}>
        <div className={`container ${styles.heroLayout}`}>
          {/* Left column */}
          <div className={styles.heroLeft}>
            <h1 className={`${styles.heroTitle} animate-fade-in-up`}>
              Work you can trust.{'\n'}
              <span className={styles.heroAccent}>Talent you can prove.</span>
            </h1>

            <p className={`${styles.heroSub} animate-fade-in-up stagger-2`}>
              A marketplace where every rating is earned and every portfolio is real. Find expert freelancers for web development, design, marketing, data science, and more.
            </p>

            <form className={`${styles.searchBar} animate-fade-in-up stagger-3`} onSubmit={handleSearch} id="hero-search-form">
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
                Search
              </button>
            </form>

            <div className={`${styles.heroPills} animate-fade-in-up stagger-4`}>
              <span className={styles.pillLabel}>Popular:</span>
              {categories.slice(0, 4).map((c) => (
                <Link key={c.category_id} href={`/gigs?category=${c.category_id}`} className={styles.pill}>
                  <Icon name={CATEGORY_ICON_MAP[c.category_name] || 'zap'} size={13} /> {c.category_name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right column — Proof cards */}
          <div className={`${styles.heroRight} animate-fade-in-up stagger-3`}>
            {PROOF_CARDS.map((card, i) => (
              <div key={i} className={styles.proofCard} style={{ '--card-offset': `${i * 12}px`, '--card-rotate': `${(i - 1) * 1.5}deg` }}>
                <div className={styles.proofCardSpine} style={{ height: `${(card.rating / 5) * 100}%` }} />
                <div className={styles.proofCardInner}>
                  <div className={styles.proofCardTop}>
                    <span className={styles.proofCardName}>{card.name}</span>
                    <Stars rating={card.rating} />
                  </div>
                  <p className={styles.proofCardGig}>{card.gig}</p>
                  <p className={styles.proofCardReview}>"{card.review}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Hairline ── */}
      <hr className="section-rule" />

      {/* ── Stats ── */}
      <section className={styles.stats}>
        <div className="container">
          <div className={styles.statsGrid}>
            {[
              { value: '500+', label: 'Expert Freelancers' },
              { value: '2000+', label: 'Gigs Available' },
              { value: '98%',  label: 'Satisfaction Rate' },
              { value: '24',   label: 'Hour Support' },
            ].map(s => (
              <div key={s.label} className={`${styles.statItem} reveal`}>
                <span className={styles.statValue}>
                  <CountUp target={s.value} />
                </span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Hairline ── */}
      <hr className="section-rule" />

      {/* ── Browse Categories ── */}
      <section className={styles.section}>
        <div className="container">
          <h2 className={`section-title ${styles.sectionHead} reveal`}>Browse by Category</h2>
          <div className={styles.categoriesGrid}>
            {categories.map((c, i) => (
              <Link
                key={c.category_id}
                href={`/gigs?category=${c.category_id}`}
                className={`${styles.categoryCard} reveal reveal-delay-${Math.min(i+1,4)}`}
                id={`category-${c.category_id}`}
              >
                <Icon name={CATEGORY_ICON_MAP[c.category_name] || 'zap'} size={20} className={styles.catIcon} />
                <span className={styles.catName}>{c.category_name}</span>
                <Icon name="arrowRight" size={14} className={styles.catArrow} />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Hairline ── */}
      <hr className="section-rule" />

      {/* ── Featured Gigs ── */}
      <section className={styles.section}>
        <div className="container">
          <div className={`flex-between ${styles.sectionHead} reveal`}>
            <h2 className="section-title">Featured Gigs</h2>
            <Link href="/gigs" className="btn btn-secondary btn-sm">View All <Icon name="arrowRight" size={13} /></Link>
          </div>
          {loading ? (
            <div className="grid-auto">
              {[...Array(6)].map((_,i) => <div key={i} className="skeleton" style={{ height: 280 }} />)}
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

      {/* ── Hairline ── */}
      <hr className="section-rule" />

      {/* ── Top Freelancers ── */}
      <section className={styles.section}>
        <div className="container">
          <h2 className={`section-title ${styles.sectionHead} reveal`}>Top Rated Freelancers</h2>
          <div className={styles.freelancersGrid}>
            {freelancers.map((f, i) => (
              <div key={f.user_id} className={`${styles.freelancerCard} reveal reveal-delay-${i+1}`}>
                <FreelancerAvatar name={f.name} size={64} />
                <h3 className={styles.flName}>{f.name}</h3>
                <Stars rating={parseFloat(f.avg_rating || 0)} />
                <p className={styles.flMeta}>
                  <strong className={styles.flRating}>{parseFloat(f.avg_rating || 0).toFixed(1)}</strong>
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

      {/* ── Hairline ── */}
      <hr className="section-rule" />

      {/* ── CTA ── */}
      <section className={`${styles.cta} reveal`}>
        <div className="container">
          <div className={styles.ctaBox}>
            <h2 className={styles.ctaTitle}>Ready to get started?</h2>
            <p className={styles.ctaSub}>Join NexusBase today. Whether you're a freelancer building a reputation or a client who needs expert talent — this is where proven work gets done.</p>
            <div className={styles.ctaActions}>
              <Link href="/auth/signup?role=freelancer" className="btn btn-primary btn-xl" id="cta-freelancer-btn">
                Become a Freelancer
              </Link>
              <Link href="/auth/signup?role=client" className="btn btn-secondary btn-xl" id="cta-client-btn">
                Hire Talent
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
