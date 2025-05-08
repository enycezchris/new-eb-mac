const mysql = require("mysql");
const axios = require("axios");
const fs = require("fs");
const xml2js = require("xml2js");

const EBAY_AUTH_TOKEN = fs.readFileSync(
  "/Users/swong/ebayAuthToken.txt",
  "utf-8"
);

let KILL = false;

process.on("SIGINT", async () => {
  KILL = true;
}); // CTRL+C

const description = `<center>
<h2>
<a href="https://www.ebay.com/sch/i.html?_ssn=activecolors&store_name=activecolors&_oac=1&_dmd=2&_ipg=240">We have moved to a new store! Please click here to see more of our photos!</a>
</h2>
<h2>
<a href="https://www.ebay.com/sch/i.html?_ssn=activecolors&store_name=activecolors&_oac=1&_dmd=2&_ipg=240">We have moved to a new store! Please click here to see more of our photos!</a>
</h2>
<h2>
<a href="https://www.ebay.com/sch/i.html?_ssn=activecolors&store_name=activecolors&_oac=1&_dmd=2&_ipg=240">We have moved to a new store! Please click here to see more of our photos!</a>
</h2>
<br><br>
<font color="brown">
<h2><b>Collectible Art Photograph</b><br>
<br>
<b>Professional Photo Lab Quality / Ultra High Resolution</b><br>
<br>
<b>68 lb Glossy Photo Paper</b></h2>
</font>
<br>
<br>Photograph will be in a protective plastic sleeve, backed by a rigid board<br>
<br>
Shipped via USPS with tracking number, in a discreet plain envelope.<br>
<br>
<font color="green"><i>Listing is marked as Private and your information will only appear to the seller</i></font>
<br>
</center>
<br><i>Image may appear lower resolution on your screen, but the photograph you receive will be high quality</i>
<br>
<br>
<b>This listing fully complies with eBay policies regarding nudity</b> where&nbsp;nude art listings that do not contain sexually suggestive poses or sexual activity are allowed, but must include the item specific attribute <i>Subject: Nudes</i>&nbsp;<div>and can only be listed in the following categories:<br><i>- Art categories<br>
- Collectibles &gt; Paper &gt; Pin Up &gt; Vintage (Pre-1970)<br>- Collectibles &gt; Postcards &gt; Risqué<br>
- Collectibles &gt; Photographic Images &gt; Risqué &gt; Vintage &amp; Antique (Pre-1940)
</i><br><br>This listing complies with the above eBay policies.<br><br>
All models are 18 year or older<br>
Photos are being sold from collectors to collector with no rights transferred.<br>
Buying any photo is not a transfer of rights. Photography is purchased through collectors and sold on a collector basis<br></div>
`;

async function updateDescription(itemId) {
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
              <Description>
              <![CDATA[
                ${description}
              ]]>
              </Description>
              <DescriptionReviseMode>Replace</DescriptionReviseMode> 
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
      "SELECT *, CONCAT('A',LPAD(CONV(row_id,10,36), 6, 0)) as SKU FROM photos WHERE ebay_item_number is not null order by row_id asc;",
      function (error, results, fields) {
        if (error) throw error;
        resolve([...results]);
      }
    );
  });
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
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

  let counter = 0;
  const failed = [];

  for (listing of listings) {
    if (counter < 775) {
      console.log("skipping", counter);
      counter++;
      continue;
    }
    let response;
    try {
      response = await updateDescription(listing.ebay_item_number);
    } catch (err) {
      console.log("err out", listing.ebay_item_number);
      continue;
    }
    const results = await parser.parseStringPromise(response);
    counter += 1;
    console.log(
      counter,
      listing.ebay_item_number,
      results.ReviseItemResponse.Ack?.[0]
    );
    if (results.ReviseItemResponse.Ack?.[0] === "Failure") {
      failed.push(listing.ebay_item_number);
    }
    await sleep(200);
    if (KILL) {
      process.exit();
    }
  }
  console.log(failed);
}

run();
