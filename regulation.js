// regulation.js
// Renders headline-card entries into #regulationRow, using the
// regulation-filtered feed produced by scripts/fetch-headlines.js.

async function loadRegulationFeed() {
  const container = document.getElementById('regulationRow');
  if (!container) return;

  try {
    const res = await fetch('/regulation.json');
    const items = await res.json();

    if (!items || items.length === 0) {
      container.innerHTML = '<div class="disclaimer">No regulation headlines right now — check back soon.</div>';
      return;
    }

    container.innerHTML = items.map(renderRegulationCard).join('');
  } catch (err) {
    console.error('regulation feed failed to load', err);
    container.innerHTML = '';
  }
}

function renderRegulationCard(item) {
  return `
    <a class="headline-card" href="${item.url}" target="_blank" rel="noopener">
      <div class="headline-body">
        <div class="title">${item.title}</div>
      </div>
      <div class="source">${item.source}</div>
    </a>
  `;
}

document.addEventListener('DOMContentLoaded', loadRegulationFeed);
