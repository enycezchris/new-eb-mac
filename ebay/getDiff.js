const mysql = require("mysql");
const axios = require("axios");
const fs = require("fs");
const xml2js = require("xml2js");

const EBAY_AUTH_TOKEN = fs.readFileSync(
  "/Users/swong/ebayAuthToken.txt",
  "utf-8"
);

async function getListings(pageNum = 1) {
  const { data } = await axios.post(
    "https://api.ebay.com/ws/api.dll",
    `<?xml version="1.0" encoding="utf-8"?>
        <GetMyeBaySellingRequest xmlns="urn:ebay:apis:eBLBaseComponents">
        <RequesterCredentials>
            <eBayAuthToken>${EBAY_AUTH_TOKEN}</eBayAuthToken>
        </RequesterCredentials>
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

function getPhotosListed(connection) {
  return new Promise((resolve, reject) => {
    connection.query(
      "SELECT ebay_item_number, CONCAT('A',LPAD(CONV(row_id,10,36), 6, 0)) as SKU FROM photos",
      function (error, results, fields) {
        if (error) throw error;
        resolve([...results]);
      }
    );
  });
}

function updateLive(connection, isLive, itemId) {
  return new Promise((resolve, reject) => {
    connection.query(
      "UPDATE photos SET isLive = ? WHERE ebay_item_number = ?",
      [isLive, itemId],
      function (error, results, fields) {
        if (error) throw error;
        resolve(results);
      }
    );
  });
}

async function run() {
  const itemsListedOnEbay = [];
  const parser = new xml2js.Parser();
  const connection = mysql.createConnection({
    host: "desktop-hv0g29a",
    user: "swift",
    password: "swift",
    database: "readysetaction",
  });
  connection.connect();
  const photosInDb = await getPhotosListed(connection);
  let pageNum = 1;
  while (true) {
    const eBayListings = await getListings(pageNum);
    const results = await parser.parseStringPromise(eBayListings);
    const totalPages =
      results.GetMyeBaySellingResponse.ActiveList[0].PaginationResult[0]
        .TotalNumberOfPages[0];
    const ebayItems =
      results.GetMyeBaySellingResponse.ActiveList[0].ItemArray[0].Item.map(
        (i) => ({
          itemId: i.ItemID?.[0],
          SKU: i.SKU?.[0],
          quantity: i.QuantityAvailable?.[0],
        })
      );
    itemsListedOnEbay.push(...ebayItems);
    if (totalPages == pageNum) {
      break;
    }
    pageNum += 1;
  }
  let difference = photosInDb.filter((p) => {
    return !itemsListedOnEbay.some((l) => l.itemId === p.ebay_item_number);
  });
  const dbItemIds = photosInDb.map((photos) => photos.ebay_item_number);
  const eBayItemIds = itemsListedOnEbay.map((photos) => photos.itemId);

  const eBayItemsNotFoundInDb = itemsListedOnEbay.filter((ebayItem) => {
    return !dbItemIds.includes(ebayItem.itemId);
  });
  const dbItemsNotFoundOnEbay = photosInDb.filter((dbItemId) => {
    return !eBayItemIds.includes(dbItemId.ebay_item_number);
  });

  console.log("difference", difference.length);
  console.log("photosInDb: ", photosInDb.length);
  console.log("db items NOT listed on ebay", dbItemsNotFoundOnEbay);
  console.log("itemsListedOnEbay: ", itemsListedOnEbay.length);
  console.log(
    "ebay items listed that were NOT found in DB",
    eBayItemsNotFoundInDb
  );

  connection.end();
}

run();
