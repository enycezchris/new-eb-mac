const mysql = require("mysql");
const axios = require("axios");
const fs = require("fs");
const xml2js = require("xml2js");

const EBAY_AUTH_TOKEN = fs.readFileSync(
  "/Users/swong/ebayAuthToken.txt",
  "utf-8"
);

async function updateItemSpecificsForNudity(itemId) {
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
          <ItemSpecifics>
                      <NameValueList>
                        <Name>Type</Name>
                        <Value>Photograph</Value>
                      </NameValueList>
                      <NameValueList>
                          <Name>Subject</Name>
                          <Value>Nudes</Value>
                          <Value>Pin-up Model</Value>
                          <Value>Model</Value>
                      </NameValueList>
                      <NameValueList>
                          <Name>Theme</Name>
                          <Value>Risqué</Value>
                      </NameValueList>
                      
                  </ItemSpecifics>
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
      "SELECT * FROM photos WHERE ebay_item_number is not null",
      function (error, results, fields) {
        if (error) throw error;
        resolve([...results]);
      }
    );
  });
}

async function run() {
  const connection = mysql.createConnection({
    host: "desktop-hv0g29a",
    user: "swift",
    password: "swift",
    database: "readysetaction",
  });
  connection.connect();
  const listings = await getPhotosListed(connection);
  let counter = 0;
  for (listing of listings) {
    const response = await updateItemSpecificsForNudity(
      listing.ebay_item_number
    );
    counter += 1;
    console.log(counter, listing.ebay_item_number);
  }
}
