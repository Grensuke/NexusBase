// Auth helpers — thin wrappers around localStorage
// All UI state comes from React context; these helpers are for
// persistence across page refreshes.

export const saveAuth = (token, user) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('nexusbase_token', token);
  localStorage.setItem('nexusbase_user',  JSON.stringify(user));
};

export const clearAuth = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('nexusbase_token');
  localStorage.removeItem('nexusbase_user');
};

export const getStoredToken = () =>
  typeof window !== 'undefined' ? localStorage.getItem('nexusbase_token') : null;

export const getStoredUser = () => {
  if (typeof window === 'undefined') return null;
  try {
    const s = localStorage.getItem('nexusbase_user');
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
};
