// Updates brief.json's "date" and "biggest_movers" fields using free, no-key
// market data from CoinGecko. All other fields (headline, overnight, whale
// activity, regulatory news, today's events) are left untouched — those are
// still written by hand since they require real editorial judgment.
import fs from "fs";

const COINS = [
  { id: "bitcoin", label: "BTC" },
  { id: "ethereum", label: "ETH" },
  { id: "solana", label: "SOL" },
  { id: "ripple", label: "XRP" },
  { id: "binancecoin", label: "BNB" },
];

const BRIEF_PATH = "brief.json";

function formatDate(d) {
  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

async function fetchMarketData() {
  const ids = COINS.map((c) => c.id).join(",");
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&price_change_percentage=24h`;
  const response = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; myblocknews-bot/1.0)" },
  });
  if (!response.ok) throw new Error(`CoinGecko returned ${response.status}`);
  return response.json();
}

function buildMoversText(marketData) {
  const byId = Object.fromEntries(marketData.map((m) => [m.id, m]));
  const rows = COINS
    .map((c) => byId[c.id])
    .filter(Boolean)
    .map((m) => ({
      label: COINS.find((c) => c.id === m.id).label,
      change: m.price_change_percentage_24h,
    }))
    .filter((r) => typeof r.change === "number");

  if (rows.length === 0) return null;

  const sorted = [...rows].sort((a, b) => b.change - a.change);
  const leader = sorted[0];
  const laggard = sorted[sorted.length - 1];

  const leaderText = `${leader.label} led majors, ${leader.change >= 0 ? "up" : "down"} ${Math.abs(leader.change).toFixed(1)}%.`;
  const laggardText = leader.label === laggard.label
    ? ""
    : ` ${laggard.label} lagged, ${laggard.change >= 0 ? "up" : "down"} ${Math.abs(laggard.change).toFixed(1)}%.`;

  return leaderText + laggardText;
}

async function main() {
  let brief = {};
  try {
    brief = JSON.parse(fs.readFileSync(BRIEF_PATH, "utf8"));
  } catch {
    console.log("No existing brief.json found — creating a new one with placeholder narrative fields.");
    brief = {
      headline: "Update this headline manually",
      overnight: "Update this field manually.",
      whale_activity: "Update this field manually.",
      regulatory_news: "Update this field manually.",
      todays_events: "Update this field manually.",
    };
  }

  const marketData = await fetchMarketData();
  const moversText = buildMoversText(marketData);

  brief.date = formatDate(new Date());
  if (moversText) brief.biggest_movers = moversText;

  fs.writeFileSync(BRIEF_PATH, JSON.stringify(brief, null, 2));
  console.log(`Updated brief.json — date: ${brief.date}, movers: ${brief.biggest_movers}`);
}

main().catch((err) => {
  console.error("Failed to update brief.json:", err.message);
  process.exit(1);
});
