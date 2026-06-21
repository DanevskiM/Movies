const SUPABASE_URL = 'https://cklbtjjnibkyhvpndmxu.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrbGJ0ampuaWJreWh2cG5kbXh1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIwNjU2NTgsImV4cCI6MjA5NzY0MTY1OH0.D74n0JzOvPmZvvrkvm-eMaFBgYGkueyT2gounUvcJ1M';

const API = `${SUPABASE_URL}/rest/v1/movies`;
const HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
};

let activeTab = 'watched';
let db = { watched: [], towatch: [] };

/* ── Supabase helpers ── */

async function fetchMovies() {
  const res = await fetch(`${API}?order=created_at.asc`, { headers: HEADERS });
  if (!res.ok) throw new Error('Failed to load');
  const rows = await res.json();
  db.watched = rows.filter(m => m.list === 'watched');
  db.towatch = rows.filter(m => m.list === 'towatch');
}

async function insertMovie(movie) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { ...HEADERS, 'Prefer': 'return=representation' },
    body: JSON.stringify(movie),
  });
  if (!res.ok) throw new Error('Failed to save');
  const [row] = await res.json();
  return row;
}

async function deleteMovie(id) {
  const res = await fetch(`${API}?id=eq.${id}`, {
    method: 'DELETE',
    headers: HEADERS,
  });
  if (!res.ok) throw new Error('Failed to delete');
}

/* ── UI Helpers ── */

function setStatus(msg, isError = false) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.className = 'status' + (isError ? ' error' : '');
  if (msg && !isError) {
    setTimeout(() => { if (el.textContent === msg) el.textContent = ''; }, 2000);
  }
}

function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ── Tab Switching ── */

function switchTab(tab) {
  activeTab = tab;
  document.getElementById('tab-watched').classList.toggle('active', tab === 'watched');
  document.getElementById('tab-towatch').classList.toggle('active', tab === 'towatch');
  document.getElementById('list-watched').classList.toggle('hidden', tab !== 'watched');
  document.getElementById('list-towatch').classList.toggle('hidden', tab !== 'towatch');
  document.getElementById('add-label').textContent = tab === 'watched' ? 'Watched' : 'To Watch';
}

/* ── Add Movie ── */

async function addMovie() {
  const title = document.getElementById('inp-title').value.trim();
  const genre = document.getElementById('inp-genre').value;
  const actor = document.getElementById('inp-actor').value.trim();
  const year  = document.getElementById('inp-year').value.trim();

  if (!title) { document.getElementById('inp-title').focus(); return; }

  const btn = document.getElementById('add-btn');
  btn.disabled = true;
  setStatus('Saving…');

  try {
    const row = await insertMovie({ title, genre, actor, year: year || null, list: activeTab });
    db[activeTab].push(row);
    render();
    setStatus('Saved');
    document.getElementById('inp-title').value = '';
    document.getElementById('inp-genre').value = '';
    document.getElementById('inp-actor').value = '';
    document.getElementById('inp-year').value  = '';
    document.getElementById('inp-title').focus();
  } catch (e) {
    setStatus('Could not save', true);
  }

  btn.disabled = false;
}

/* ── Remove Movie ── */

async function removeMovie(tab, id) {
  try {
    await deleteMovie(id);
    db[tab] = db[tab].filter(m => m.id !== id);
    render();
    setStatus('Removed');
  } catch (e) {
    setStatus('Could not delete', true);
  }
}

/* ── Render ── */

function render() {
  ['watched', 'towatch'].forEach(tab => {
    const list   = document.getElementById('list-' + tab);
    const movies = db[tab];

    document.getElementById('count-' + tab).textContent = movies.length || '';

    if (!movies.length) {
      list.innerHTML = `<div class="empty">${
        tab === 'watched' ? 'No watched movies yet.' : 'Your watchlist is empty.'
      }</div>`;
      return;
    }

    list.innerHTML = movies.map((m, i) => `
      <div class="movie-card">
        <span class="movie-rank">${i + 1}</span>
        <div class="movie-info">
          <div class="movie-title">${esc(m.title)}</div>
          ${m.actor ? `<div class="movie-actor">🎭 ${esc(m.actor)}</div>` : ''}
          <div class="movie-badges">
            ${m.genre ? `<span class="badge badge-genre">${esc(m.genre)}</span>` : ''}
            ${m.year  ? `<span class="badge badge-year">${esc(m.year)}</span>`  : ''}
          </div>
        </div>
        <button class="del-btn" onclick="removeMovie('${tab}', ${m.id})" aria-label="Remove ${esc(m.title)}">✕</button>
      </div>
    `).join('');
  });
}

/* ── Init ── */

document.getElementById('inp-title').addEventListener('keydown', e => {
  if (e.key === 'Enter') addMovie();
});

async function init() {
  setStatus('Loading…');
  try {
    await fetchMovies();
    setStatus('');
  } catch (e) {
    setStatus('Could not connect to database', true);
  }
  render();
}

init();
