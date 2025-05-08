const mysql = require("mysql");
const axios = require("axios");
const fs = require("fs");
const xml2js = require("xml2js");

const EBAY_AUTH_TOKEN = fs.readFileSync(
  "/Users/swong/ebayAuthToken.txt",
  "utf-8"
);

async function getListings(pageNum = 1) {
  console.log("pageNum", pageNum);
  const { data } = await axios.post(
    "https://api.ebay.com/ws/api.dll",
    `<?xml version="1.0" encoding="utf-8"?>
    <GetMyeBaySellingRequest xmlns="urn:ebay:apis:eBLBaseComponents">
      <RequesterCredentials><eBayAuthToken>${EBAY_AUTH_TOKEN}</eBayAuthToken></RequesterCredentials>
        <ErrorLanguage>en_US</ErrorLanguage>
        <WarningLevel>High</WarningLevel>
      <ActiveList>
        <Sort>TimeLeft</Sort>
        <Pagination>
          <EntriesPerPage>200</EntriesPerPage>
          <PageNumber>${pageNum}</PageNumber> 
        </Pagination>
      </ActiveList>
    </GetMyeBaySellingRequest>`,
    {
      headers: {
        "Content-Type": "text/xml",
        "X-EBAY-API-SITEID": "0",
        "X-EBAY-API-COMPATIBILITY-LEVEL": "1217",
        "X-EBAY-API-CALL-NAME": "GetMyeBaySelling",
      },
    }
  );
  return data;
}

async function run() {
  //   const allItems = [];
  //   const parser = new xml2js.Parser();
  //   const items = await getListings(1);
  //   const results = await parser.parseStringPromise(items);
  //   const { ItemArray, PaginationResult } =
  //     results?.GetMyeBaySellingResponse?.ActiveList?.[0];
  //   allItems.push(...ItemArray?.[0]?.Item);
  //   let count = 2;
  //   let pageCount = PaginationResult?.[0]?.TotalNumberOfPages?.[0];
  //   const proms = [];
  //   while (count <= pageCount) {
  //     proms.push(getListings(count));
  //     count += 1;
  //   }
  //   const res = await Promise.all(proms);
  //   for (let i = 0; i < res.length; i++) {
  //     const results = await parser.parseStringPromise(res[i]);
  //     const { ItemArray } = results?.GetMyeBaySellingResponse?.ActiveList?.[0];
  //     allItems.push(...ItemArray?.[0]?.Item);
  //   }
  //   console.log(JSON.stringify(allItems, null, 2));
}

run();

const listings = require("./data/activeListings");
const sku = listings.map((l) => l.SKU[0]);

console.log(JSON.stringify(sku, null, 2));
console.log(sku.length);
