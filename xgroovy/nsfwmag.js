const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs/promises");
const crypto = require("crypto");
const path = require("path");
const fsSync = require("fs");

// const SAVE_DIRECTORY = "/Volumes/Extreme SSD/xgroovy/vintage";
const FILE_LIST = "./nsfwmag.txt";
// const LOG_FILE = "./logs.csv";

// const hashes = fsSync.readdirSync(SAVE_DIRECTORY);

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
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
    },
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

let fullCount = 0;

const run = async (pageNum) => {
  const pageUrl = `https://nsfwmag.com/category/photo/page/${pageNum}/`;
  const list = await get(pageUrl);
  const album = list(".thumb-holder");
  for (let i = 0; i < album.length; i++) {
    const picPage = await get(album[i].attribs.href.trim());
    const imgLink = picPage("a.fullscreen")[0].attribs.href;
    console.log(++fullCount, imgLink);
    await fs.appendFile(FILE_LIST, imgLink + ",");
  }
};

const loop = async () => {
  let pageNum = 1;
  while (pageNum <= 1200) {
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

const SAVE_DIRECTORY = "/Volumes/Extreme SSD";

async function downloadImage(url, filename) {
  const response = await axios({
    method: "GET",
    url: url,
    responseType: "stream",
  });
  response.data.pipe(
    fsSync.createWriteStream(path.resolve(`${SAVE_DIRECTORY}/${filename}`))
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

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

(async function run() {
  const files = fsSync.readdirSync(SAVE_DIRECTORY);
  console.log(files);

  const urls = fsSync.readFileSync("./nsfwmag.txt", "utf-8").split(",").sort();
  const leftover = urls.filter((url) => !files.includes(url.split("/").pop()));
  for (let i = 0; i < leftover.length; i++) {
    const url = leftover[i];
    const filename = url.split("/").pop();
    console.log(`${i}/${leftover.length}`, filename);
    await downloadImage(url, filename);
  }
})();
