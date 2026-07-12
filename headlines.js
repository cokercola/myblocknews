// Reads the headlines.json file (kept up to date by the scheduled GitHub Action)
// and renders it into the headline card list. No API key here — this script
// never talks to CryptoPanic directly, only to the site's own static file.
async function loadHeadlines() {
  const container = document.getElementById("headlinesRow");
  try {
    const response = await fetch("/headlines.json", { cache: "no-store" });
    if (!response.ok) throw new Error("headlines.json not found yet");
    const headlines = await response.json();
    if (!headlines.length) {
      container.innerHTML = `<div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--text-dim);">No headlines yet — check back soon.</div>`;
      return;
    }
    container.innerHTML = "";
    headlines.forEach((item) => {
      const a = document.createElement("a");
      a.className = "headline-card";
      a.href = item.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";

      // item.image is optional — older cached headlines or feeds without an
      // image simply won't have this field yet, so we skip the <img> entirely
      // rather than showing a broken image icon.
      const imageHtml = item.image
        ? `<img class="headline-image" src="${item.image}" alt="" loading="lazy" onerror="this.remove()">`
        : "";

      a.innerHTML = `
        ${imageHtml}
        <div class="headline-body">
          <div class="title">${item.title}</div>
          <div class="source">${item.source}</div>
        </div>
      `;
      container.appendChild(a);
    });
  } catch (err) {
    console.error("Headlines failed to load:", err);
    container.innerHTML = `<div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--text-dim);">Headlines are temporarily unavailable.</div>`;
  }
}
loadHeadlines();
