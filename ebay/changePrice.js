const mysql = require("mysql");
const axios = require("axios");
const fs = require("fs");
const xml2js = require("xml2js");

const EBAY_AUTH_TOKEN = fs.readFileSync(
  "/Users/swong/ebayAuthToken.txt",
  "utf-8"
);

async function changeQuantities(changeSet) {
  const { data } = await axios.post(
    "https://api.ebay.com/ws/api.dll",
    `<?xml version="1.0" encoding="utf-8"?>
        <ReviseInventoryStatusRequest xmlns="urn:ebay:apis:eBLBaseComponents">
        <RequesterCredentials>
        <eBayAuthToken>${EBAY_AUTH_TOKEN}</eBayAuthToken>
        </RequesterCredentials>
            <ErrorLanguage>en_US</ErrorLanguage>
            <WarningLevel>High</WarningLevel>
            <!-- You can specify up to 4 <InventoryStatus> nodes-->
            ${changeSet.map((c) => createPriceChangeNode(c.ebay_item_number))}
        </ReviseInventoryStatusRequest>
        `,
    {
      headers: {
        "Content-Type": "text/xml",
        "X-EBAY-API-SITEID": "0",
        "X-EBAY-API-COMPATIBILITY-LEVEL": "1217",
        "X-EBAY-API-CALL-NAME": "ReviseInventoryStatus",
      },
    }
  );
  return data;
}

function createPriceChangeNode(itemId) {
  const nodes = `<InventoryStatus>
        <ItemID>${itemId}</ItemID>
        <StartPrice>7.99</StartPrice>
        <Quantity>1</Quantity>
    </InventoryStatus>`;
  return nodes;
}

function getPhotosListed(connection) {
  return new Promise((resolve, reject) => {
    connection.query(
      "SELECT ebay_item_number, CONCAT('A',LPAD(CONV(row_id,10,36), 6, 0)) as SKU FROM photos WHERE ebay_item_number is not null",
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
  for (let i = 0; i < listings.length; i += 4) {
    const changeSet = listings.slice(i, i + 4);
    changeSet.forEach((c) => {
      console.log(c.SKU, c.ebay_item_number);
    });
    const data = await changeQuantities(changeSet);
    const results = await parser.parseStringPromise(data);
    console.log(results.ReviseInventoryStatusResponse.Ack[0]);
    if (results.ReviseInventoryStatusResponse.Ack[0] === "Failure") {
      console.log(JSON.stringify(results));
    }
    console.log("completed");
    console.log(i, listings.length);
    console.log("--------------------------");
  }
}

run();
