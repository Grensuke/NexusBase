'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCategories, createGig, getMyTrust } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import styles from './gigform.module.css';

export default function NewGigPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [trust,      setTrust]      = useState(null);
  const [form, setForm] = useState({
    title: '', description: '', category_id: '',
    price: '', delivery_days: '',
  });
  const [error,  setError]  = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'freelancer')) {
      router.replace('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    getCategories().then(r => setCategories(r.data || [])).catch(console.error);
    getMyTrust().then(r => setTrust(r.data)).catch(() => {});
  }, []);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const isTrial     = trust?.trial_orders_required > 0 && trust?.trial_price_cap;
  const priceCap    = isTrial ? parseFloat(trust.trial_price_cap) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Client-side cap validation
    if (priceCap && parseFloat(form.price) > priceCap) {
      setError(`Price cannot exceed ₹${priceCap.toFixed(0)} while in the ${trust.tier_name} trial tier.`);
      return;
    }

    setSaving(true);
    try {
      const res = await createGig({
        category_id:   parseInt(form.category_id),
        title:         form.title.trim(),
        description:   form.description.trim(),
        price:         parseFloat(form.price),
        delivery_days: parseInt(form.delivery_days),
      });
      router.push(res?.data?.is_trial ? '/dashboard?trial_created=1' : '/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create gig');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.formCard}>
          <div className={styles.header}>
            <h1 className={styles.title}>Post a New Gig</h1>
            <p className={styles.subtitle}>Fill in the details below to list your service</p>
          </div>

          {/* Trial-tier notice — full width, above the fields */}
          {isTrial && (
            <div className={styles.trialBanner}>
              <span className={styles.trialIcon}>⚡</span>
              <div>
                <strong>Trial tier active</strong> — you are in the{' '}
                <strong>{trust.tier_name}</strong> tier. Your gig price is capped at{' '}
                <strong>₹{priceCap.toFixed(0)}</strong> and will be marked as a trial gig
                automatically. Complete {trust.trial_orders_required} dispute-free trial orders to
                unlock full pricing.
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form} id="new-gig-form">

            {/* Gig Title — full width */}
            <div className="form-group">
              <label className="form-label" htmlFor="gig-title">Gig Title</label>
              <input
                id="gig-title"
                name="title"
                type="text"
                className="form-input"
                placeholder="e.g. I will build a React web application"
                value={form.title}
                onChange={handleChange}
                required
                maxLength={200}
              />
            </div>

            {/* Category — full width */}
            <div className="form-group">
              <label className="form-label" htmlFor="gig-category">Category</label>
              <select
                id="gig-category"
                name="category_id"
                className="form-select"
                value={form.category_id}
                onChange={handleChange}
                required
              >
                <option value="">Select a category</option>
                {categories.map(c => (
                  <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                ))}
              </select>
            </div>

            {/* Price + Delivery — two equal columns */}
            <div className={styles.row}>
              <div className="form-group">
                <label className="form-label" htmlFor="gig-price">
                  Price (₹)
                  {priceCap && (
                    <span className={styles.capHint}>&nbsp;· Max ₹{priceCap.toFixed(0)}</span>
                  )}
                </label>
                <input
                  id="gig-price"
                  name="price"
                  type="number"
                  className="form-input"
                  placeholder={priceCap ? `1 – ${priceCap.toFixed(0)}` : '50'}
                  value={form.price}
                  onChange={handleChange}
                  required
                  min="1"
                  max={priceCap || undefined}
                  step="1"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="gig-delivery">Delivery (days)</label>
                <input
                  id="gig-delivery"
                  name="delivery_days"
                  type="number"
                  className="form-input"
                  placeholder="7"
                  value={form.delivery_days}
                  onChange={handleChange}
                  required
                  min="1"
                  max="365"
                />
              </div>
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label" htmlFor="gig-description">Description</label>
              <textarea
                id="gig-description"
                name="description"
                className="form-textarea"
                placeholder="Describe your service in detail — what you will deliver, your process, and why clients should choose you."
                value={form.description}
                onChange={handleChange}
                required
                rows={6}
              />
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div className={styles.actions}>
              <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
                id="create-gig-btn"
              >
                {saving ? 'Publishing…' : 'Publish Gig'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
