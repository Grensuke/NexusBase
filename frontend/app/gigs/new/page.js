'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCategories, createGig } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import styles from './gigform.module.css';

export default function NewGigPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', category_id: '',
    price: '', delivery_days: '',
  });
  const [error,   setError]   = useState('');
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'freelancer')) {
      router.replace('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    getCategories().then(r => setCategories(r.data || [])).catch(console.error);
  }, []);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await createGig({
        category_id:   parseInt(form.category_id),
        title:         form.title.trim(),
        description:   form.description.trim(),
        price:         parseFloat(form.price),
        delivery_days: parseInt(form.delivery_days),
      });
      router.push('/dashboard');
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

          <form onSubmit={handleSubmit} className={styles.form} id="new-gig-form">
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

            <div className={styles.row}>
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
                  <option value="">Select category</option>
                  {categories.map(c => (
                    <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="gig-price">Price (USD)</label>
                <input
                  id="gig-price"
                  name="price"
                  type="number"
                  className="form-input"
                  placeholder="50.00"
                  value={form.price}
                  onChange={handleChange}
                  required
                  min="1"
                  step="0.01"
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
