'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getGig, placeOrder } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Icon from '@/components/Icons';
import styles from './gig.module.css';

function Stars({ rating, size = '1rem' }) {
  const r = parseFloat(rating) || 0;
  return (
    <div className="stars" style={{ fontSize: size }}>
      {[1,2,3,4,5].map(n => (
        <span key={n} className={`star ${n <= Math.round(r) ? 'filled' : ''}`}>★</span>
      ))}
    </div>
  );
}

export default function GigDetailPage() {
  const { id }    = useParams();
  const router    = useRouter();
  const { user }  = useAuth();

  const [gig,     setGig]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getGig(id)
      .then(r => setGig(r.data))
      .catch(() => router.push('/gigs'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleOrder = async () => {
    if (!user) { router.push('/auth/login'); return; }
    if (user.role !== 'client') { setError('Only clients can place orders'); return; }
    setPlacing(true); setError('');
    try {
      const res = await placeOrder({ gig_id: id, method: 'card' });
      setSuccess(`Order #${res.data.order_id} placed! Redirecting to dashboard…`);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to place order');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '3rem' }}>
        <div className="skeleton" style={{ height: 400 }} />
      </div>
    );
  }
  if (!gig) return null;

  const avgRating = parseFloat(gig.avg_rating) || 0;

  return (
    <div className={styles.page}>
      <div className={`container ${styles.layout}`}>
        {/* ── Left: Gig details ── */}
        <div className={styles.main}>
          {/* Breadcrumb */}
          <div className={styles.breadcrumb}>
            <a onClick={() => router.push('/gigs')} style={{ cursor: 'pointer', color: 'var(--text-muted)' }}>Gigs</a>
            <span> / </span>
            <span>{gig.category_name}</span>
          </div>

          <h1 className={styles.title}>{gig.title}</h1>

          {/* Rating + stats row */}
          <div className={styles.metaRow}>
            <Stars rating={avgRating} />
            <span className={styles.ratingNum}>{avgRating > 0 ? avgRating.toFixed(1) : 'New'}</span>
            {gig.review_count > 0 && (
              <span className={styles.reviewCount}>({gig.review_count} reviews)</span>
            )}
            <span className={styles.sep}>·</span>
            <span className={styles.category}>{gig.category_name}</span>
          </div>

          {/* Freelancer row */}
          <div className={styles.freelancer}>
            <div className={styles.avatar}>{gig.freelancer_name?.charAt(0)}</div>
            <div>
              <p className={styles.freelancerName}>{gig.freelancer_name}</p>
              {gig.freelancer_rating && (
                <Stars rating={gig.freelancer_rating} size="0.85rem" />
              )}
            </div>
          </div>

          {/* Description */}
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>About this gig</h2>
            <p className={styles.description}>{gig.description}</p>
          </div>

          {/* Skills */}
          {gig.freelancer_skills?.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Freelancer skills</h2>
              <div className={styles.skills}>
                {gig.freelancer_skills.map(s => (
                  <span key={s} className={styles.skill}>{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {gig.reviews?.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Reviews ({gig.reviews.length})</h2>
              <div className={styles.reviews}>
                {gig.reviews.map(r => (
                  <div key={r.review_id} className={`glass-card ${styles.reviewCard}`}>
                    <div className={styles.reviewHeader}>
                      <div className={styles.reviewerAvatar}>{r.client_name?.charAt(0)}</div>
                      <div>
                        <p className={styles.reviewerName}>{r.client_name}</p>
                        <Stars rating={r.rating} size="0.9rem" />
                      </div>
                      <span className={styles.reviewDate}>
                        {new Date(r.review_date).toLocaleDateString()}
                      </span>
                    </div>
                    {r.comment && <p className={styles.reviewComment}>{r.comment}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Order card ── */}
        <div className={styles.sidebar}>
          <div className={`glass-card ${styles.orderCard}`}>
            <div className={styles.priceRow}>
              <span className={styles.from}>Starting at</span>
              <span className={styles.price}>${parseFloat(gig.price).toFixed(2)}</span>
            </div>

            <div className={styles.deliveryRow}>
              <span><Icon name="clock" size={14} style={{ verticalAlign: 'text-bottom', marginRight: '0.3rem' }} />Delivery</span>
              <span><strong>{gig.delivery_days}</strong> day{gig.delivery_days > 1 ? 's' : ''}</span>
            </div>

            {success && <div className="alert alert-success">{success}</div>}
            {error   && <div className="alert alert-error">{error}</div>}

            {user?.role === 'client' ? (
              <button
                id="place-order-btn"
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                onClick={handleOrder}
                disabled={placing}
              >
                {placing ? 'Placing order…' : 'Order Now'}
              </button>
            ) : user?.role === 'freelancer' ? (
              <p className={styles.noticeText}>You are viewing this as a freelancer.</p>
            ) : (
              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                onClick={() => router.push('/auth/login')}
                id="login-to-order-btn"
              >
                Sign in to Order
              </button>
            )}

            <div className={styles.guarantees}>
              <span><Icon name="shield" size={13} style={{ verticalAlign: 'text-bottom', marginRight: '0.35rem' }} />Secure payment</span>
              <span><Icon name="refreshCw" size={13} style={{ verticalAlign: 'text-bottom', marginRight: '0.35rem' }} />Money-back guarantee</span>
              <span><Icon name="messageCircle" size={13} style={{ verticalAlign: 'text-bottom', marginRight: '0.35rem' }} />24/7 support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
