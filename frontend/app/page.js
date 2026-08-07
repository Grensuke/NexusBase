'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getGigs, getCategories, getTopFreelancers } from '@/lib/api';
import GigCard from '@/components/GigCard';
import styles from './page.module.css';

const CATEGORY_ICONS = {
  'Web Development':      '💻',
  'Graphic Design':       '🎨',
  'Digital Marketing':    '📈',
  'Writing & Translation':'✍️',
  'Video & Animation':    '🎬',
  'Data Science':         '🔬',
};

export default function HomePage() {
  const [gigs,        setGigs]        = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [freelancers, setFreelancers] = useState([]);
  const [search,      setSearch]      = useState('');
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      getGigs({ limit: 6 }),
      getCategories(),
      getTopFreelancers(),
    ]).then(([gigsRes, catsRes, flRes]) => {
      setGigs(gigsRes.data.gigs || []);
      setCategories(catsRes.data || []);
      setFreelancers(flRes.data?.slice(0, 4) || []);
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) window.location.href = `/gigs?search=${encodeURIComponent(search)}`;
  };

  return (
    <div className={styles.page}>
      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroBadge}>✨ Trusted by 10,000+ clients worldwide</div>
          <h1 className={styles.heroTitle}>
            Find <span className="text-gradient">Expert Freelancers</span><br />
            for Any Project
          </h1>
          <p className={styles.heroSub}>
            Connect with top freelancers for web development, design, marketing,
            data science, and more. Get work done — fast.
          </p>

          <form className={styles.searchBar} onSubmit={handleSearch} id="hero-search-form">
            <input
              id="hero-search-input"
              type="text"
              placeholder="What service are you looking for?"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.searchInput}
            />
            <button type="submit" className={`btn btn-primary ${styles.searchBtn}`} id="hero-search-btn">
              🔍 Search
            </button>
          </form>

          <div className={styles.heroPills}>
            <span className={styles.pillLabel}>Popular:</span>
            {categories.slice(0, 4).map(c => (
              <Link key={c.category_id} href={`/gigs?category=${c.category_id}`} className={styles.pill}>
                {CATEGORY_ICONS[c.category_name] || '🔷'} {c.category_name}
              </Link>
            ))}
          </div>
        </div>

        {/* Decorative orbs */}
        <div className={styles.orb1} />
        <div className={styles.orb2} />
      </section>

      {/* ── Stats ── */}
      <section className={styles.stats}>
        <div className="container">
          <div className={styles.statsGrid}>
            {[
              { value: '500+', label: 'Expert Freelancers' },
              { value: '2,000+', label: 'Gigs Available' },
              { value: '98%', label: 'Satisfaction Rate' },
              { value: '24/7', label: 'Support' },
            ].map(s => (
              <div key={s.label} className={styles.statItem}>
                <span className={styles.statValue}>{s.value}</span>
                <span className={styles.statLabel}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Browse Categories ── */}
      <section className={styles.section}>
        <div className="container">
          <h2 className={`section-title ${styles.sectionHead}`}>Browse by Category</h2>
          <div className={styles.categoriesGrid}>
            {categories.map(c => (
              <Link
                key={c.category_id}
                href={`/gigs?category=${c.category_id}`}
                className={`glass-card ${styles.categoryCard}`}
                id={`category-${c.category_id}`}
              >
                <span className={styles.catIcon}>{CATEGORY_ICONS[c.category_name] || '🔷'}</span>
                <span className={styles.catName}>{c.category_name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Gigs ── */}
      <section className={styles.section}>
        <div className="container">
          <div className={`flex-between ${styles.sectionHead}`}>
            <h2 className="section-title">Featured Gigs</h2>
            <Link href="/gigs" className="btn btn-secondary btn-sm">View All →</Link>
          </div>
          {loading ? (
            <div className="grid-auto">
              {[...Array(6)].map((_,i) => (
                <div key={i} className="skeleton" style={{ height: 280 }} />
              ))}
            </div>
          ) : (
            <div className="grid-auto">
              {gigs.map(g => <GigCard key={g.gig_id} gig={g} />)}
            </div>
          )}
        </div>
      </section>

      {/* ── Top Freelancers ── */}
      <section className={styles.section}>
        <div className="container">
          <h2 className={`section-title ${styles.sectionHead}`}>Top Rated Freelancers</h2>
          <div className={styles.freelancersGrid}>
            {freelancers.map(f => (
              <div key={f.user_id} className={`glass-card ${styles.freelancerCard}`}>
                <div className={styles.flAvatar}>
                  {f.name?.charAt(0).toUpperCase()}
                </div>
                <h3 className={styles.flName}>{f.name}</h3>
                <div className={styles.flRating}>
                  {'★'.repeat(Math.round(parseFloat(f.avg_rating || 0)))}
                  {'☆'.repeat(5 - Math.round(parseFloat(f.avg_rating || 0)))}
                  <span>{parseFloat(f.avg_rating || 0).toFixed(1)}</span>
                </div>
                <p className={styles.flMeta}>{f.completed_orders} completed orders</p>
                {f.bio && <p className={styles.flBio}>{f.bio.slice(0, 80)}…</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.cta}>
        <div className="container">
          <div className={styles.ctaBox}>
            <h2 className={styles.ctaTitle}>Ready to get started?</h2>
            <p className={styles.ctaSub}>Join NexusBase as a freelancer or client today.</p>
            <div className={styles.ctaActions}>
              <Link href="/auth/signup?role=freelancer" className="btn btn-primary btn-lg" id="cta-freelancer-btn">
                Become a Freelancer
              </Link>
              <Link href="/auth/signup?role=client" className="btn btn-secondary btn-lg" id="cta-client-btn">
                Hire a Freelancer
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
