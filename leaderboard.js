// leaderboard.js
async function fetchLeaderboard() {
  const res = await fetch('/api/leaderboard');
  if (!res.ok) return [];
  const data = await res.json();
  return data.leaderboard || [];
}

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

document.addEventListener('DOMContentLoaded', async function() {
  const tableBody = document.getElementById('leaderboard-table').querySelector('tbody');
  const homeBtn = document.getElementById('home-btn');
  const clearBtn = document.getElementById('clear-btn');
  const exportBtn = document.getElementById('export-btn');
  const topicFilter = document.getElementById('topic-filter');

  let leaderboard = await fetchLeaderboard();
  // Populate topic filter options
  const topics = Array.from(new Set(leaderboard.map(e => e.topic).filter(t => t)));
  topics.forEach(topic => {
    const opt = document.createElement('option');
    opt.value = topic;
    opt.textContent = topic;
    topicFilter.appendChild(opt);
  });

  function renderRows(filterTopic = '') {
    const data = filterTopic ? leaderboard.filter(e => e.topic === filterTopic) : leaderboard;
    if (!data.length) {
      tableBody.innerHTML = '<tr><td colspan="5">No scores found.</td></tr>';
      return;
    }
    tableBody.innerHTML = data.map((entry, idx) => {
      let cls = '';
      if (idx === 0) cls = 'top-score';
      else if (idx === 1) cls = 'second-score';
      else if (idx === 2) cls = 'third-score';
      return `
        <tr class="${cls}">
          <td>${idx + 1}</td>
          <td class="leaderboard-username">${entry.username}</td>
          <td class="leaderboard-score">${entry.score}</td>
          <td class="leaderboard-topic">${entry.topic || '-'}</td>
          <td class="leaderboard-timestamp">${formatDate(entry.timestamp)}</td>
        </tr>
      `;
    }).join('');
  }

  // Initial render
  renderRows();

  // Filter by topic
  topicFilter.addEventListener('change', () => renderRows(topicFilter.value));

  // Play Quiz button
  homeBtn.addEventListener('click', () => { window.location.href = 'quiz_game.html'; });

  // Clear leaderboard button
  clearBtn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to clear the leaderboard?')) return;
    const res = await fetch('/api/leaderboard/clear', { method: 'POST' });
    if (res.ok) {
      leaderboard = [];
      renderRows();
      topicFilter.value = '';
      // Remove extra options
      Array.from(topicFilter.options).slice(1).forEach(opt => opt.remove());
    } else {
      alert('Failed to clear leaderboard.');
    }
  });

  // Export CSV button handler
  exportBtn.addEventListener('click', () => {
    const filterVal = topicFilter.value;
    const dataToExport = filterVal ? leaderboard.filter(e => e.topic === filterVal) : leaderboard;
    if (!dataToExport.length) { alert('No data to export'); return; }
    let csv = 'Rank,User,Score,Topic,Date\n';
    dataToExport.forEach((e, idx) => {
      const dateStr = formatDate(e.timestamp);
      csv += `${idx+1},"${e.username}",${e.score},"${e.topic}",${dateStr}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'leaderboard.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
});
