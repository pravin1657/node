// index3.js
import { chromium } from "playwright";

async function scrapeWebsite(url) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    // Timeout check (9s)
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 9000 });

    let allData = "";

    // Function to extract raw text from a page
    async function extractText(label) {
      const content = await page.evaluate(() => document.body.innerText);
      return `\n\n===== ${label.toUpperCase()} PAGE =====\n\n${content}`;
    }

    // Scrape Home Page
    allData += await extractText("Home");

    // Scrape "About Us" if exists
    const aboutLink = await page.$(`a:has-text("About")`);
    if (aboutLink) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: "domcontentloaded" }),
        aboutLink.click(),
      ]);
      allData += await extractText("About Us");
      await page.goBack({ waitUntil: "domcontentloaded" });
    }

    // Scrape "Contact Us" if exists
    const contactLink = await page.$(`a:has-text("Contact")`);
    if (contactLink) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: "domcontentloaded" }),
        contactLink.click(),
      ]);
      allData += await extractText("Contact Us");
    }

    console.log(allData || "No content found");
  } catch (err) {
    if (err.name === "TimeoutError") {
      console.log("website is not loading");
    } else {
      console.log(`Error: ${err.message}`);
    }
  } finally {
    await browser.close();
  }
}

// Run with: node index3.js https://example.com
const url = process.argv[2];
if (!url) {
  console.log("Please provide a URL. Example: node index3.js https://example.com");
  process.exit(1);
}

scrapeWebsite(url);
