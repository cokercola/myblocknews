// Fetches real crypto headlines directly from public RSS feeds — no API key,
// no signup, no paid plan. Pulls a few headlines from each source and saves
// them to headlines.json, which the site's front end reads from.
import fs from "fs";
const FEEDS = [
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", source: "CoinDesk" },
  { url: "https://cointelegraph.com/rss", source: "Cointelegraph" },
  { url: "https://decrypt.co/feed", source: "Decrypt" },
];
const PER_FEED = 10;
const TOTAL_HEADLINES = 8;
const TOTAL_REGULATION = 6;

const REGULATION_KEYWORDS = [
  "sec", "cftc", "regulat", "lawsuit", "legislat", "congress", "senate",
  "bill", "ruling", "court", "compliance", "ban", "fine", "charged",
  "indict", "settlement", "mica", "policy", "law ", "fca", "doj",
];

function isRegulationHeadline(title) {
  const lower = title.toLowerCase();
  return REGULATION_KEYWORDS.some((kw) => lower.includes(kw));
}

// Strips a CDATA wrapper if present, otherwise returns the string as-is.
// Some feeds (Cointelegraph) wrap <link> and <title> in CDATA; others
// (CoinDesk, Decrypt) don't. This makes both cases come out clean.
function stripCdata(value) {
  const match = value.match(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/);
  return (match ? match[1] : value).trim();
}

// Tries a few common RSS image patterns, in order of reliability.
// Returns null if none are found — the frontend already handles that gracefully.
function extractImage(block) {
  const mediaContent = block.match(/<media:content[^>]*url=["']([^"']+)["'][^>]*>/i);
  if (mediaContent) return mediaContent[1];

  const enclosure = block.match(/<enclosure[^>]*url=["']([^"']+)["'][^>]*type=["']image[^"']*["'][^>]*>/i);
  if (enclosure) return enclosure[1];

  const mediaThumbnail = block.match(/<media:thumbnail[^>]*url=["']([^"']+)["'][^>]*>/i);
  if (mediaThumbnail) return mediaThumbnail[1];

  // Some feeds put an <img> tag inside a CDATA-wrapped <description>
  const descImage = block.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
  if (descImage) return descImage[1];

  return null;
}

function extractItems(xml) {
  const items = [];
  const itemBlocks = xml.split(/<item[\s>]/i).slice(1);
  for (const block of itemBlocks) {
    const titleMatch = block.match(/<title>([\s\S]*?)<\/title>/i);
    const linkMatch = block.match(/<link>([\s\S]*?)<\/link>/i);
    if (titleMatch && linkMatch) {
      items.push({
        title: stripCdata(titleMatch[1]),
        url: stripCdata(linkMatch[1]),
        image: extractImage(block),
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
  const allItems = results.flat();

  if (allItems.length === 0) {
    console.error("No headlines fetched from any feed — leaving headlines.json and regulation.json unchanged.");
    process.exit(1);
  }

  const regulationItems = allItems
    .filter((item) => isRegulationHeadline(item.title))
    .slice(0, TOTAL_REGULATION);

  const generalItems = allItems
    .filter((item) => !regulationItems.includes(item))
    .slice(0, TOTAL_HEADLINES);

  fs.writeFileSync("headlines.json", JSON.stringify(generalItems, null, 2));
  console.log(`Wrote ${generalItems.length} headlines to headlines.json`);

  fs.writeFileSync("regulation.json", JSON.stringify(regulationItems, null, 2));
  console.log(`Wrote ${regulationItems.length} headlines to regulation.json`);
}
main();
