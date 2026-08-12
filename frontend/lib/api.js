// api.js — uses native fetch (no axios dependency needed)
// Works in Next.js App Router server & client components

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('nexusbase_token');
}

async function request(method, path, body = null, params = null) {
  let url = `${API_BASE}${path}`;

  if (params) {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
    ).toString();
    if (qs) url += `?${qs}`;
  }

  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const res = await fetch(url, options);

  // Auto-redirect on 401
  if (res.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('nexusbase_token');
    localStorage.removeItem('nexusbase_user');
    window.location.href = '/auth/login';
    return;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(data?.error || `HTTP ${res.status}`);
    err.response = { data, status: res.status };
    throw err;
  }

  // Mimic axios response shape: { data }
  return { data };
}

// ---------- Auth ----------
export const signup = (body)          => request('POST', '/auth/signup', body);
export const login  = (body)          => request('POST', '/auth/login',  body);

// ---------- Users ----------
export const getMe             = ()       => request('GET',  '/users/me');
export const updateMe          = (body)   => request('PUT',  '/users/me', body);
export const updateSkills      = (skills) => request('PUT',  '/users/me/skills', { skills });
export const getTopFreelancers = ()       => request('GET',  '/users/top/freelancers');
export const getUserProfile    = (id)     => request('GET',  `/users/${id}`);

// ---------- Gigs ----------
export const getGigs   = (params) => request('GET',    '/gigs', null, params);
export const getGig    = (id)     => request('GET',    `/gigs/${id}`);
export const createGig = (body)   => request('POST',   '/gigs', body);
export const updateGig = (id, b)  => request('PUT',    `/gigs/${id}`, b);
export const deleteGig = (id)     => request('DELETE', `/gigs/${id}`);
export const getMyGigs = ()       => request('GET',    '/gigs/freelancer/my');

// ---------- Categories ----------
export const getCategories = () => request('GET', '/categories');

// ---------- Skills ----------
export const getSkills = (q) => request('GET', '/skills', null, q ? { q } : null);


// ---------- Orders ----------
export const placeOrder        = (body)          => request('POST',  '/orders', body);
export const getOrders         = ()              => request('GET',   '/orders');
export const getOrder          = (id)            => request('GET',   `/orders/${id}`);
export const updateOrderStatus = (id, status)    => request('PATCH', `/orders/${id}/status`, { status });

// ---------- Reviews ----------
export const submitReview  = (order_id, body) => request('POST', `/reviews/${order_id}`, body);
export const getGigReviews = (gig_id)         => request('GET',  `/reviews/gig/${gig_id}`);

// ---------- Dashboard ----------
export const getDashboard = () => request('GET', '/dashboard');

// ---------- Trust ----------
export const getTrustTiers  = ()     => request('GET', '/trust/tiers');
export const getMyTrust     = ()     => request('GET', '/trust/me');

// ---------- Assessments ----------
export const getAssessmentQuestions = (skill_id) =>
  request('GET', `/assessments/${skill_id}/questions`);
export const submitAssessment = (skill_id, answers) =>
  request('POST', `/assessments/${skill_id}`, { answers });
export const getMyAssessments = () => request('GET', '/assessments/me');

// ---------- Disputes ----------
export const raiseDispute   = (order_id, reason) =>
  request('POST', `/orders/${order_id}/dispute`, { reason });
export const resolveDispute = (dispute_id, status) =>
  request('PATCH', `/orders/disputes/${dispute_id}`, { status });
