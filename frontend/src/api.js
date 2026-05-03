const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

export const api = {
  newGame: (rows, cols) => request('/new-game', 'POST', { rows, cols }),
  move: (session_id, row, col) => request('/move', 'POST', { session_id, row, col }),
  autoMove: (session_id) => request('/auto-move', 'POST', { session_id }),
  infer: (session_id) => request('/infer', 'POST', { session_id }),
  getState: (session_id) => request(`/state/${session_id}`),
};
