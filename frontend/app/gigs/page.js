'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import GigCard from '@/components/GigCard';
import { getGigs, getCategories } from '@/lib/api';
import styles from './gigs.module.css';

export default function GigsPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [gigs,       setGigs]       = useState([]);
  const [categories, setCategories] = useState([]);
  const [total,      setTotal]      = useState(0);
  const [pages,      setPages]      = useState(1);
  const [loading,    setLoading]    = useState(true);

  const search   = searchParams.get('search')   || '';
  const category = searchParams.get('category') || '';
  const page     = parseInt(searchParams.get('page') || '1');

  const [searchInput, setSearchInput] = useState(search);

  const fetchGigs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search)   params.search   = search;
      if (category) params.category = category;
      const res = await getGigs(params);
      setGigs(res.data.gigs || []);
      setTotal(res.data.total || 0);
      setPages(res.data.pages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, category, page]);

  useEffect(() => {
    getCategories().then(r => setCategories(r.data || [])).catch(console.error);
  }, []);

  useEffect(() => {
    fetchGigs();
  }, [fetchGigs]);

  const updateParams = (updates) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v); else params.delete(k);
    });
    params.delete('page');
    router.push(`/gigs?${params.toString()}`);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateParams({ search: searchInput });
  };

  return (
    <div className={styles.page}>
      <div className="container">
        {/* Page header */}
        <div className={styles.header}>
          <h1 className="section-title">Browse Gigs</h1>
          <p className={styles.headerSub}>
            {total > 0 ? `${total} services available` : 'Find expert freelancers'}
          </p>
        </div>

        {/* Search + Filters */}
        <div className={styles.filters}>
          <form onSubmit={handleSearch} className={styles.searchBar} id="gigs-search-form">
            <input
              id="gigs-search-input"
              type="text"
              className={styles.searchInput}
              placeholder="Search gigs by keyword…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary btn-sm" id="gigs-search-btn">
              Search
            </button>
          </form>

          <div className={styles.categoryPills}>
            <button
              className={`${styles.pill} ${!category ? styles.pillActive : ''}`}
              onClick={() => updateParams({ category: '', search: searchInput })}
              id="filter-all"
            >
              All
            </button>
            {categories.map(c => (
              <button
                key={c.category_id}
                className={`${styles.pill} ${category === String(c.category_id) ? styles.pillActive : ''}`}
                onClick={() => updateParams({ category: c.category_id, search: searchInput })}
                id={`filter-cat-${c.category_id}`}
              >
                {c.category_name}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid-auto">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 280 }} />
            ))}
          </div>
        ) : gigs.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>🔍</span>
            <h3>No gigs found</h3>
            <p>Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="grid-auto">
            {gigs.map(g => <GigCard key={g.gig_id} gig={g} />)}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className={styles.pagination}>
            {[...Array(pages)].map((_, i) => (
              <button
                key={i}
                className={`${styles.pageBtn} ${page === i+1 ? styles.pageBtnActive : ''}`}
                onClick={() => {
                  const params = new URLSearchParams(searchParams.toString());
                  params.set('page', i + 1);
                  router.push(`/gigs?${params.toString()}`);
                }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
