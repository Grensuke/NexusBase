'use client';

import { useEffect, useState } from 'react';
import { getTrustTiers } from '@/lib/api';
import styles from './transparency.module.css';

function TierRow({ tier, index }) {
  const icons = { New: '◆', Trusted: '◈', Established: '❖' };
  const clss  = { New: styles.tierNew, Trusted: styles.tierTrusted, Established: styles.tierEstablished };

  return (
    <div className={`${styles.tierCard} ${clss[tier.tier_name] || ''} animate-fade-in-up`}
         style={{ animationDelay: `${index * 0.1}s` }}
         id={`tier-card-${tier.tier_id}`}>

      <div className={styles.tierHeader}>
        <span className={styles.tierIcon}>{icons[tier.tier_name] || '◆'}</span>
        <div>
          <h3 className={styles.tierName}>{tier.tier_name}</h3>
          <p className={styles.tierSub}>
            Trust score ≥ {parseFloat(tier.min_trust_score).toFixed(0)}
          </p>
        </div>
        <div className={styles.freelancerCount}>
          <span className={styles.countNum}>{tier.freelancers_in_tier}</span>
          <span className={styles.countLabel}>freelancers</span>
        </div>
      </div>

      <div className={styles.tierGrid}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Commission</span>
          <span className={styles.metaValue} style={{ color: 'var(--success-light)' }}>
            {parseFloat(tier.commission_pct).toFixed(0)}%
          </span>
        </div>

        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Price Cap</span>
          <span className={styles.metaValue}>
            {tier.trial_price_cap ? `₹${parseFloat(tier.trial_price_cap).toFixed(0)}` : '—'}
          </span>
        </div>

        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Trial Orders</span>
          <span className={styles.metaValue}>
            {tier.trial_orders_required > 0 ? `${tier.trial_orders_required} required` : 'Not required'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function FeeTransparencyPage() {
  const [tiers,   setTiers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    getTrustTiers()
      .then(r => setTiers(r.data || []))
      .catch(() => setError('Could not load tier data.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-wrapper">
      <main>
        <div className={styles.hero}>
          <div className="container">
            <div className={styles.heroInner}>
              <p className={styles.eyebrow}>Platform Policy</p>
              <h1 className={styles.heroTitle}>Fee Transparency</h1>
              <p className={styles.heroDesc}>
                NexusBase commission rates are publicly enforced by the database — every number
                below is live from the <code>fee_transparency</code> view. No hidden fees.
                No surprises.
              </p>
            </div>
          </div>
        </div>

        <section className={styles.tiersSection}>
          <div className="container">

            {loading && (
              <div className={styles.grid}>
                {[0, 1, 2].map(i => (
                  <div key={i} className={`${styles.skeletonCard} skeleton`} />
                ))}
              </div>
            )}

            {error && <div className="alert alert-error">{error}</div>}

            {!loading && !error && (
              <>
                <div className={styles.grid}>
                  {tiers.map((t, i) => <TierRow key={t.tier_id} tier={t} index={i} />)}
                </div>

                <div className={styles.explainer}>
                  <h2 className={styles.explainerTitle}>How the trust score works</h2>
                  <div className={styles.formulaGrid}>
                    <div className={styles.formulaItem}>
                      <span className={styles.formulaWeight}>30%</span>
                      <div>
                        <p className={styles.formulaLabel}>Skill Assessment Pass Rate</p>
                        <p className={styles.formulaDesc}>
                          Pass verified skill quizzes to establish credibility before your first order.
                        </p>
                      </div>
                    </div>
                    <div className={styles.formulaItem}>
                      <span className={styles.formulaWeight}>30%</span>
                      <div>
                        <p className={styles.formulaLabel}>Trial Completion Ratio</p>
                        <p className={styles.formulaDesc}>
                          Completed trial orders vs. attempted — rewards delivery, not just signup.
                        </p>
                      </div>
                    </div>
                    <div className={styles.formulaItem}>
                      <span className={styles.formulaWeight}>30%</span>
                      <div>
                        <p className={styles.formulaLabel}>Average Client Rating</p>
                        <p className={styles.formulaDesc}>
                          Your star rating mapped 0–100 (5 stars = 100 points). Null = 0, not a penalty.
                        </p>
                      </div>
                    </div>
                    <div className={styles.formulaItem}>
                      <span className={styles.formulaWeight} style={{ color: 'var(--error-light)' }}>−10%</span>
                      <div>
                        <p className={styles.formulaLabel}>Dispute Penalty</p>
                        <p className={styles.formulaDesc}>
                          Disputes resolved against you reduce your score, capping the gain from
                          sockpuppet trial orders.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className={styles.formulaNote}>
                    Score is clamped to [0, 100] and recalculated after every assessment,
                    trial completion, or dispute resolution.
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
