import puppeteer from "puppeteer";

const URL = "http://localhost:3000";
const OUT = "C:/Users/Admin/Desktop/shop/demo";

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--force-device-scale-factor=2"],
});

async function shot(name, { width, height, fullPage = false, action } = {}) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  await page.goto(URL, { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 900)); // let animations settle
  if (action) await action(page);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage });
  console.log("saved", name);
  await page.close();
}

// 1. Desktop full page
await shot("01-desktop-full", { width: 1280, height: 900, fullPage: true });

// 2. Desktop viewport (above the fold)
await shot("02-desktop-hero", { width: 1280, height: 860 });

// 3. Order modal open
await shot("03-modal", {
  width: 1280,
  height: 860,
  action: async (page) => {
    await page.click(".card .buy");
    await new Promise((r) => setTimeout(r, 500));
  },
});

// 4. Mobile
await shot("04-mobile", { width: 412, height: 915, fullPage: true });

await browser.close();
console.log("DONE");
