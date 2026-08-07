'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import GigCard from '@/components/GigCard';
import { getGigs, getCategories } from '@/lib/api';
import styles from './gigs.module.css';

const SORT_OPTIONS = [
  { value: 'newest',    label: '🕐 Newest' },
  { value: 'price_asc', label: '💰 Price: Low → High' },
  { value: 'price_desc',label: '💎 Price: High → Low' },
  { value: 'top_rated', label: '⭐ Top Rated' },
];

const CAT_ICONS = {
  'Web Development':'💻','Graphic Design':'🎨','Digital Marketing':'📣',
  'Writing & Translation':'✍️','Video & Animation':'🎬','Data Science':'📊',
};

export default function GigsPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [gigs,       setGigs]       = useState([]);
  const [categories, setCategories] = useState([]);
  const [total,      setTotal]      = useState(0);
  const [pages,      setPages]      = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [viewMode,   setViewMode]   = useState('grid'); // 'grid' | 'list'
  const [sort,       setSort]       = useState('newest');

  const search   = searchParams.get('search')   || '';
  const category = searchParams.get('category') || '';
  const page     = parseInt(searchParams.get('page') || '1');

  const [searchInput, setSearchInput] = useState(search);

  const fetchGigs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 12, sort };
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
  }, [search, category, page, sort]);

  useEffect(() => {
    getCategories().then(r => setCategories(r.data || [])).catch(console.error);
  }, []);

  useEffect(() => { fetchGigs(); }, [fetchGigs]);

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

  const activeCategoryName = categories.find(c => String(c.category_id) === category)?.category_name;

  return (
    <div className={styles.page}>
      <div className="container">

        {/* Page header */}
        <div className={`${styles.header} animate-fade-in-up`}>
          <div>
            <h1 className="section-title display-font">Browse Gigs</h1>
            <p className={styles.headerSub}>
              {loading ? 'Loading…' : total > 0 ? `${total} services available` : 'No services found'}
            </p>
          </div>
        </div>

        {/* Search + filters row */}
        <div className={`${styles.filtersRow} animate-fade-in-up stagger-2`}>
          <form onSubmit={handleSearch} className={styles.searchBar} id="gigs-search-form">
            <span className={styles.searchIcon}>🔍</span>
            <input
              id="gigs-search-input"
              type="text"
              className={styles.searchInput}
              placeholder="Search gigs by keyword…"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button type="button" className={styles.clearBtn} onClick={() => { setSearchInput(''); updateParams({ search: '' }); }}>
                ×
              </button>
            )}
            <button type="submit" className={`btn btn-primary btn-sm ${styles.searchBtn}`} id="gigs-search-btn">
              Search
            </button>
          </form>

          {/* Sort + View toggle */}
          <div className={styles.controls}>
            <select
              className={`form-select ${styles.sortSelect}`}
              value={sort}
              onChange={e => setSort(e.target.value)}
              id="gigs-sort-select"
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <div className={styles.viewToggle}>
              <button
                className={`${styles.viewBtn} ${viewMode === 'grid' ? styles.viewBtnActive : ''}`}
                onClick={() => setViewMode('grid')}
                id="view-grid-btn"
                title="Grid view"
              >⊞</button>
              <button
                className={`${styles.viewBtn} ${viewMode === 'list' ? styles.viewBtnActive : ''}`}
                onClick={() => setViewMode('list')}
                id="view-list-btn"
                title="List view"
              >☰</button>
            </div>
          </div>
        </div>

        {/* Category pills */}
        <div className={`${styles.categoryPills} animate-fade-in-up stagger-3`}>
          <button
            className={`${styles.pill} ${!category ? styles.pillActive : ''}`}
            onClick={() => updateParams({ category: '', search: searchInput })}
            id="filter-all"
          >
            🌐 All
          </button>
          {categories.map(c => (
            <button
              key={c.category_id}
              className={`${styles.pill} ${category === String(c.category_id) ? styles.pillActive : ''}`}
              onClick={() => updateParams({ category: c.category_id, search: searchInput })}
              id={`filter-cat-${c.category_id}`}
            >
              {CAT_ICONS[c.category_name] || '🔷'} {c.category_name}
            </button>
          ))}
        </div>

        {/* Active filter chips */}
        {(search || activeCategoryName) && (
          <div className={styles.activeFilters}>
            <span className={styles.filterLabel}>Active filters:</span>
            {search && (
              <button className={styles.filterChip} onClick={() => { setSearchInput(''); updateParams({ search: '' }); }}>
                🔍 "{search}" ×
              </button>
            )}
            {activeCategoryName && (
              <button className={styles.filterChip} onClick={() => updateParams({ category: '' })}>
                {CAT_ICONS[activeCategoryName] || '🔷'} {activeCategoryName} ×
              </button>
            )}
            <button className={styles.clearAll} onClick={() => { setSearchInput(''); router.push('/gigs'); }}>
              Clear all
            </button>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <div className={viewMode === 'grid' ? 'grid-auto' : styles.listView}>
            {[...Array(12)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: viewMode === 'grid' ? 300 : 100 }} />
            ))}
          </div>
        ) : gigs.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🔍</div>
            <h3 className={styles.emptyTitle}>No gigs found</h3>
            <p className={styles.emptyText}>Try adjusting your search or removing filters</p>
            <button className="btn btn-primary" onClick={() => { setSearchInput(''); router.push('/gigs'); }}>
              Browse All Gigs
            </button>
          </div>
        ) : (
          <>
            <p className={styles.resultCount}>{total} result{total !== 1 ? 's' : ''}</p>
            <div className={viewMode === 'grid' ? 'grid-auto' : styles.listView}>
              {gigs.map(g => <GigCard key={g.gig_id} gig={g} listMode={viewMode === 'list'} />)}
            </div>
          </>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className={styles.pagination}>
            <button
              className={`${styles.pageBtn} ${page === 1 ? styles.pageBtnDisabled : ''}`}
              disabled={page === 1}
              onClick={() => { const p = new URLSearchParams(searchParams.toString()); p.set('page', page-1); router.push(`/gigs?${p}`); }}
            >← Prev</button>
            {[...Array(pages)].map((_, i) => (
              <button
                key={i}
                className={`${styles.pageBtn} ${page === i+1 ? styles.pageBtnActive : ''}`}
                onClick={() => { const p = new URLSearchParams(searchParams.toString()); p.set('page', i+1); router.push(`/gigs?${p}`); }}
              >
                {i + 1}
              </button>
            ))}
            <button
              className={`${styles.pageBtn} ${page === pages ? styles.pageBtnDisabled : ''}`}
              disabled={page === pages}
              onClick={() => { const p = new URLSearchParams(searchParams.toString()); p.set('page', page+1); router.push(`/gigs?${p}`); }}
            >Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
