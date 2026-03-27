// =============================================
// CONFIG — point this to your backend
// =============================================
const API_BASE = 'http://localhost:3000/api';
// =============================================
// THEME TOGGLE
// =============================================
function initTheme() {
  // Check if user has a saved preference in localStorage
  const savedTheme = localStorage.getItem('theme');
  
  // If no preference saved, check system preference
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = savedTheme || (prefersDark ? 'dark' : 'light');
  
  // Apply theme to document
  document.documentElement.setAttribute('data-theme', theme);
  
  // Update button icon
  updateThemeIcon(theme);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('theme-toggle');
  if (btn) {
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }
}

function toggleTheme() {
  const html = document.documentElement;
  const currentTheme = html.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  
  // Apply new theme
  html.setAttribute('data-theme', newTheme);
  
  // Save preference to localStorage
  localStorage.setItem('theme', newTheme);
  
  // Update button icon
  updateThemeIcon(newTheme);
}

// Initialize theme on page load
initTheme();

// Add event listener to theme toggle button
document.addEventListener('DOMContentLoaded', () => {
  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', toggleTheme);
  }
});

// =============================================
// TAB SWITCHING
// =============================================
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;

    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(s => {
      s.classList.add('hidden');
      s.classList.remove('active');
    });

    btn.classList.add('active');
    const section = document.getElementById('tab-' + target);
    section.classList.remove('hidden');
    section.classList.add('active');

    if (target === 'keywords') loadKeywords();
    if (target === 'history') loadHistory();
  });
});

// =============================================
// CHECKER
// =============================================
async function checkNews() {
  const text = document.getElementById('news-input').value.trim();
  if (!text) { alert('Please paste some news text first.'); return; }

  const btn = document.getElementById('check-btn');
  const btnText = document.getElementById('btn-text');
  const spinner = document.getElementById('btn-spinner');
  const resultCard = document.getElementById('result-card');

  btn.disabled = true;
  btnText.textContent = 'Analysing…';
  spinner.classList.remove('hidden');
  resultCard.classList.add('hidden');

  try {
    const res = await fetch(`${API_BASE}/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ news_text: text })
    });

    if (!res.ok) throw new Error('Server error');
    const data = await res.json();
    displayResult(data);

  } catch (err) {
    alert('Error: ' + err.message + '\n\nMake sure your backend server is running on port 3000.');
  } finally {
    btn.disabled = false;
    btnText.textContent = 'Analyse News';
    spinner.classList.add('hidden');
  }
}

function displayResult(data) {
  const resultCard = document.getElementById('result-card');
  const score = data.credibility_score;

  // Score circle
  document.getElementById('score-number').textContent = score;
  const circle = document.getElementById('score-circle');
  if (score >= 70) circle.style.borderColor = 'var(--accent)';
  else if (score >= 40) circle.style.borderColor = 'var(--warn)';
  else circle.style.borderColor = 'var(--danger)';

  // Verdict badge
  const badge = document.getElementById('verdict-badge');
  const resultKey = data.result.replace(/\s+/g, '-').toUpperCase();
  badge.textContent = data.result;
  badge.className = 'verdict-badge ' + resultKey;

  // Explanation
  document.getElementById('explanation-text').textContent = data.explanation;

  // Red flags
  const flagsList = document.getElementById('red-flags-list');
  flagsList.innerHTML = '';
  if (data.red_flags && data.red_flags.length > 0) {
    data.red_flags.forEach(flag => {
      const li = document.createElement('li');
      li.textContent = flag;
      flagsList.appendChild(li);
    });
  } else {
    flagsList.innerHTML = '<li>No red flags detected</li>';
  }

  // Matched keywords
  const kwList = document.getElementById('keywords-list');
  kwList.innerHTML = '';
  if (data.matched_keywords && data.matched_keywords.length > 0) {
    data.matched_keywords.forEach(kw => {
      const li = document.createElement('li');
      li.textContent = kw.keyword;
      li.className = kw.severity;
      kwList.appendChild(li);
    });
  } else {
    kwList.innerHTML = '<li>No flagged keywords matched</li>';
  }

  // Suggestion
  document.getElementById('suggestion-text').textContent = data.suggestion;

  resultCard.classList.remove('hidden');
  resultCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// =============================================
// KEYWORDS CRUD
// =============================================
async function loadKeywords() {
  const tbody = document.getElementById('keywords-tbody');
  tbody.innerHTML = '<tr><td colspan="4" class="loading-row">Loading…</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/keywords`);
    const data = await res.json();

    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="4" class="loading-row">No keywords yet. Add one above!</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(kw => `
      <tr>
        <td>${escapeHtml(kw.keyword)}</td>
        <td>${escapeHtml(kw.category)}</td>
        <td><span class="badge ${kw.severity}">${kw.severity}</span></td>
        <td><button class="del-btn" onclick="deleteKeyword(${kw.id})">Delete</button></td>
      </tr>
    `).join('');

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="loading-row">Error loading keywords. Is the server running?</td></tr>`;
  }
}

async function addKeyword() {
  const keyword = document.getElementById('kw-input').value.trim();
  const category = document.getElementById('kw-category').value;
  const severity = document.getElementById('kw-severity').value;

  if (!keyword) { alert('Please enter a keyword.'); return; }

  try {
    const res = await fetch(`${API_BASE}/keywords`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword, category, severity })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add');
    }
    document.getElementById('kw-input').value = '';
    loadKeywords();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

async function deleteKeyword(id) {
  if (!confirm('Delete this keyword?')) return;
  try {
    await fetch(`${API_BASE}/keywords/${id}`, { method: 'DELETE' });
    loadKeywords();
  } catch (err) {
    alert('Error deleting keyword.');
  }
}

// =============================================
// HISTORY
// =============================================
async function loadHistory() {
  const tbody = document.getElementById('history-tbody');
  tbody.innerHTML = '<tr><td colspan="5" class="loading-row">Loading…</td></tr>';

  try {
    const res = await fetch(`${API_BASE}/history`);
    const data = await res.json();

    if (!data.length) {
      tbody.innerHTML = '<tr><td colspan="5" class="loading-row">No searches yet. Check some news!</td></tr>';
      return;
    }

    tbody.innerHTML = data.map(h => {
      const resultKey = h.result.replace(' ', '-');
      const date = new Date(h.checked_at).toLocaleString('en-IN');
      return `
        <tr>
          <td class="news-cell" title="${escapeHtml(h.news_text)}">${escapeHtml(h.news_text)}</td>
          <td>${h.credibility_score}/100</td>
          <td><span class="badge ${resultKey}">${h.result}</span></td>
          <td style="color:var(--muted);font-size:0.82rem">${date}</td>
          <td><button class="del-btn" onclick="deleteHistory(${h.id})">Delete</button></td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="loading-row">Error loading history. Is the server running?</td></tr>`;
  }
}

async function deleteHistory(id) {
  if (!confirm('Delete this record?')) return;
  try {
    await fetch(`${API_BASE}/history/${id}`, { method: 'DELETE' });
    loadHistory();
  } catch (err) {
    alert('Error deleting record.');
  }
}

// =============================================
// UTILITY
// =============================================
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}