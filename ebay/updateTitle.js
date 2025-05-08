const mysql = require("mysql");
const axios = require("axios");
const fs = require("fs");
const xml2js = require("xml2js");

const username = process.argv[2];

let EBAY_AUTH_TOKEN;
let config;

if (username === "activecolors") {
  EBAY_AUTH_TOKEN = fs.readFileSync(
    "/Users/swong/activecolors-ebayAuthToken.txt",
    "utf-8"
  );
  config = {
    photosTable: "activecolors_photos",
  };
} else if (false) {
} else {
  // fs.readFileSync(
  //   "/Users/swong/ebayAuthToken.txt",
  //   "utf-8"
  // );
  console.log("no username");
  process.exit();
}

async function updateTitle(itemId, title) {
  const { data } = await axios.post(
    "https://api.ebay.com/ws/api.dll",
    `<?xml version="1.0" encoding="utf-8"?>
      <ReviseItemRequest xmlns="urn:ebay:apis:eBLBaseComponents">
        <RequesterCredentials>
          <eBayAuthToken>${EBAY_AUTH_TOKEN}</eBayAuthToken>
        </RequesterCredentials>
          <ErrorLanguage>en_US</ErrorLanguage>
          <WarningLevel>High</WarningLevel>
        <Item>
          <ItemID>${itemId}</ItemID>
          <Title>${title}</Title>
        </Item>
      </ReviseItemRequest>`,
    {
      headers: {
        "Content-Type": "text/xml",
        "X-EBAY-API-SITEID": "0",
        "X-EBAY-API-COMPATIBILITY-LEVEL": "1217",
        "X-EBAY-API-CALL-NAME": "ReviseItem",
      },
    }
  );
  return data;
}

function getPhotosListed(connection) {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT *, CONCAT('A',LPAD(CONV(row_id,10,36), 6, 0)) as SKU FROM ${config.photosTable} WHERE ebay_item_number is not null AND row_id>=53154`,
      function (error, results, fields) {
        if (error) throw error;
        resolve([...results]);
      }
    );
  });
}

async function run() {
  const parser = new xml2js.Parser();
  const connection = mysql.createConnection({
    host: "desktop-hv0g29a",
    user: "swift",
    password: "swift",
    database: "readysetaction",
  });
  connection.connect();
  const listings = await getPhotosListed(connection);
  console.log("listings.length", listings.length);
  let counter = 0;
  for (listing of listings) {
    let title = `8x10 Glossy Photo Beautiful Nude Model Pinup Girl (Model ${listing.model_name}) ${listing.SKU}`;
    const response = await updateTitle(listing.ebay_item_number, title);
    const results = await parser.parseStringPromise(response);
    counter += 1;
    console.log(
      counter,
      title,
      listing.ebay_item_number,
      results.ReviseItemResponse.Ack?.[0]
    );
  }
}

run();
