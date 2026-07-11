// Live price ticker, powered by CoinGecko's free public API.
// No API key needed, and no regional access restrictions.

const COINS = [
  { id: "bitcoin", label: "BTC" },
  { id: "ethereum", label: "ETH" },
  { id: "binancecoin", label: "BNB" },
  { id: "solana", label: "SOL" },
  { id: "ripple", label: "XRP" },
  { id: "dogecoin", label: "DOGE" },
  { id: "cardano", label: "ADA" },
  { id: "avalanche-2", label: "AVAX" },
  { id: "tron", label: "TRX" },
  { id: "polkadot", label: "DOT" }
];

function formatPrice(value) {
  if (value >= 1) {
    return "$" + value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return "$" + value.toFixed(4);
}

function renderLoading() {
  const row = document.getElementById("tickerRow");
  row.innerHTML = "";
  COINS.forEach(coin => {
    const card = document.createElement("div");
    card.className = "ticker-card loading";
    card.innerHTML = `
      <div class="sym">${coin.label}</div>
      <div class="price">&mdash;</div>
      <div class="change">loading</div>
    `;
    row.appendChild(card);
  });
}

async function loadTicker() {
  const row = document.getElementById("tickerRow");
  const ids = COINS.map(c => c.id).join(",");

  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`
    );
    if (!response.ok) throw new Error("CoinGecko API request failed");
    const data = await response.json();

    row.innerHTML = "";
    COINS.forEach(coin => {
      const info = data[coin.id];
      const card = document.createElement("div");
      card.className = "ticker-card";

      if (!info) {
        card.innerHTML = `
          <div class="sym">${coin.label}</div>
          <div class="price">&mdash;</div>
          <div class="change">n/a</div>
        `;
        row.appendChild(card);
        return;
      }

      const changePct = info.usd_24h_change || 0;
      const isUp = changePct >= 0;
      card.innerHTML = `
        <div class="sym">${coin.label}</div>
        <div class="price">${formatPrice(info.usd)}</div>
        <div class="change ${isUp ? "up" : "down"}">${isUp ? "+" : ""}${changePct.toFixed(1)}%</div>
      `;
      row.appendChild(card);
    });
  } catch (err) {
    console.error("Ticker failed to load:", err);
    row.innerHTML = `<div style="font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--text-dim);padding:10px 0;">Live prices are temporarily unavailable.</div>`;
  }
}

renderLoading();
loadTicker();
// Refresh every 60 seconds — comfortably within CoinGecko's free rate limit.
setInterval(loadTicker, 60000);
