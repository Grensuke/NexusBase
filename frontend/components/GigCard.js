'use client';

import Link from 'next/link';
import Icon, { CATEGORY_ICON_MAP } from './Icons';
import styles from './GigCard.module.css';

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
  const hue = [...(name || '')].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <span
      className={styles.avatar}
      style={{ background: `hsl(${hue},25%,22%)`, borderColor: `hsl(${hue},25%,36%)` }}
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
  const spineHeight = displayRating > 0 ? `${(displayRating / 5) * 100}%` : '0%';
  const iconName = CATEGORY_ICON_MAP[category_name] || 'zap';

  return (
    <Link href={`/gigs/${gig_id}`} className={styles.card} id={`gig-card-${gig_id}`}>

      {/* Proof Spine — height proportional to rating */}
      <div className={styles.proofSpine} aria-hidden="true">
        <div className={styles.spineFill} style={{ height: spineHeight }} />
      </div>

      <div className={styles.cardInner}>
        {/* Category */}
        <div className={styles.categoryRow}>
          <Icon name={iconName} size={14} className={styles.catIcon} />
          <span className={styles.catName}>{category_name}</span>
        </div>

        {/* Title */}
        <h3 className={styles.title}>{title}</h3>

        {/* Rating */}
        <div className={styles.meta}>
          <Stars rating={displayRating} />
          <span className={styles.ratingText}>
            {displayRating > 0 ? displayRating.toFixed(1) : 'New'}
            {review_count > 0 && <span className={styles.reviewCount}> ({review_count})</span>}
          </span>
        </div>

        {/* Freelancer */}
        <div className={styles.freelancerRow}>
          <Avatar name={freelancer_name} />
          <span className={styles.freelancerName}>{freelancer_name}</span>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <span className={styles.delivery}>
            <Icon name="clock" size={12} style={{ opacity: 0.6 }} /> {delivery_days}d delivery
          </span>
          <span className={styles.price}>
            <span className={styles.from}>FROM</span>
            <span className={styles.priceAmount}>${parseFloat(price).toFixed(0)}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
