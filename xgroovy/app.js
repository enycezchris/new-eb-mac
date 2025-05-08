const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs/promises");
const crypto = require("crypto");
const path = require("path");
const fsSync = require("fs");

const SAVE_DIRECTORY = "/Volumes/Extreme SSD/xgroovy/vintage";
const PAGE_TO_GET = "https://xgroovy.com/photos/categories/vintage/";
const FILE_LIST = "./filelist.txt";
const LOG_FILE = "./logs.csv";

const hashes = fsSync.readdirSync(SAVE_DIRECTORY);

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function get(url) {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
  };
  const response = await axios.get(url, headers);
  return cheerio.load(response.data);
}

async function downloadImage(url, filename) {
  const response = await axios({
    method: "GET",
    url: url,
    responseType: "stream",
  });
  response.data.pipe(
    fsSync.createWriteStream(path.resolve(`${SAVE_DIRECTORY}/${filename}.jpg`))
  );
  return new Promise((resolve, reject) => {
    response.data.on("end", () => {
      resolve();
    });
    response.data.on("error", () => {
      reject();
    });
  });
}

const run = async (pageNum) => {
  const url = `${PAGE_TO_GET}/${pageNum}/?sort=fav`;
  const list = await get(url);
  const album = list("div.list-albums div.item[data-album-id] > a");
  const urls = album
    .map(function () {
      const url = list(this).attr("href").trim();
      return url;
    })
    .toArray();

  const numOfUrls = urls.length;
  let count = 0;

  urls.forEach(async (url) => {
    const $ = await get(url);
    const imgUrl = $("a#main_image_holder").attr("href");
    const title = $("h1.title").text().trim();
    const tags = $("span.added_to > a").text().replace(/\s/g, "_");
    if (!imgUrl) {
      console.log(`skipping ${url}, no imgUrl found`);
      return;
    }
    const hash = crypto.createHash("md5").update(imgUrl).digest("hex");
    if (hashes.includes(`${hash}.jpg`)) {
      count += 1;
      console.log(
        `skipping ${hash}, finished ${count}/${numOfUrls} of page ${pageNum}`
      );
      return;
    }
    console.log(`downloading ${hash}.jpg from ${imgUrl} on page ${pageNum}`);
    try {
      await downloadImage(imgUrl, hash);
    } catch (err) {
      // console.log("err");
    } finally {
      await fs.appendFile(
        LOG_FILE,
        `${hash},${imgUrl},${title},${tags},${pageNum}\n`
      );
      await fs.appendFile(FILE_LIST, `${hash},`);
      count += 1;
      console.log(
        `downloaded ${hash}.jpg from ${imgUrl} on page ${pageNum}, finished ${count}/${numOfUrls} of page ${pageNum}`
      );
    }
  });
  await sleep(6600);
};

const loop = async () => {
  let pageNum = 1;
  while (pageNum <= 11406) {
    console.log(`running page ${pageNum}`);
    try {
      await run(pageNum);
    } catch (err) {
      console.log("pageNum stopped at", pageNum);
      process.exit(0);
    }
    pageNum++;
  }
};

loop();
