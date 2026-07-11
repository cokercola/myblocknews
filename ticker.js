// Live price ticker, powered by Binance's public market data API.
// No API key needed — this is Binance's open, unauthenticated endpoint.

const COINS = [
  { symbol: "BTCUSDT", label: "BTC" },
  { symbol: "ETHUSDT", label: "ETH" },
  { symbol: "BNBUSDT", label: "BNB" },
  { symbol: "SOLUSDT", label: "SOL" },
  { symbol: "XRPUSDT", label: "XRP" },
  { symbol: "DOGEUSDT", label: "DOGE" },
  { symbol: "ADAUSDT", label: "ADA" },
  { symbol: "AVAXUSDT", label: "AVAX" },
  { symbol: "TRXUSDT", label: "TRX" },
  { symbol: "DOTUSDT", label: "DOT" }
];

function formatPrice(value) {
  const num = parseFloat(value);
  if (num >= 1) {
    return "$" + num.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }
  return "$" + num.toFixed(4);
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
  const symbolsParam = encodeURIComponent(JSON.stringify(COINS.map(c => c.symbol)));

  try {
    const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${symbolsParam}`);
    if (!response.ok) throw new Error("Binance API request failed");
    const data = await response.json();

    row.innerHTML = "";
    COINS.forEach(coin => {
      const info = data.find(d => d.symbol === coin.symbol);
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

      const changePct = parseFloat(info.priceChangePercent);
      const isUp = changePct >= 0;
      card.innerHTML = `
        <div class="sym">${coin.label}</div>
        <div class="price">${formatPrice(info.lastPrice)}</div>
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
// Refresh every 60 seconds. Binance's free public endpoint has a generous
// rate limit, so this is comfortably within normal, safe usage.
setInterval(loadTicker, 60000);
