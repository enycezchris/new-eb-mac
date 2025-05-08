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
              ${changeSet.map((itemId) => createQtyChangeNode(itemId))}
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

function createQtyChangeNode(itemId) {
  const nodes = `<InventoryStatus>
          <ItemID>${itemId}</ItemID>
          <Quantity>1</Quantity>
      </InventoryStatus>`;
  return nodes;
}

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
  const allItems = [];
  const parser = new xml2js.Parser();
  const items = await getListings(1);
  const results = await parser.parseStringPromise(items);
  const { ItemArray, PaginationResult } =
    results?.GetMyeBaySellingResponse?.ActiveList?.[0];
  allItems.push(...ItemArray?.[0]?.Item);

  let count = 2;
  let pageCount = PaginationResult?.[0]?.TotalNumberOfPages?.[0];

  const proms = [];

  while (count <= pageCount) {
    proms.push(getListings(count));
    count += 1;
  }

  const res = await Promise.all(proms);
  for (let i = 0; i < res.length; i++) {
    const results = await parser.parseStringPromise(res[i]);
    const { ItemArray } = results?.GetMyeBaySellingResponse?.ActiveList?.[0];
    allItems.push(...ItemArray?.[0]?.Item);
  }

  const moreOrLessThanOne = allItems
    .filter((item) => item?.QuantityAvailable?.[0] != "1")
    .map((item) => item?.ItemID?.[0]);

  const changeQtyPromises = [];
  for (let i = 0; i < moreOrLessThanOne.length; i += 4) {
    const changeSet = moreOrLessThanOne.slice(i, i + 4);
    console.log(changeSet);
    changeQtyPromises.push(changeQuantities(changeSet));
  }
  const changeQtyRes = await Promise.all(changeQtyPromises);
  for (let i = 0; i < changeQtyRes.length; i++) {
    const results = await parser.parseStringPromise(changeQtyRes[i]);
    console.log(results.ReviseInventoryStatusResponse.Ack[0]);
    if (results.ReviseInventoryStatusResponse.Ack[0] === "Failure") {
      console.log(JSON.stringify(results));
    }
    console.log("completed");
    console.log(i * 4, moreOrLessThanOne.length);
    console.log("--------------------------");
  }
}

run();
