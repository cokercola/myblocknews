// Reads brief.json (kept up to date daily by the scheduled GitHub Action for
// date + biggest movers, and by hand for the narrative fields) and renders it
// into the Block Brief section.
async function loadBrief() {
  try {
    const response = await fetch("/brief.json", { cache: "no-store" });
    if (!response.ok) throw new Error("brief.json not found yet");
    const brief = await response.json();

    document.getElementById("briefDate").textContent = brief.date || "";
    document.getElementById("briefHeadline").textContent = brief.headline || "";
    document.getElementById("briefOvernight").textContent = brief.overnight || "";
    document.getElementById("briefMovers").textContent = brief.biggest_movers || "";
    document.getElementById("briefWhale").textContent = brief.whale_activity || "";
    document.getElementById("briefRegulation").textContent = brief.regulatory_news || "";
    document.getElementById("briefEvents").textContent = brief.todays_events || "";
  } catch (err) {
    console.error("Block brief failed to load:", err);
  }
}
loadBrief();
