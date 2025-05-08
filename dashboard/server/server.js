const mysql = require("mysql");
const axios = require("axios");
const fs = require("fs");
const xml2js = require("xml2js");

const EBAY_AUTH_TOKEN = fs.readFileSync(
  "/Users/swong/ebayAuthToken.txt",
  "utf-8"
);

function getPhotosListed(connection) {
  return new Promise((resolve, reject) => {
    connection.query(
      "SELECT *, CONCAT('A',LPAD(CONV(row_id,10,36), 6, 0)) as SKU FROM photos",
      function (error, results, fields) {
        if (error) throw error;
        resolve([...results]);
      }
    );
  });
}

async function getOrders() {
  const { data } = await axios.post(
    "https://api.ebay.com/ws/api.dll",
    `<?xml version="1.0" encoding="utf-8"?>
    <GetOrdersRequest xmlns="urn:ebay:apis:eBLBaseComponents">
    <RequesterCredentials><eBayAuthToken>${EBAY_AUTH_TOKEN}</eBayAuthToken></RequesterCredentials>
    <ErrorLanguage>en_US</ErrorLanguage>
    <WarningLevel>High</WarningLevel>
    <NumberOfDays>30</NumberOfDays>
    <OrderRole>Seller</OrderRole>
    <OrderStatus>Completed</OrderStatus>
    <SortingOrder>Descending</SortingOrder>
    <Pagination> 
        <EntriesPerPage>100</EntriesPerPage>
        <PageNumber>1</PageNumber>
    </Pagination>
    </GetOrdersRequest>`,
    {
      headers: {
        "Content-Type": "text/xml",
        "X-EBAY-API-SITEID": "0",
        "X-EBAY-API-COMPATIBILITY-LEVEL": "1217",
        "X-EBAY-API-CALL-NAME": "GetOrders",
      },
    }
  );
  return data;
}

async function getAllOrders() {}

async function run() {
  const parser = new xml2js.Parser();
  const connection = mysql.createConnection({
    host: "desktop-hv0g29a",
    user: "swift",
    password: "swift",
    database: "readysetaction",
  });
  connection.connect();
  //   const photos = await getPhotosListed(connection);
  //   console.log(photos);
  connection.end();

  const orders = [];
  const response = await getOrders();
  const results = await parser.parseStringPromise(response);
  const { OrderArray, HasMoreOrders } = results.GetOrdersResponse;
  orders.push(...OrderArray[0].Order);
  console.log(orders);
}

run();
// HasMoreOrders
