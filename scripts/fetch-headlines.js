// Fetches real crypto headlines directly from public RSS feeds — no API key,
// no signup, no paid plan. Pulls a few headlines from each source and saves
// them to headlines.json, which the site's front end reads from.

import fs from "fs";

const FEEDS = [
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", source: "CoinDesk" },
  { url: "https://cointelegraph.com/rss", source: "Cointelegraph" },
  { url: "https://decrypt.co/feed", source: "Decrypt" },
];

const PER_FEED = 3;
const TOTAL_HEADLINES = 8;

function extractItems(xml) {
  const items = [];
  const itemBlocks = xml.split(/<item[\s>]/i).slice(1);
  for (const block of itemBlocks) {
    const titleMatch = block.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/i);
    if (titleMatch && linkMatch) {
      items.push({
        title: titleMatch[1].trim(),
        url: linkMatch[1].trim(),
      });
    }
    if (items.length >= PER_FEED) break;
  }
  return items;
}

async function fetchFeed(feed) {
  try {
    const response = await fetch(feed.url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; myblocknews-bot/1.0)" },
    });
    if (!response.ok) throw new Error(`${feed.source} feed returned ${response.status}`);
    const xml = await response.text();
    const items = extractItems(xml);
    return items.map((item) => ({ ...item, source: feed.source }));
  } catch (err) {
    console.error(`Failed to fetch ${feed.source}:`, err.message);
    return [];
  }
}

async function main() {
  const results = await Promise.all(FEEDS.map(fetchFeed));
  const combined = results.flat().slice(0, TOTAL_HEADLINES);

  if (combined.length === 0) {
    console.error("No headlines fetched from any feed — leaving headlines.json unchanged.");
    process.exit(1);
  }

  fs.writeFileSync("headlines.json", JSON.stringify(combined, null, 2));
  console.log(`Wrote ${combined.length} headlines to headlines.json`);
}

main();
