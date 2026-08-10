'use client';

import styles from './TrustBadge.module.css';

/* ── Tier display helpers ── */
const TIER_META = {
  New:         { icon: '◆', cls: styles.badgeNew         },
  Trusted:     { icon: '◈', cls: styles.badgeTrusted     },
  Established: { icon: '❖', cls: styles.badgeEstablished },
};

/**
 * TierPill  — compact inline badge (used on GigCard, profiles)
 * Props: tier_name, trial_orders_completed, trial_orders_required
 *        showProgress (bool, default false)
 */
export function TierPill({ tier_name, trial_orders_completed = 0, trial_orders_required = 0, showProgress = false }) {
  const meta = TIER_META[tier_name] || TIER_META.New;
  const pct  = trial_orders_required > 0
    ? Math.min(100, Math.round((trial_orders_completed / trial_orders_required) * 100))
    : 100;

  return (
    <span className={`${styles.badge} ${meta.cls}`} title={`Trust tier: ${tier_name}`}>
      <span className={styles.icon}>{meta.icon}</span>
      {tier_name}
      {showProgress && trial_orders_required > 0 && (
        <span style={{ opacity: 0.75 }}>· {trial_orders_completed}/{trial_orders_required}</span>
      )}
    </span>
  );
}

/**
 * TrialProgress  — horizontal progress bar (used on GigCard + detail)
 * Props: completed, required
 */
export function TrialProgress({ completed = 0, required = 1 }) {
  const pct = Math.min(100, Math.round((completed / Math.max(required, 1)) * 100));
  const done = completed >= required;
  return (
    <div className={styles.progressWrap}>
      <div className={styles.progressLabel}>
        <span>Trial orders</span>
        <span className={styles.progressCount}>{completed}/{required}</span>
      </div>
      <div className={styles.progressTrack}>
        <div
          className={`${styles.progressFill} ${done ? styles.progressFillComplete : ''}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/**
 * TrustWidget  — full dashboard card
 * Props: trust (object from GET /api/trust/me)
 */
export function TrustWidget({ trust }) {
  if (!trust) return null;

  const {
    tier_name, trust_score, commission_pct,
    trial_orders_completed, trial_orders_required,
    trial_price_cap,
  } = trust;

  const meta = TIER_META[tier_name] || TIER_META.New;
  const isTrialTier = trial_orders_required > 0;
  const pct = isTrialTier
    ? Math.min(100, Math.round((trial_orders_completed / trial_orders_required) * 100))
    : 100;

  return (
    <div className={styles.widget}>
      <div className={styles.widgetHeader}>
        <span className={styles.widgetTitle}>Trust Status</span>
        <TierPill tier_name={tier_name} />
      </div>

      <div className={styles.scoreRow}>
        <span className={styles.scoreValue}>{parseFloat(trust_score).toFixed(1)}</span>
        <span className={styles.scoreMax}>/ 100</span>
      </div>

      <div className={styles.commRow}>
        Commission: <span className={styles.commValue}>{commission_pct}%</span>
        <span style={{ color: 'var(--text-faint)', fontSize: 'var(--text-xs)' }}>(platform fee per order)</span>
      </div>

      {isTrialTier ? (
        <div className={styles.trialSection}>
          <span className={styles.trialLabel}>
            Promotion progress — complete {trial_orders_required} trial order{trial_orders_required > 1 ? 's' : ''} dispute-free
          </span>
          <TrialProgress completed={trial_orders_completed} required={trial_orders_required} />
          {trial_price_cap && (
            <span className={styles.trialNote}>
              Trial gig price cap: ₹{parseFloat(trial_price_cap).toFixed(0)}
            </span>
          )}
        </div>
      ) : (
        <div className={styles.promoted}>
          ✓ Full pricing unlocked — no trial requirement
        </div>
      )}
    </div>
  );
}
