/**
 * authService.js — Authentication API calls.
 * All endpoints hit the Express backend (VITE_API_URL).
 */

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = data.message || data.error || data.detail || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  return data;
}

export async function signupUser({ name, email, password }) {
  const data = await request('POST', '/auth/signup', { name, email, password });
  // Backend returns { success, data: { token, user } }
  return data.data || data;
}

export async function signinUser({ email, password }) {
  const data = await request('POST', '/auth/signin', { email, password });
  // Backend returns { success, data: { token, user } }
  return data.data || data;
}

export async function getCurrentUser(token) {
  const data = await request('GET', '/auth/me', undefined, token);
  return data.data?.user || data.user || data;
}

export async function signoutUser(token) {
  try {
    await request('POST', '/auth/signout', undefined, token);
  } catch (err) {
    // Signout failure is non-fatal — clear local state regardless
    console.warn('Signout request failed silently:', err.message);
  }
}
