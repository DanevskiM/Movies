const DB_KEY = 'movie-tracker-db';
let activeTab = 'watched';
let db = { watched: [], towatch: [] };

/* ── Storage ── */

function loadDB() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      db.watched = parsed.watched || [];
      db.towatch = parsed.towatch || [];
    }
  } catch (e) {
    db = { watched: [], towatch: [] };
  }
  render();
}

function saveDB() {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    setStatus('Saved');
  } catch (e) {
    setStatus('Could not save', true);
  }
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

function addMovie() {
  const title = document.getElementById('inp-title').value.trim();
  const genre = document.getElementById('inp-genre').value;
  const actor = document.getElementById('inp-actor').value.trim();
  const year  = document.getElementById('inp-year').value.trim();

  if (!title) {
    document.getElementById('inp-title').focus();
    return;
  }

  const btn = document.getElementById('add-btn');
  btn.disabled = true;

  db[activeTab].push({ id: Date.now(), title, genre, actor, year });
  saveDB();
  render();

  document.getElementById('inp-title').value = '';
  document.getElementById('inp-genre').value = '';
  document.getElementById('inp-actor').value = '';
  document.getElementById('inp-year').value  = '';
  document.getElementById('inp-title').focus();

  btn.disabled = false;
}

/* ── Remove Movie ── */

function removeMovie(tab, id) {
  db[tab] = db[tab].filter(m => m.id !== id);
  saveDB();
  render();
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

loadDB();
