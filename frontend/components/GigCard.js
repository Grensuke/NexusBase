'use client';

import Link from 'next/link';
import styles from './GigCard.module.css';

function Stars({ rating }) {
  return (
    <div className="stars">
      {[1,2,3,4,5].map(n => (
        <span key={n} className={`star ${n <= Math.round(rating) ? 'filled' : ''}`}>★</span>
      ))}
    </div>
  );
}

export default function GigCard({ gig }) {
  const {
    gig_id, title, price, delivery_days,
    category_name, freelancer_name, freelancer_rating,
    avg_rating, review_count,
  } = gig;

  const displayRating = parseFloat(avg_rating || freelancer_rating || 0);

  return (
    <Link href={`/gigs/${gig_id}`} className={`glass-card ${styles.card}`} id={`gig-card-${gig_id}`}>
      {/* Gradient banner */}
      <div className={styles.banner} />

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

        <p className={styles.freelancer}>by {freelancer_name}</p>
      </div>

      <div className={styles.footer}>
        <span className={styles.delivery}>⏱ {delivery_days}d delivery</span>
        <span className={styles.price}>
          <span className={styles.from}>From</span>
          ${parseFloat(price).toFixed(0)}
        </span>
      </div>
    </Link>
  );
}
