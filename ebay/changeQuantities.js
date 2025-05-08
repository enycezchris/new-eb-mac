const mysql = require("mysql");
const axios = require("axios");
const fs = require("fs");
const xml2js = require("xml2js");

const EBAY_AUTH_TOKEN = fs.readFileSync(
  "/Users/swong/ebayAuthToken.txt",
  "utf-8"
);

async function changeQuantities(SKU, itemId) {
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
        ${createInventoryStatusNode(SKU, itemId)}
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

function createInventoryStatusNode(SKU, itemId) {
  const nodes = `<InventoryStatus>
        <ItemID>${itemId}</ItemID>
        <SKU>${SKU}-4x6</SKU>
        <StartPrice>7.89</StartPrice>
        <Quantity>0</Quantity>
    </InventoryStatus>
    <InventoryStatus>
        <ItemID>${itemId}</ItemID>
        <SKU>${SKU}-5x7</SKU>
        <StartPrice>8.89</StartPrice>
        <Quantity>0</Quantity>
    </InventoryStatus>
    <InventoryStatus>
        <ItemID>${itemId}</ItemID>
        <SKU>${SKU}-8x10</SKU>
        <StartPrice>9.89</StartPrice>
        <Quantity>1</Quantity>
    </InventoryStatus>
    <InventoryStatus>
        <ItemID>${itemId}</ItemID>
        <SKU>${SKU}-13x19</SKU>
        <StartPrice>17.89</StartPrice>
        <Quantity>0</Quantity>
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
  for (listing of listings) {
    console.log(`working on ${listing.SKU} ${listing.ebay_item_number}`);
    const data = await changeQuantities(listing.SKU, listing.ebay_item_number);
    const results = await parser.parseStringPromise(data);
    if (results.ReviseInventoryStatusResponse.Ack[0] === "Failure") {
      console.log(JSON.stringify(results));
    }
    console.log('completed')
    console.log("--------------------------");
  }
}

run();
