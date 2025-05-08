const mysql = require("mysql");
const axios = require("axios");
const fs = require("fs");
const xml2js = require("xml2js");

const EBAY_AUTH_TOKEN = fs.readFileSync(
  "/Users/swong/ebayAuthToken.txt",
  "utf-8"
);

function itemsToEnd(itemIds) {
  return itemIds.map((id) => {
    return `
    <EndItemRequestContainer>
      <MessageID>${id}</MessageID> 
      <EndingReason>NotAvailable</EndingReason>
      <ItemID>${id}</ItemID>
    </EndItemRequestContainer>`;
  });
}

async function endItems(itemIds) {
  const { data } = await axios.post(
    "https://api.ebay.com/ws/api.dll",
    `<?xml version="1.0" encoding="utf-8" ?>
    <EndItemsRequest xmlns="urn:ebay:apis:eBLBaseComponents">
      <RequesterCredentials>
        <eBayAuthToken>${EBAY_AUTH_TOKEN}</eBayAuthToken>
      </RequesterCredentials>
        <ErrorLanguage>en_US</ErrorLanguage>
        <WarningLevel>High</WarningLevel>
     ${itemsToEnd(itemIds).join("")}
    </EndItemsRequest>`,
    {
      headers: {
        "Content-Type": "text/xml",
        "X-EBAY-API-SITEID": "0",
        "X-EBAY-API-COMPATIBILITY-LEVEL": "1217",
        "X-EBAY-API-CALL-NAME": "EndItem",
      },
    }
  );
  return data;
}

async function run() {
  for (listing of listings) {
    const response = await endItems(endItem);
    console.log(counter, listing.ebay_item_number);
  }
}
