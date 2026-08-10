'use client';

import { useState } from 'react';
import { submitReview } from '@/lib/api';
import styles from './ReviewForm.module.css';

export default function ReviewForm({ orderId, onSubmitted }) {
  const [rating,  setRating]  = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rating) return setError('Please select a rating');
    setLoading(true);
    setError('');
    try {
      await submitReview(orderId, { rating, comment });
      setSuccess(true);
      onSubmitted?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="alert alert-success animate-fade-in">
        Review submitted! Thank you for your feedback.
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} id="review-form">
      <h3 className={styles.heading}>Leave a Review</h3>

      {/* Star picker */}
      <div className={styles.stars}>
        {[1,2,3,4,5].map(n => (
          <button
            key={n}
            type="button"
            className={`${styles.star} ${n <= (hovered || rating) ? styles.active : ''}`}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(n)}
            id={`star-${n}`}
            aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
          >
            ★
          </button>
        ))}
        {rating > 0 && (
          <span className={styles.ratingLabel}>
            {['','Poor','Fair','Good','Very Good','Excellent'][rating]}
          </span>
        )}
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="review-comment">Your Review</label>
        <textarea
          id="review-comment"
          className="form-textarea"
          placeholder="Share your experience with this freelancer..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={4}
        />
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <button
        type="submit"
        className="btn btn-primary"
        disabled={loading || !rating}
        id="submit-review-btn"
      >
        {loading ? 'Submitting…' : 'Submit Review'}
      </button>
    </form>
  );
}
