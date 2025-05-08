const getData = require("./getData");
const data = getData();
const axios = require("axios");
// const cheerio = require("cheerio");
const crypto = require("crypto");
const path = require("path");
const fsSync = require("fs");

const SAVE_DIRECTORY = "/Volumes/DESKTOP-JPAABKV-1/_scroller_NOSPAM";
// const PAGE_TO_GET =
//   "https://scrolller.com/r/JerkOffToCelebs?filter=pictures&sort=top";
// // const FILE_LIST = "./filelist.txt";
// // const LOG_FILE = "./logs.csv";

const hashes = [
  ...fsSync.readdirSync(SAVE_DIRECTORY),
  ...fsSync.readdirSync("/Volumes/DESKTOP-JPAABKV-1/_scroller"),
  ...fsSync.readdirSync("/Volumes/DESKTOP-JPAABKV-1/_pics/new"),
];

// function sleep(ms) {
//   return new Promise((resolve) => {
//     setTimeout(resolve, ms);
//   });
// }

// async function get(url) {
//   const headers = {
//     "User-Agent":
//       "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
//   };
//   const response = await axios.get(url, headers);
//   return cheerio.load(response.data);
// }

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

async function run() {
  const uniq = [...new Set(data)];
  for (let i = 0; i < uniq.length; i++) {
    const img = uniq[i];
    const { alt, src } = img;
    const links = src.split(",");
    const objs = {};
    links.forEach((l) => {
      const [url, size] = l.split(" ");
      objs[parseInt(size, 10)] = url;
    });
    const index = Math.max(...Object.keys(objs));
    const url = objs[index];
    const urlParts = url.split("/");
    const filename = urlParts[urlParts.length - 1];
    console.log(hashes.includes(filename) ? "skipping" : "download", filename);
    if (hashes.includes(filename)) {
      continue;
    }
    console.log(`downloading ${url} to ${filename}`);
    try {
      await downloadImage(url, filename);
    } catch (err) {
      console.log("err");
    } finally {
      console.log(`downloaded ${filename}`);
    }
  }
}

run();
