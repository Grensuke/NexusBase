'use client';

import Link from 'next/link';
import styles from './GigCard.module.css';

// Per-category gradient + icon
const CATEGORY_THEMES = {
  'Web Development':       { gradient: 'linear-gradient(135deg,#1e3a8a 0%,#3b82f6 50%,#06b6d4 100%)', icon: '💻' },
  'Graphic Design':        { gradient: 'linear-gradient(135deg,#581c87 0%,#a855f7 50%,#ec4899 100%)', icon: '🎨' },
  'Digital Marketing':     { gradient: 'linear-gradient(135deg,#065f46 0%,#10b981 50%,#34d399 100%)', icon: '📣' },
  'Writing & Translation': { gradient: 'linear-gradient(135deg,#7c2d12 0%,#ea580c 50%,#fbbf24 100%)', icon: '✍️' },
  'Video & Animation':     { gradient: 'linear-gradient(135deg,#1e1b4b 0%,#6366f1 50%,#a78bfa 100%)', icon: '🎬' },
  'Data Science':          { gradient: 'linear-gradient(135deg,#164e63 0%,#0891b2 50%,#67e8f9 100%)', icon: '📊' },
};
const DEFAULT_THEME = { gradient: 'linear-gradient(135deg,#3b1fa8 0%,#7c3aed 50%,#0e7490 100%)', icon: '⚡' };

function Stars({ rating }) {
  return (
    <div className="stars">
      {[1, 2, 3, 4, 5].map(n => (
        <span key={n} className={`star ${n <= Math.round(rating) ? 'filled' : ''}`}>★</span>
      ))}
    </div>
  );
}

function Avatar({ name }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';
  // deterministic hue from name string
  const hue = [...(name || '')].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <span
      className={styles.avatar}
      style={{ background: `hsl(${hue},60%,35%)`, borderColor: `hsl(${hue},60%,50%)` }}
    >
      {initials}
    </span>
  );
}

export default function GigCard({ gig }) {
  const {
    gig_id, title, price, delivery_days,
    category_name, freelancer_name, freelancer_rating,
    avg_rating, review_count,
  } = gig;

  const displayRating = parseFloat(avg_rating || freelancer_rating || 0);
  const theme = CATEGORY_THEMES[category_name] || DEFAULT_THEME;

  return (
    <Link href={`/gigs/${gig_id}`} className={`glass-card ${styles.card}`} id={`gig-card-${gig_id}`}>

      {/* Banner */}
      <div className={styles.banner} style={{ background: theme.gradient }}>
        <span className={styles.bannerIcon}>{theme.icon}</span>
        <div className={styles.bannerShimmer} />
      </div>

      <div className={styles.body}>
        <span className={styles.category}>{category_name}</span>
        <h3 className={styles.title}>{title}</h3>

        <div className={styles.meta}>
          <Stars rating={displayRating} />
          <span className={styles.ratingText}>
            {displayRating > 0 ? displayRating.toFixed(1) : 'New'}
            {review_count > 0 && <span className={styles.reviewCount}> ({review_count})</span>}
          </span>
        </div>

        <div className={styles.freelancerRow}>
          <Avatar name={freelancer_name} />
          <span className={styles.freelancerName}>{freelancer_name}</span>
        </div>
      </div>

      <div className={styles.footer}>
        <span className={styles.delivery}>⏱ {delivery_days}d delivery</span>
        <span className={styles.price}>
          <span className={styles.from}>FROM</span>
          <span className={styles.priceAmount}>${parseFloat(price).toFixed(0)}</span>
        </span>
      </div>
    </Link>
  );
}
