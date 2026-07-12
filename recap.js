// Reads recap.json (regenerated daily by the scheduled GitHub Action) and
// renders the auto-written market summary as an editorial-style card.
async function loadRecap() {
  const container = document.getElementById("recapCard");
  if (!container) return;
  try {
    const response = await fetch("/recap.json", { cache: "no-store" });
    if (!response.ok) throw new Error("recap.json not found yet");
    const recap = await response.json();

    container.innerHTML = `
      <div class="recap-image">${recap.sparklineSvg}</div>
      <div class="recap-body">
        <h2 class="recap-headline">${recap.headline}</h2>
        <div class="recap-byline">${recap.date} &middot; auto-generated from live prices</div>
        <p class="recap-text">${recap.body}</p>
      </div>
    `;
  } catch (err) {
    console.error("Recap failed to load:", err);
    container.style.display = "none";
  }
}
loadRecap();
