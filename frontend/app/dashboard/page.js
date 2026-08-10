'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getDashboard, updateOrderStatus, deleteGig, updateSkills, getMyTrust, raiseDispute } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/Toast';
import { useCurrency } from '@/context/CurrencyContext';
import ReviewForm from '@/components/ReviewForm';
import Icon from '@/components/Icons';
import { TrustWidget } from '@/components/TrustBadge';
import styles from './dashboard.module.css';

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status.replace('_', ' ')}</span>;
}

/* ── Order Timeline (Client) ── */
const STEPS = ['Placed', 'Accepted', 'Completed', 'Reviewed'];
const STATUS_STEP = { pending: 0, in_progress: 1, completed: 2 };

function OrderTimeline({ status, hasReview }) {
  const step = STATUS_STEP[status] ?? 0;
  const finalStep = hasReview ? 3 : step;
  return (
    <div className={styles.timeline}>
      {STEPS.map((label, i) => {
        const done   = i < finalStep || (i === 3 && hasReview);
        const active = i === finalStep && !(i === 3 && !hasReview && status !== 'completed');
        return (
          <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <span className={`${styles.timelineStep} ${done ? styles.done : active ? styles.active : ''}`}>
              <span className={styles.timelineDot} />
              <span style={{ marginLeft: '0.25rem' }}>{label}</span>
            </span>
            {i < STEPS.length - 1 && <span className={`${styles.timelineLine} ${done ? styles.done : ''}`} />}
          </span>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════
   FREELANCER DASHBOARD
═══════════════════════════════════════ */
function FreelancerDash({ data, onRefresh }) {
  const { gigs, orders, stats } = data;
  const router = useRouter();
  const { showToast } = useToast();
  const { formatPrice } = useCurrency();
  const [deletingId,  setDeletingId]  = useState(null);
  const [skillInput,  setSkillInput]  = useState('');
  // Seed skills from the dashboard API (USER_SKILLS joined with SKILLS)
  const [skills,      setSkills]      = useState(() => data.skills || []);
  // Set of skill_ids the user has already passed an assessment for
  const [passedSkillIds, setPassedSkillIds] = useState(
    () => new Set((data.passed_skill_ids || []))
  );
  const [skillSaving, setSkillSaving] = useState(false);
  const [activeTab,   setActiveTab]   = useState('overview');
  const [trust,       setTrust]       = useState(null);
  const [disputeId,   setDisputeId]   = useState(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [raisingDispute, setRaisingDispute] = useState(false);

  // Re-sync skills and passedSkillIds whenever dashboard data refreshes
  useEffect(() => {
    if (data.skills)           setSkills(data.skills);
    if (data.passed_skill_ids) setPassedSkillIds(new Set(data.passed_skill_ids));
  }, [data.skills, data.passed_skill_ids]);

  // Fetch trust snapshot
  useEffect(() => {
    getMyTrust().then(r => setTrust(r.data)).catch(() => {});
  }, []);

  const handleDelete = async (gig_id) => {
    if (!confirm('Delete this gig?')) return;
    setDeletingId(gig_id);
    try { await deleteGig(gig_id); onRefresh(); showToast('Gig deleted', 'success'); }
    catch (err) { showToast(err.response?.data?.error || 'Delete failed', 'error'); }
    finally { setDeletingId(null); }
  };

  const handleAcceptOrder = async (order_id) => {
    try { await updateOrderStatus(order_id, 'in_progress'); onRefresh(); showToast('Order accepted!', 'success'); }
    catch (err) { showToast(err.response?.data?.error || 'Error', 'error'); }
  };

  const addSkill = () => {
    const s = skillInput.trim();
    // Avoid duplicate names (case-insensitive); skill_id is null until saved via DB
    if (s && !skills.find(sk => sk.skill_name.toLowerCase() === s.toLowerCase())) {
      setSkills(sk => [...sk, { skill_id: null, skill_name: s }]);
    }
    setSkillInput('');
  };
  const removeSkill = (name) => setSkills(sk => sk.filter(x => x.skill_name !== name));
  const saveSkills = async () => {
    setSkillSaving(true);
    try {
      await updateSkills(skills.map(s => s.skill_name));
      showToast('Skills updated!', 'success');
    }
    catch { showToast('Failed to save skills', 'error'); }
    finally { setSkillSaving(false); }
  };

  // Kanban columns
  const pending    = orders.filter(o => o.status === 'pending');
  const inProgress = orders.filter(o => o.status === 'in_progress');
  const completed  = orders.filter(o => o.status === 'completed');

  const TABS = [
    { id: 'overview', icon: 'layoutGrid', label: 'Overview' },
    { id: 'orders',   icon: 'package',    label: `Orders (${orders.length})` },
    { id: 'gigs',     icon: 'shoppingBag', label: `Gigs (${gigs.length})` },
    { id: 'skills',   icon: 'zap',        label: 'Skills' },
    { id: 'trust',    icon: 'star',       label: 'Trust' },
  ];

  const handleRaiseDispute = async (order_id) => {
    if (!disputeReason.trim()) return;
    setRaisingDispute(true);
    try {
      await raiseDispute(order_id, disputeReason);
      showToast('Dispute raised — platform will review', 'success');
      setDisputeId(null);
      setDisputeReason('');
      onRefresh();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to raise dispute', 'error');
    } finally {
      setRaisingDispute(false);
    }
  };

  return (
    <div className={styles.dashLayout}>
      {/* Trust widget */}
      {trust && <TrustWidget trust={trust} />}

      {/* Stat cards */}
      <div className={styles.statsRow}>
        {[
          { icon: 'star',        label: 'Avg Rating',   value: stats?.avg_rating ? parseFloat(stats.avg_rating).toFixed(1) + ' ★' : 'N/A' },
          { icon: 'shoppingBag', label: 'Total Gigs',   value: stats?.gig_count ?? 0 },
          { icon: 'package',     label: 'Total Orders',  value: stats?.total_orders ?? 0 },
          { icon: 'dollarSign',  label: 'Total Earned',  value: formatPrice(stats?.total_earned || 0) },
        ].map(s => (
          <div key={s.label} className={`glass-card ${styles.statCard}`}>
            <span className={styles.statCardIcon}><Icon name={s.icon} size={20} /></span>
            <span className={styles.statVal}>{s.value}</span>
            <span className={styles.statLbl}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tab navigation */}
      <div className={styles.tabs}>
        {TABS.map(t => (
          <button key={t.id} className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`} onClick={() => setActiveTab(t.id)}>
            <Icon name={t.icon} size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {activeTab === 'overview' && (
        <div className={`glass-card ${styles.section}`}>
          <h2 className={styles.sectionTitle}>Order Queue — Kanban</h2>
          <div className={styles.kanban}>
            {[
              { label: 'Pending', cls: 'pending', items: pending },
              { label: 'In Progress', cls: 'progress', items: inProgress },
              { label: 'Completed', cls: 'completed', items: completed },
            ].map(col => (
              <div key={col.cls} className={styles.kanbanCol}>
                <div className={`${styles.kanbanHead} ${styles[col.cls]}`}>
                  {col.label}
                  <span className={styles.kanbanCount}>{col.items.length}</span>
                </div>
                <div className={styles.kanbanItems}>
                  {col.items.length === 0 ? (
                    <p className={styles.empty} style={{ fontSize: '0.8rem', textAlign: 'center', padding: '0.5rem' }}>Empty</p>
                  ) : col.items.map(o => (
                    <div key={o.order_id} className={styles.kanbanCard}>
                      <p className={styles.kanbanGig}>{o.gig_title}</p>
                      <p className={styles.kanbanMeta}>{o.client_name} · {formatPrice(o.amount)}</p>
                      <p className={styles.kanbanDate}>{new Date(o.order_date).toLocaleDateString()}</p>
                      {col.cls === 'pending' && (
                        <div className={styles.kanbanActions}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleAcceptOrder(o.order_id)} id={`accept-order-${o.order_id}`}>
                            ✓ Accept
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Orders tab ── */}
      {activeTab === 'orders' && (
        <div className={`glass-card ${styles.section}`}>
          <h2 className={styles.sectionTitle}>All Orders</h2>
          {orders.length === 0 ? (
            <p className={styles.empty}>No orders yet</p>
          ) : (
            <div className={styles.orderList}>
              {orders.map(o => (
                <div key={o.order_id} className={styles.orderItem}>
                  <div className={styles.orderInfo}>
                    <p className={styles.orderInfoGig}>
                      {o.gig_title}
                      {!!o.is_trial && <span className="badge badge-pending" style={{ marginLeft: '0.5rem', fontSize: '0.6rem' }}>Trial</span>}
                    </p>
                    <p className={styles.orderInfoMeta}>Client: {o.client_name} · {formatPrice(o.amount)}
                      {o.commission_amount && <span style={{ color: 'var(--text-faint)', marginLeft: '0.5rem' }}>· Fee: {formatPrice(o.commission_amount)}</span>}
                    </p>
                    <p className={styles.orderInfoDate}>{new Date(o.order_date).toLocaleDateString()}</p>
                  </div>
                  <div className={styles.orderRight}>
                    <StatusBadge status={o.status} />
                    {o.status === 'pending' && (
                      <button className="btn btn-primary btn-sm" onClick={() => handleAcceptOrder(o.order_id)} id={`accept-order-list-${o.order_id}`}>
                        Accept
                      </button>
                    )}
                    {['in_progress','completed'].includes(o.status) && !o.dispute_status && (
                      disputeId === o.order_id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: 200 }}>
                          <input
                            className="form-input"
                            style={{ fontSize: 'var(--text-xs)', padding: '0.4rem 0.7rem' }}
                            placeholder="Describe the issue…"
                            value={disputeReason}
                            onChange={e => setDisputeReason(e.target.value)}
                            id={`dispute-reason-${o.order_id}`}
                          />
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button className="btn btn-danger btn-sm" onClick={() => handleRaiseDispute(o.order_id)} disabled={raisingDispute} id={`submit-dispute-${o.order_id}`}>
                              {raisingDispute ? '…' : 'Submit'}
                            </button>
                            <button className="btn btn-ghost btn-sm" onClick={() => { setDisputeId(null); setDisputeReason(''); }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <button className="btn btn-ghost btn-sm" onClick={() => setDisputeId(o.order_id)} id={`raise-dispute-${o.order_id}`}>
                          Dispute
                        </button>
                      )
                    )}
                    {o.dispute_status && (
                      <span className={`badge ${o.dispute_status === 'open' ? 'badge-pending' : 'badge-completed'}`}>
                        {o.dispute_status === 'open' ? '⚖ Disputed' : '✓ Resolved'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Gigs tab ── */}
      {activeTab === 'gigs' && (
        <div className={`glass-card ${styles.section}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>My Gigs</h2>
            <Link href="/gigs/new" className="btn btn-primary btn-sm" id="new-gig-dash-btn">+ Post Gig</Link>
          </div>
          {gigs.length === 0 ? (
            <p className={styles.empty}>No gigs yet. <Link href="/gigs/new" style={{ color: 'var(--brand-400)' }}>Post your first gig</Link></p>
          ) : (
            <div className={styles.table}>
              <div className={styles.tableHeader}>
                <span>Gig</span><span>Category</span><span>Price</span><span>Orders</span><span>Actions</span>
              </div>
              {gigs.map(g => (
                <div key={g.gig_id} className={styles.tableRow}>
                  <span className={styles.gigTitle}>{g.title}</span>
                  <span className={styles.td}>{g.category_name}</span>
                  <span className={styles.td}>${parseFloat(g.price).toFixed(2)}</span>
                  <span className={styles.td}>{g.total_orders}</span>
                  <div className={styles.tableActions}>
                    <Link href={`/gigs/${g.gig_id}/edit`} className="btn btn-secondary btn-sm">Edit</Link>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(g.gig_id)}
                      disabled={deletingId === g.gig_id}
                      id={`delete-gig-${g.gig_id}`}
                    >
                      {deletingId === g.gig_id ? '…' : 'Delete'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Skills tab ── */}
      {activeTab === 'skills' && (
        <div className={`glass-card ${styles.section}`}>
          <h2 className={styles.sectionTitle}>My Skills</h2>
          <div className={styles.skillTags}>
            {skills.map(s => {
              const isVerified = s.skill_id && passedSkillIds.has(s.skill_id);
              return (
                <span key={s.skill_name} className={styles.skillTag}>
                  {s.skill_name}
                  <button onClick={() => removeSkill(s.skill_name)} className={styles.removeSkill}>×</button>
                  {isVerified ? (
                    <span
                      style={{
                        fontSize: '0.62rem', padding: '0.15rem 0.45rem',
                        background: 'rgba(120,200,120,0.15)', color: 'var(--success-light)',
                        borderRadius: '4px', marginLeft: '2px',
                      }}
                    >
                      ✓ Verified
                    </span>
                  ) : (
                    <Link
                      href={`/assessment?skill_name=${encodeURIComponent(s.skill_name)}&skill_id=${s.skill_id || ''}`}
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '0.65rem', padding: '0.2rem 0.5rem' }}
                      id={`assess-skill-${s.skill_name}`}
                      title="Take skill assessment"
                    >
                      Assess
                    </Link>
                  )}
                </span>
              );
            })}
            {skills.length === 0 && <p className={styles.empty}>No skills added yet</p>}
          </div>
          <div className={styles.skillInput}>
            <input
              type="text"
              className="form-input"
              placeholder="Add a skill (e.g. React)"
              value={skillInput}
              onChange={e => setSkillInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              id="skill-input"
            />
            <button className="btn btn-secondary btn-sm" onClick={addSkill}>Add</button>
            <button className="btn btn-primary btn-sm" onClick={saveSkills} disabled={skillSaving} id="save-skills-btn">
              {skillSaving ? 'Saving…' : 'Save Skills'}
            </button>
          </div>
          <Link href="/assessment" className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} id="go-to-assessments-btn">
            📋 View All Assessment History
          </Link>
        </div>
      )}

      {/* ── Trust tab ── */}
      {activeTab === 'trust' && (
        <div className={`glass-card ${styles.section}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Trust & Commission</h2>
            <Link href="/transparency" className="btn btn-ghost btn-sm" id="fee-transparency-link">Fee Schedule ↗</Link>
          </div>
          {trust ? (
            <div style={{ maxWidth: 420 }}>
              <TrustWidget trust={trust} />
              <p style={{ marginTop: 'var(--space-4)', fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                Trust score updates automatically after skill assessments, trial completions, and dispute resolutions.
              </p>
            </div>
          ) : (
            <div className="skeleton" style={{ height: 180, borderRadius: 'var(--r-lg)' }} />
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   CLIENT DASHBOARD
═══════════════════════════════════════ */
function ClientDash({ data, onRefresh }) {
  const { orders, stats } = data;
  const { showToast } = useToast();
  const [completing,   setCompleting]   = useState(null);
  const [reviewOrder,  setReviewOrder]  = useState(null);
  const [activeTab,    setActiveTab]    = useState('overview');

  const handleComplete = async (order_id) => {
    setCompleting(order_id);
    try { await updateOrderStatus(order_id, 'completed'); onRefresh(); showToast('Order marked complete!', 'success'); }
    catch (err) { showToast(err.response?.data?.error || 'Error', 'error'); }
    finally { setCompleting(null); }
  };

  const TABS = [
    { id: 'overview', icon: 'layoutGrid', label: 'Overview' },
    { id: 'orders',   icon: 'package',    label: `Orders (${orders.length})` },
  ];

  const activeOrders    = orders.filter(o => ['pending', 'in_progress'].includes(o.status));
  const completedOrders = orders.filter(o => o.status === 'completed');

  return (
    <div className={styles.dashLayout}>
      {/* Stat cards */}
      <div className={styles.statsRow}>
        {[
          { icon: 'package',     label: 'Total Orders',     value: stats?.total_orders    ?? 0 },
          { icon: 'zap',         label: 'Active Orders',    value: stats?.active_orders   ?? 0 },
          { icon: 'checkCircle', label: 'Completed',        value: stats?.completed_orders ?? 0 },
          { icon: 'creditCard',  label: 'Total Spent',      value: `$${parseFloat(stats?.total_spent || 0).toFixed(0)}` },
        ].map(s => (
          <div key={s.label} className={`glass-card ${styles.statCard}`}>
            <span className={styles.statCardIcon}><Icon name={s.icon} size={20} /></span>
            <span className={styles.statVal}>{s.value}</span>
            <span className={styles.statLbl}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Tab navigation */}
      <div className={styles.tabs}>
        {TABS.map(t => (
          <button key={t.id} className={`${styles.tab} ${activeTab === t.id ? styles.tabActive : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Overview: active + action */}
      {activeTab === 'overview' && (
        <div className={`glass-card ${styles.section}`}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Active Orders</h2>
            <Link href="/gigs" className="btn btn-primary btn-sm" id="browse-gigs-btn">Browse Gigs</Link>
          </div>
          {activeOrders.length === 0 ? (
            <p className={styles.empty}>No active orders. <Link href="/gigs" style={{ color: 'var(--brand-400)' }}>Browse gigs to get started</Link></p>
          ) : (
            <div className={styles.orderList}>
              {activeOrders.map(o => (
                <OrderCard key={o.order_id} o={o} onComplete={handleComplete} completing={completing} reviewOrder={reviewOrder} setReviewOrder={setReviewOrder} onRefresh={onRefresh} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* All orders tab */}
      {activeTab === 'orders' && (
        <div className={`glass-card ${styles.section}`}>
          <h2 className={styles.sectionTitle}>Order History</h2>
          {orders.length === 0 ? (
            <p className={styles.empty}>No orders yet</p>
          ) : (
            <div className={styles.orderList}>
              {orders.map(o => (
                <OrderCard key={o.order_id} o={o} onComplete={handleComplete} completing={completing} reviewOrder={reviewOrder} setReviewOrder={setReviewOrder} onRefresh={onRefresh} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function OrderCard({ o, onComplete, completing, reviewOrder, setReviewOrder, onRefresh }) {
  const { formatPrice } = useCurrency();
  return (
    <div className={styles.orderCard}>
      <div className={styles.orderCardHeader}>
        <div className={styles.orderCardLeft}>
          <p className={styles.orderGig}>{o.gig_title}</p>
          <OrderTimeline status={o.status} hasReview={!!o.review_id} />
        </div>
        <span className={styles.orderAmount}>{formatPrice(o.amount)}</span>
      </div>

      <div className={styles.orderMeta}>
        <span>Freelancer: <strong>{o.freelancer_name}</strong></span>
        <span>Date: {new Date(o.order_date).toLocaleDateString()}</span>
        <StatusBadge status={o.status} />
        {o.payment_status && (
          <span>Payment: <span className={`badge badge-${o.payment_status}`}>{o.payment_status}</span></span>
        )}
      </div>

      <div className={styles.orderActions}>
        {o.status === 'in_progress' && (
          <button className="btn btn-primary btn-sm" onClick={() => onComplete(o.order_id)} disabled={completing === o.order_id} id={`complete-order-${o.order_id}`}>
            {completing === o.order_id ? 'Completing…' : '✓ Mark Complete'}
          </button>
        )}
        {o.status === 'completed' && !o.review_id && (
          <button className="btn btn-secondary btn-sm" onClick={() => setReviewOrder(reviewOrder === o.order_id ? null : o.order_id)} id={`review-btn-${o.order_id}`}>
            {reviewOrder === o.order_id ? 'Cancel' : 'Leave Review'}
          </button>
        )}
        {o.review_id && (
          <span className={styles.reviewed}><Icon name="checkCircle" size={12} /> Reviewed — {o.rating}★</span>
        )}
      </div>

      {reviewOrder === o.order_id && (
        <ReviewForm orderId={o.order_id} onSubmitted={() => { setReviewOrder(null); onRefresh(); }} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   PAGE COMPONENT
═══════════════════════════════════════ */
export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    try { const res = await getDashboard(); setData(res.data); }
    catch { setError('Failed to load dashboard'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!authLoading && !user) router.replace('/auth/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) fetchDashboard();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="container" style={{ paddingTop: '3rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 'var(--r-lg)' }} />)}
      </div>
    );
  }

  if (error) return <div className="container" style={{ paddingTop: '3rem' }}><div className="alert alert-error">{error}</div></div>;
  if (!data) return null;

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={`${styles.pageHeader} animate-fade-in-up`}>
          <div>
            <h1 className="section-title display-font">Dashboard</h1>
            <p className={styles.welcome}>Welcome back, <strong>{user?.name}</strong></p>
          </div>
          <span className={`badge badge-${user.role}`} style={{ fontSize: '0.85rem', padding: '0.4rem 1.1rem' }}>
            {user.role}
          </span>
        </div>

        {user.role === 'freelancer'
          ? <FreelancerDash data={data} onRefresh={fetchDashboard} />
          : <ClientDash     data={data} onRefresh={fetchDashboard} />
        }
      </div>
    </div>
  );
}
