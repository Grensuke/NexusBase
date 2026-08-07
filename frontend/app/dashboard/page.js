'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getDashboard, updateOrderStatus, deleteGig, updateSkills } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import ReviewForm from '@/components/ReviewForm';
import styles from './dashboard.module.css';

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status.replace('_', ' ')}</span>;
}

/* ────────────────────────────
   FREELANCER DASHBOARD
──────────────────────────── */
function FreelancerDash({ data, onRefresh }) {
  const { gigs, orders, stats } = data;
  const router = useRouter();
  const [deletingId, setDeletingId] = useState(null);
  const [skillInput, setSkillInput] = useState('');
  const [skills,     setSkills]     = useState([]);
  const [skillSaving, setSkillSaving] = useState(false);

  const handleDelete = async (gig_id) => {
    if (!confirm('Delete this gig?')) return;
    setDeletingId(gig_id);
    try { await deleteGig(gig_id); onRefresh(); }
    catch (err) { alert(err.response?.data?.error || 'Delete failed'); }
    finally { setDeletingId(null); }
  };

  const handleAcceptOrder = async (order_id) => {
    try { await updateOrderStatus(order_id, 'in_progress'); onRefresh(); }
    catch (err) { alert(err.response?.data?.error || 'Error'); }
  };

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s)) setSkills(sk => [...sk, s]);
    setSkillInput('');
  };
  const removeSkill = (s) => setSkills(sk => sk.filter(x => x !== s));
  const saveSkills = async () => {
    setSkillSaving(true);
    try { await updateSkills(skills); alert('Skills updated!'); }
    catch { alert('Failed to save skills'); }
    finally { setSkillSaving(false); }
  };

  return (
    <div className={styles.dashLayout}>
      {/* Stats row */}
      <div className={styles.statsRow}>
        {[
          { label: 'Avg Rating', value: stats?.avg_rating ? parseFloat(stats.avg_rating).toFixed(1) + ' ★' : 'N/A' },
          { label: 'Total Gigs', value: stats?.gig_count ?? 0 },
          { label: 'Total Orders', value: stats?.total_orders ?? 0 },
          { label: 'Total Earned', value: `$${parseFloat(stats?.total_earned || 0).toFixed(2)}` },
        ].map(s => (
          <div key={s.label} className={`glass-card ${styles.statCard}`}>
            <span className={styles.statVal}>{s.value}</span>
            <span className={styles.statLbl}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Skills */}
      <div className={`glass-card ${styles.section}`}>
        <h2 className={styles.sectionTitle}>My Skills</h2>
        <div className={styles.skillTags}>
          {skills.map(s => (
            <span key={s} className={styles.skillTag}>
              {s}
              <button onClick={() => removeSkill(s)} className={styles.removeSkill}>×</button>
            </span>
          ))}
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
      </div>

      {/* My Gigs */}
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
                <div className={styles.actions}>
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

      {/* Order Queue */}
      <div className={`glass-card ${styles.section}`}>
        <h2 className={styles.sectionTitle}>Order Queue</h2>
        {orders.length === 0 ? (
          <p className={styles.empty}>No active orders</p>
        ) : (
          <div className={styles.orderList}>
            {orders.map(o => (
              <div key={o.order_id} className={styles.orderItem}>
                <div className={styles.orderInfo}>
                  <p className={styles.orderGig}>{o.gig_title}</p>
                  <p className={styles.orderMeta}>Client: {o.client_name} · ${parseFloat(o.amount).toFixed(2)}</p>
                  <p className={styles.orderDate}>{new Date(o.order_date).toLocaleDateString()}</p>
                </div>
                <div className={styles.orderRight}>
                  <StatusBadge status={o.status} />
                  {o.status === 'pending' && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleAcceptOrder(o.order_id)}
                      id={`accept-order-${o.order_id}`}
                    >
                      Accept
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────
   CLIENT DASHBOARD
──────────────────────────── */
function ClientDash({ data, onRefresh }) {
  const { orders, stats } = data;
  const [completing, setCompleting] = useState(null);
  const [reviewOrder, setReviewOrder] = useState(null);

  const handleComplete = async (order_id) => {
    setCompleting(order_id);
    try { await updateOrderStatus(order_id, 'completed'); onRefresh(); }
    catch (err) { alert(err.response?.data?.error || 'Error'); }
    finally { setCompleting(null); }
  };

  return (
    <div className={styles.dashLayout}>
      {/* Stats row */}
      <div className={styles.statsRow}>
        {[
          { label: 'Total Orders',     value: stats?.total_orders   ?? 0 },
          { label: 'Active Orders',    value: stats?.active_orders  ?? 0 },
          { label: 'Completed Orders', value: stats?.completed_orders ?? 0 },
          { label: 'Total Spent',      value: `$${parseFloat(stats?.total_spent || 0).toFixed(2)}` },
        ].map(s => (
          <div key={s.label} className={`glass-card ${styles.statCard}`}>
            <span className={styles.statVal}>{s.value}</span>
            <span className={styles.statLbl}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Order History */}
      <div className={`glass-card ${styles.section}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Order History</h2>
          <Link href="/gigs" className="btn btn-primary btn-sm" id="browse-gigs-btn">Browse Gigs</Link>
        </div>

        {orders.length === 0 ? (
          <p className={styles.empty}>No orders yet. <Link href="/gigs" style={{ color: 'var(--brand-400)' }}>Browse gigs to get started</Link></p>
        ) : (
          <div className={styles.orderList}>
            {orders.map(o => (
              <div key={o.order_id} className={styles.orderCard}>
                <div className={styles.orderCardHeader}>
                  <p className={styles.orderGig}>{o.gig_title}</p>
                  <StatusBadge status={o.status} />
                </div>
                <div className={styles.orderCardMeta}>
                  <span>Freelancer: <strong>{o.freelancer_name}</strong></span>
                  <span>Amount: <strong>${parseFloat(o.amount).toFixed(2)}</strong></span>
                  <span>Date: {new Date(o.order_date).toLocaleDateString()}</span>
                  {o.payment_status && (
                    <span>Payment: <span className={`badge badge-${o.payment_status}`}>{o.payment_status}</span></span>
                  )}
                </div>

                <div className={styles.orderCardActions}>
                  {/* Mark complete */}
                  {o.status === 'in_progress' && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleComplete(o.order_id)}
                      disabled={completing === o.order_id}
                      id={`complete-order-${o.order_id}`}
                    >
                      {completing === o.order_id ? 'Completing…' : 'Mark Complete'}
                    </button>
                  )}

                  {/* Leave review */}
                  {o.status === 'completed' && !o.review_id && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setReviewOrder(reviewOrder === o.order_id ? null : o.order_id)}
                      id={`review-btn-${o.order_id}`}
                    >
                      {reviewOrder === o.order_id ? 'Cancel' : '⭐ Leave Review'}
                    </button>
                  )}

                  {/* Already reviewed */}
                  {o.review_id && (
                    <span className={styles.reviewed}>
                      ✅ Reviewed — {o.rating}★
                    </span>
                  )}
                </div>

                {/* Inline review form */}
                {reviewOrder === o.order_id && (
                  <ReviewForm
                    orderId={o.order_id}
                    onSubmitted={() => { setReviewOrder(null); onRefresh(); }}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────
   PAGE COMPONENT
──────────────────────────── */
export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await getDashboard();
      setData(res.data);
    } catch (err) {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
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
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 120 }} />)}
      </div>
    );
  }

  if (error) return <div className="container" style={{ paddingTop: '3rem' }}><div className="alert alert-error">{error}</div></div>;
  if (!data) return null;

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.pageHeader}>
          <div>
            <h1 className="section-title">Dashboard</h1>
            <p className={styles.welcome}>Welcome back, <strong>{user?.name}</strong></p>
          </div>
          <span className={`badge badge-${user.role === 'freelancer' ? 'in_progress' : 'completed'}`} style={{ fontSize: '0.85rem', padding: '0.35rem 1rem' }}>
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
