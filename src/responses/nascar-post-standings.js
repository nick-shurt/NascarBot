const config = require("../config");
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const puppeteer = require("puppeteer");

function trigger(msg) {
  return /@standings/i.test(msg.text);
}

async function respond(msg) {
  try {
    const url =
      "https://thefantasynascarleague.com/fantasy_nascar.php?year=2025";
    const screenshotPath = "standings.png";

    await captureStandings(url, screenshotPath);
    const imageUrl = await uploadImageToGroupMe(screenshotPath);
    await postImageToGroup(imageUrl);
  } catch (err) {
    console.error(err);
  }
}

async function captureStandings(url, outputPath = "standings.png") {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "/usr/bin/chromium", // Required for Docker (Render)
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();

  try {
    await page.goto(url, { waitUntil: "networkidle0" });
    await page.click('a[href="#tab3"]');
    await page.waitForSelector(".standings", { visible: true, timeout: 10000 });

    const element = await page.$(".standings");
    if (!element) throw new Error("❌ Could not find .standings element");

    await page.evaluate(() => {
      const el = document.querySelector(".standings");
      el?.scrollIntoView();

      if (el) {
        el.style.padding = "15px";
      }
    });

    await element.screenshot({ path: outputPath });
    return outputPath;
  } catch (err) {
    console.error("❌ Error during capture:", err.message);
  } finally {
    await browser.close();
  }
}

async function uploadImageToGroupMe(imagePath) {
  const form = new FormData();
  form.append("file", fs.createReadStream(imagePath));

  const response = await axios.post(
    "https://image.groupme.com/pictures",
    form,
    {
      headers: {
        ...form.getHeaders(),
        "X-Access-Token": config.ACCESS_TOKEN,
      },
    }
  );

  return response.data.payload.picture_url;
}

async function postImageToGroup(imageUrl) {
  await axios.post("https://api.groupme.com/v3/bots/post", {
    bot_id: config.BOT_ID,
    text: "", // you can add a caption here
    picture_url: imageUrl,
  });
}

exports.trigger = trigger;
exports.respond = respond;
