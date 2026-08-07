'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getGig, updateGig, getCategories } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import styles from '../../new/gigform.module.css';

export default function EditGigPage() {
  const { id }   = useParams();
  const { user } = useAuth();
  const router   = useRouter();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(null);
  const [error,  setError]  = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user && user.role !== 'freelancer') router.replace('/');
  }, [user, router]);

  useEffect(() => {
    Promise.all([getGig(id), getCategories()]).then(([gigRes, catRes]) => {
      const g = gigRes.data;
      setForm({
        title:         g.title,
        description:   g.description,
        category_id:   String(g.category_id),
        price:         String(g.price),
        delivery_days: String(g.delivery_days),
      });
      setCategories(catRes.data || []);
    }).catch(() => router.push('/dashboard'));
  }, [id, router]);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      await updateGig(id, {
        category_id:   parseInt(form.category_id),
        title:         form.title.trim(),
        description:   form.description.trim(),
        price:         parseFloat(form.price),
        delivery_days: parseInt(form.delivery_days),
      });
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update gig');
    } finally {
      setSaving(false);
    }
  };

  if (!form) return <div className="container" style={{ paddingTop: '3rem' }}><div className="skeleton" style={{ height: 400 }} /></div>;

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.formCard}>
          <div className={styles.header}>
            <h1 className={styles.title}>Edit Gig</h1>
            <p className={styles.subtitle}>Update your gig details below</p>
          </div>

          <form onSubmit={handleSubmit} className={styles.form} id="edit-gig-form">
            <div className="form-group">
              <label className="form-label" htmlFor="edit-gig-title">Gig Title</label>
              <input id="edit-gig-title" name="title" type="text" className="form-input"
                value={form.title} onChange={handleChange} required maxLength={200} />
            </div>

            <div className={styles.row}>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-gig-category">Category</label>
                <select id="edit-gig-category" name="category_id" className="form-select"
                  value={form.category_id} onChange={handleChange} required>
                  <option value="">Select category</option>
                  {categories.map(c => (
                    <option key={c.category_id} value={c.category_id}>{c.category_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-gig-price">Price (USD)</label>
                <input id="edit-gig-price" name="price" type="number" className="form-input"
                  value={form.price} onChange={handleChange} required min="1" step="0.01" />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-gig-delivery">Delivery (days)</label>
                <input id="edit-gig-delivery" name="delivery_days" type="number" className="form-input"
                  value={form.delivery_days} onChange={handleChange} required min="1" />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="edit-gig-description">Description</label>
              <textarea id="edit-gig-description" name="description" className="form-textarea"
                value={form.description} onChange={handleChange} required rows={6} />
            </div>

            {error && <div className="alert alert-error">{error}</div>}

            <div className={styles.actions}>
              <button type="button" className="btn btn-secondary" onClick={() => router.back()}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving} id="save-gig-btn">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
