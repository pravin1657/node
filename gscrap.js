import { chromium } from "playwright";

async function scrapeGoogleWebsites(query) {
  const browser = await chromium.launch({
    headless: true,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  await page.goto(`https://www.google.com/search?q=${encodeURIComponent(query)}`, {
    waitUntil: "domcontentloaded",
  });

  const results = new Set();

  while (results.size < 30) {
    await page.waitForSelector("a h3", { timeout: 10000 }).catch(() => null);

    const links = await page.$$eval("a h3", (elements) =>
      elements.map((el) => el.closest("a")?.href).filter(Boolean)
    );

    for (const link of links) {
      try {
        const url = new URL(link);
        const domain = url.hostname.replace(/^www\./, "");
        results.add(domain);
      } catch {
        // ignore invalid urls
      }
    }

    if (results.size >= 30) break;

    const nextButton = await page.$("#pnnext");
    if (nextButton) {
      await Promise.all([
        page.click("#pnnext"),
        page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      ]);
    } else {
      break;
    }
  }

  await browser.close();

  return {
    query,
    total: results.size,
    websites: [...results].slice(0, 30),
  };
}

// ✅ Grab query from command line
const args = process.argv.slice(2);
const query = args.join(" "); // join all words as one string

if (!query) {
  console.error("❌ Please provide a search query, e.g. `node index.js dentist in hollywood`");
  process.exit(1);
}

scrapeGoogleWebsites(query).then((data) =>
  console.log(JSON.stringify(data, null, 2))
);
