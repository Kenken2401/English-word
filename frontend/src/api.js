const BASE = '/api/words';

export async function fetchWords(search = '', pos = '') {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (pos) params.set('pos', pos);
  const res = await fetch(`${BASE}?${params}`);
  if (!res.ok) throw new Error('Failed to fetch words');
  return res.json();
}

export async function fetchWord(id) {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error('Word not found');
  return res.json();
}

export async function addWord(word) {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ word }),
  });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.error || 'Failed to add word'), { status: res.status, data });
  return data;
}

export async function deleteWord(id) {
  const res = await fetch(`${BASE}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete word');
  return res.json();
}

export async function enrichWord(id) {
  const res = await fetch(`${BASE}/${id}/enrich`, { method: 'POST' });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to enrich word');
  return data;
}
