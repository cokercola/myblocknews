// Generates an original, auto-written daily market summary from CoinGecko
// data — no copied text, no third-party headlines. Writes recap.json, which
// the site's front end (recap.js) reads and renders.
//
// Two API calls: one for current prices + 24h change across the tracked
// coins, one for a same-day price history of whichever coin moved the most,
// used to draw a small inline SVG sparkline.

import fs from "fs";

const COINS = [
  { id: "bitcoin", symbol: "BTC" },
  { id: "ethereum", symbol: "ETH" },
  { id: "binancecoin", symbol: "BNB" },
  { id: "solana", symbol: "SOL" },
  { id: "ripple", symbol: "XRP" },
  { id: "dogecoin", symbol: "DOGE" },
];

async function fetchMarkets() {
  const ids = COINS.map((c) => c.id).join(",");
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&price_change_percentage=24h`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`markets endpoint returned ${res.status}`);
  return res.json();
}

async function fetchSparkline(coinId) {
  const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`market_chart endpoint returned ${res.status}`);
  const data = await res.json();
  // data.prices is an array of [timestamp, price] pairs across the day
  return data.prices.map(([, price]) => price);
}

// Builds a compact inline SVG sparkline. No external image file needed —
// this string gets embedded directly in recap.json and rendered as-is.
function buildSparklineSvg(prices, isUp) {
  const W = 400;
  const H = 160;
  const pad = 12;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const points = prices.map((p, i) => {
    const x = pad + ((W - 2 * pad) * i) / (prices.length - 1);
    const y = H - pad - ((H - 2 * pad) * (p - min)) / range;
    return [x, y];
  });

  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const fillPath = `${linePath} L${points[points.length - 1][0].toFixed(1)},${H - pad} L${points[0][0].toFixed(1)},${H - pad} Z`;

  const lineColor = isUp ? "#0E8F72" : "#D64545";
  const fillColor = isUp ? "#E1F5EE" : "#FBEAEA";
  const [lastX, lastY] = points[points.length - 1];

  return `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
<path d="${fillPath}" fill="${fillColor}" stroke="none"/>
<path d="${linePath}" fill="none" stroke="${lineColor}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
<circle cx="${lastX.toFixed(1)}" cy="${lastY.toFixed(1)}" r="4" fill="${lineColor}"/>
</svg>`;
}

function formatPct(pct) {
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

// Builds a short, original paragraph from the day's actual numbers —
// no two days will read exactly the same since the inputs change daily.
function buildBody(markets, mover) {
  const sorted = [...markets].sort(
    (a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h
  );
  const gainer = sorted[0];
  const loser = sorted[sorted.length - 1];
  const avgChange =
    markets.reduce((sum, m) => sum + m.price_change_percentage_24h, 0) / markets.length;

  const overallTone =
    avgChange > 1 ? "a broadly positive day" : avgChange < -1 ? "a broadly negative day" : "a mixed, range-bound day";

  const gainerSym = COINS.find((c) => c.id === gainer.id).symbol;
  const loserSym = COINS.find((c) => c.id === loser.id).symbol;
  const moverSym = COINS.find((c) => c.id === mover.id).symbol;

  return (
    `Crypto markets saw ${overallTone}. ` +
    `${gainerSym} led gainers at ${formatPct(gainer.price_change_percentage_24h)}, ` +
    `while ${loserSym} lagged at ${formatPct(loser.price_change_percentage_24h)}. ` +
    `${moverSym} was the day's biggest mover overall, moving ${formatPct(mover.price_change_percentage_24h)} over the past 24 hours.`
  );
}

async function main() {
  const markets = await fetchMarkets();

  if (!markets.length) {
    console.error("No market data returned — leaving recap.json unchanged.");
    process.exit(1);
  }

  const mover = [...markets].sort(
    (a, b) => Math.abs(b.price_change_percentage_24h) - Math.abs(a.price_change_percentage_24h)
  )[0];

  const sparklinePrices = await fetchSparkline(mover.id);
  const isUp = mover.price_change_percentage_24h >= 0;
  const svg = buildSparklineSvg(sparklinePrices, isUp);

  const today = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const recap = {
    date: today,
    headline: `Daily market summary — ${today}`,
    body: buildBody(markets, mover),
    mover: {
      symbol: COINS.find((c) => c.id === mover.id).symbol,
      changePct: Number(mover.price_change_percentage_24h.toFixed(2)),
    },
    sparklineSvg: svg,
    generatedAt: new Date().toISOString(),
  };

  fs.writeFileSync("recap.json", JSON.stringify(recap, null, 2));
  console.log(`Wrote recap.json — biggest mover today: ${recap.mover.symbol} (${formatPct(recap.mover.changePct)})`);
}

main().catch((err) => {
  console.error("Failed to generate recap:", err.message);
  process.exit(1);
});
