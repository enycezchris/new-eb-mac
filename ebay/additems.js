const { DateTime } = require("luxon");
const mysql2 = require("mysql2");
const FormData = require("form-data");
const axios = require("axios");
const fs = require("fs");
const xml2js = require("xml2js");

const dt = DateTime.fromObject(
  {
    year: 2023,
    month: 12,
    day: 22,
    hour: 12,
    minute: 0,
  },
  { zone: "America/New_York" }
);

const username = process.argv[2];
const listingType = process.argv[3];
const isInstant = process.argv[4] === "true";

let pid;
let listingDuration;
let typeListing;
let startingPrice;
let isAuction;
let isScheduled;
let binPrice;
let loopTime;

let numOfImages = 2;

if (listingType === "bin") {
  pid = 241812459017;
  listingDuration = "GTC";
  typeListing = "FixedPriceItem";
  startingPrice = "7.99";
  isAuction = 0;
  isScheduled = false;
  loopTime = 3 * 60 * 1000;
} else if (listingType === "auction") {
  pid = 0;
  listingDuration = "Days_5";
  typeListing = "Chinese";
  startingPrice = "7.95";
  isAuction = 1;
  isScheduled = true;
  loopTime = 1 * 60 * 1000;
} else {
  console.log("listingType invalid");
  process.exit();
}

if (isInstant) {
  console.log("instant list");
  loopTime = 0;
  numOfImages = 5;
}

let EBAY_AUTH_TOKEN;
let data;

if (username === "greatcurious") {
  EBAY_AUTH_TOKEN = fs.readFileSync(
    "/Users/wkchris/Desktop/keys/greatcurious-key.txt"
  );
  data = {
    photosTable: "asian",
    locationZipCode: 11354,
    paymentId: pid,
    returnId: 241812461017,
    shippingId: 242346092017,
    galleryViewLink: "https://www.ebay.com/str/activecolors?_sop=10&_ipg=240",
  };
} else {
  // fs.readFileSync(
  //   "/Users/swong/ebayAuthToken.txt",
  //   "utf-8"
  // );
  process.exit();
}

function getBinPrice() {
  return isAuction
    ? // `<BuyItNowPrice currencyID="USD">${binPrice}</BuyItNowPrice>`
      ""
    : "";
}

let KILL = false;
let SIGINT_COUNT = 0;

process.on("SIGINT", async () => {
  SIGINT_COUNT += 1;
  KILL = true;
  console.log("SIGINT_COUNT, KILL ON 3", SIGINT_COUNT);
  if (SIGINT_COUNT > 2) {
    process.exit();
  }
}); // CTRL+C

let startMinutes = 0;

function generateAddItemsRequest(products) {
  const items = products.map((product) => {
    const scheduleTag = `<ScheduleTime>${dt
      .plus({ minutes: startMinutes })
      .toUTC()
      .toISO()}</ScheduleTime>`;
    startMinutes += 3;
    console.log(`Scheduled for ${scheduleTag}`);

    const { title, imgUrl, isAdult, SKU, description, categoryId, notes, model_name } =
      product;
    const isNonNude = notes === "nonnude";

    let nudeTag =
      Math.random() < 0.25 ? "<Value>Brunette Model Nudes</Value>" : "<Value>Pinup Model Artistic Nudes</Value>";
    if (isNonNude) nudeTag = "";

    console.log("isNonNude", isNonNude);
    console.log(nudeTag, SKU);

    return `<AddItemRequestContainer>
        <MessageID>${SKU}</MessageID>
        <Item>
            ${isScheduled ? scheduleTag : ""}
            <AutoPay>true</AutoPay>
            <Country>US</Country>
            <Currency>USD</Currency>
            <ListingDetails>
                <HasReservePrice>false</HasReservePrice>
            </ListingDetails>
            ${getBinPrice()}
            <StartPrice>${startingPrice}</StartPrice>
            <ListingDuration>${listingDuration}</ListingDuration>
            <ListingType>${typeListing}</ListingType>
            <Location>New York, New York</Location>
            <PrimaryCategory>
                <CategoryID>${categoryId}</CategoryID>
            </PrimaryCategory>
            <ItemSpecifics>
            <NameValueList>
              <Name>Type</Name>
              <Value>Photograph</Value>
            </NameValueList>
            <NameValueList>
              <Name>Size</Name>
              <Value>8 x 10 in</Value>
            </NameValueList>
            <NameValueList>
              <Name>Finish</Name>
              <Value>Glossy</Value>
            </NameValueList>
            <NameValueList>
                <Name>Subject</Name>
                ${isAdult ? nudeTag : ""}
            </NameValueList>
            <NameValueList>
                <Name>Theme</Name>
                <Value>Art</Value>
                <Value>Risqué</Value>
            </NameValueList>
            </ItemSpecifics>
            <PrivateListing>true</PrivateListing>
            <Quantity>1</Quantity>
            <ShippingDetails>
            <ApplyShippingDiscount>false</ApplyShippingDiscount>
            <CalculatedShippingRate>
              <OriginatingPostalCode>${
                data.locationZipCode
              }</OriginatingPostalCode>
              <PackageDepth measurementSystem="English" unit="inches">1</PackageDepth>
              <PackageLength measurementSystem="English" unit="inches">12</PackageLength>
              <PackageWidth measurementSystem="English" unit="inches">10</PackageWidth>
              <PackagingHandlingCosts currencyID="USD">0.0</PackagingHandlingCosts>
              <ShippingIrregular>false</ShippingIrregular>
              <ShippingPackage>PackageThickEnvelope</ShippingPackage>
              <WeightMajor measurementSystem="English" unit="lbs">0</WeightMajor>
              <WeightMinor measurementSystem="English" unit="oz">3</WeightMinor>
            </CalculatedShippingRate>
            <SalesTax>
              <SalesTaxPercent>0.0</SalesTaxPercent>
              <ShippingIncludedInTax>false</ShippingIncludedInTax>
            </SalesTax>
            <ShippingServiceOptions>
              <ShippingService>USPSParcel</ShippingService>
              <ShippingServicePriority>1</ShippingServicePriority>
              <ExpeditedService>false</ExpeditedService>
              <ShippingTimeMin>2</ShippingTimeMin>
              <ShippingTimeMax>5</ShippingTimeMax>
            </ShippingServiceOptions>
            <ShippingType>Calculated</ShippingType>
            <ThirdPartyCheckout>false</ThirdPartyCheckout>
            <ShippingDiscountProfileID>0</ShippingDiscountProfileID>
            <InternationalShippingDiscountProfileID>0</InternationalShippingDiscountProfileID>
            <SellerExcludeShipToLocationsPreference>true</SellerExcludeShipToLocationsPreference>
          </ShippingDetails>
            <ShipToLocations>US</ShipToLocations>
            <Site>US</Site>

            <Title>${title}</Title>
            <LocationDefaulted>true</LocationDefaulted>
            <BuyerResponsibleForShipping>false</BuyerResponsibleForShipping>
            <SKU>${SKU}</SKU>
            <PostalCode>${data.locationZipCode}</PostalCode>
            <PictureDetails>
                <GalleryType>Gallery</GalleryType>
                <PhotoDisplay>PicturePack</PhotoDisplay>
                <PictureURL>
                ${imgUrl}
                </PictureURL>
            </PictureDetails>
            <Description>
                <![CDATA[
                    ${description}
                ]]>
            </Description>
            <DispatchTimeMax>2</DispatchTimeMax>
            <ReturnPolicy>
              <ReturnsAcceptedOption>ReturnsAccepted</ReturnsAcceptedOption>
              <RefundOption>MoneyBack</RefundOption>
              <ReturnsWithinOption>Days_30</ReturnsWithinOption>
              <ShippingCostPaidByOption>Buyer</ShippingCostPaidByOption>
            </ReturnPolicy>
            <ConditionID>1000</ConditionID>
            <ConditionDisplayName>New</ConditionDisplayName>
            <PostCheckoutExperienceEnabled>false</PostCheckoutExperienceEnabled>
            <SellerProfiles>
                <SellerShippingProfile>
                    <ShippingProfileID>${data.shippingId}</ShippingProfileID>
                    <ShippingProfileName>USPS_Ground_Advantage</ShippingProfileName>
                </SellerShippingProfile>
                <SellerReturnProfile>
                    <ReturnProfileID>${data.returnId}</ReturnProfileID>
                    <ReturnProfileName>No Return Accepted (230807298026)</ReturnProfileName>
                </SellerReturnProfile>
                <SellerPaymentProfile>
                    <PaymentProfileID>${data.paymentId}</PaymentProfileID>
                </SellerPaymentProfile>
            </SellerProfiles>
            <ShippingPackageDetails>
                <PackageDepth measurementSystem="English" unit="inches">1</PackageDepth>
                <PackageLength measurementSystem="English" unit="inches">12</PackageLength>
                <PackageWidth measurementSystem="English" unit="inches">10</PackageWidth>
                <ShippingIrregular>false</ShippingIrregular>
                <ShippingPackage>PackageThickEnvelope</ShippingPackage>
                <WeightMajor measurementSystem="English" unit="lbs">0</WeightMajor>
                <WeightMinor measurementSystem="English" unit="oz">3</WeightMinor>
            </ShippingPackageDetails>
            <HideFromSearch>false</HideFromSearch>
            <OutOfStockControl>true</OutOfStockControl>
            <eBayPlus>false</eBayPlus>
            <eBayPlusEligible>false</eBayPlusEligible>
            <IsSecureDescription>true</IsSecureDescription>
        </Item>
    </AddItemRequestContainer>`;
  });

  return `<?xml version="1.0" encoding="utf-8"?>
        <AddItemsRequest xmlns="urn:ebay:apis:eBLBaseComponents">
            <RequesterCredentials>
            <eBayAuthToken>${EBAY_AUTH_TOKEN}</eBayAuthToken>
            </RequesterCredentials>
            <Version>1217</Version>
            <ErrorLanguage>en_US</ErrorLanguage>
            <WarningLevel>High</WarningLevel>
            ${items.join("")}
        </AddItemsRequest>`;
}

const description = `
<div>
<center>
<font color="orange">
<h1>Beautiful Photos of Models in 8x10!</h1>
<br>
<br>
<h1>Follow to browse other models in the store!</h1>
</font>
<br>
<br>
<font color="red">
<h1>FREE SHIPPING ON ALL ORDERS $20+.</h1>
</font>
<font color="olive">
<h1><a href="https://www.ebay.com/sme/greatcurious/Free-shipping-on-orders-over-20/so.html?_soffType=PromotionalShipping&_soffid=13310274609">Check out my other items!</a></h1>
<h1>
<b>Professional Grade Glossy Photo Paper</b>
<br>
<br>
<b>Ultra High Resolution Photographs</b>
</h1>
</font>
<br>
<font color="magenta">
<b>All orders will be shipped securely with a sleeve, and protective box to ensure there will be no damage during shipping.</b>
<br>
<br>
<b>Orders will be shipped discreetly to ensure privacy with a provided USPS tracking number.</b>
</font>
<br>
<br>
<font color="red">
<b><i>Listing will be private to ensure complete privacy.</i></b>
</font>
<br>
</center>
<br>
<font color="green">
<i>This listing fully complies with eBay policies regarding nudity where nude art listings that do not contain sexually suggestive poses or sexual activity are allowed.</i>
<i>This listing complies with the above eBay policies.</i>
</font>
<br>
<br>
<font color="maroon">
<h2>IMPORTANT</h2>
</font>
<br>
<br>
<font color="blue">
<b><i>All models are 18 year or older.</i></b>
<br>
<b><i>Purchase of any photos does not give or imply a transfer of rights.</i></b>
<br>
<b>All photos are from collector to collector.</b>
<br>
<br>
</div>`;

function intToAlphanumeric(integer) {
  return integer.toString(36).toUpperCase().padStart(6, "0");
}

function alphanumericToInt(alphanumeric) {
  return parseInt(alphanumeric, 36);
}

async function addItems(products) {
  const req = generateAddItemsRequest(products);
  const { data } = await axios.post("https://api.ebay.com/ws/api.dll", req, {
    headers: {
      "Content-Type": "text/xml",
      "X-EBAY-API-SITEID": "0",
      "X-EBAY-API-COMPATIBILITY-LEVEL": "1217",
      "X-EBAY-API-CALL-NAME": "AddItems",
    },
  });
  return data;
}

function getPhotosToCreateListing(connection, isNude) {
  return new Promise((resolve, reject) => {
    connection.query(
      // HASH the row_id from base 10 to 36 and add "ITEM" to the front. Example: ITEM____hashedrowID
      `SELECT *,CONCAT('J',LPAD(CONV(row_id,10,36), 5, 0)) as SKU FROM ${data.photosTable} WHERE ebay_item_number IS NULL AND isNude = ? AND ebay_pic_url IS NOT NULL;`,
      [isNude],
      function (error, results, fields) {
        if (error) throw error;
        resolve([...results]);
      }
    );
  });
}

function updateEbayResponse(connection, itemId, isAuction, rowId) {
  return new Promise((resolve, reject) => {
    connection.query(
      `UPDATE ${data.photosTable} SET ebay_item_number = ?, isAuction = ? WHERE row_id = ?`,
      [itemId, isAuction, rowId],
      function (error, results, fields) {
        if (error) throw error;
        resolve(results);
      }
    );
  });
}

function createListingDataForPhoto(photo) {
  const titleWords = [
    "Beautiful",
    "Glamor",
    "Glossy Photo",
    "Sexy",
    "Busty",
    "Pinup Girl",
    "Model",
  ];
  const { SKU, notes } = photo;
  let title = `8x10 ${titleWords
    .sort(() => Math.random() - 0.5)
    .join(" ")} ${SKU}`;
  if (photo.model_name) {
    title = `8x10 FINE ART PHOTO ASIAN MODEL PHOTOGRAPH ${photo.model_name} ${SKU}`;
  } else if (photo.notes === "FineArt") {
    title = `8x10 Glossy Photo Fine Art Beautiful Sexy Female Model  ${SKU}`;
  } else if (photo.notes === "nonnude") {
    title = `8x10 ${titleWords
      .sort(() => Math.random() - 0.5)
      .join(" ")} ${SKU}`;
  }
  if (title.length > 80) {
    console.log("title length:", title.length);
    console.log("TITLE TOO LONG", title);
    process.exit();
  }
  const imgUrl = photo.ebay_pic_url;
  return {
    title,
    isAdult: photo.isNude,
    SKU,
    description,
    imgUrl,
    notes,
  };
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

let bit = true;

async function run(connection) {
  const parser = new xml2js.Parser();
  const photosToCreateListing = await getPhotosToCreateListing(connection, 1);

  const listingData = photosToCreateListing.map((photo) => {
    bit = !bit;
    // return {
    //   ...createListingDataForPhoto(photo),
    //   categoryId: bit ? 262421 : 2211,
    // };
    return {
      ...createListingDataForPhoto(photo),
      categoryId: 262421,
    };
  });

  console.log(`Adding ${photosToCreateListing.length} items`);
  let startIndex = 0;
  let endIndex = numOfImages;
  while (startIndex < listingData.length) {
    const listingSet = listingData.slice(startIndex, endIndex);
    const ebayAddItemResponse = await addItems(listingSet);

    startIndex += numOfImages;
    endIndex += numOfImages;
    console.log(`Added items ${listingSet.map((l) => l.title)}`);
    console.log(`Added items ${listingSet.map((l) => l.isAdult)}`);
    console.log(`Added items ${listingSet.map((l) => l.SKU)}`);
    console.log(`Added items ${listingSet.map((l) => l.categoryId)}`);
    const results = await parser.parseStringPromise(ebayAddItemResponse);

    if (results.AddItemsResponse.Ack[0] === "Failure") {
      console.log(JSON.stringify(results, null, 2));
      // console.log(listingSet);
    }

    for (newItem of results.AddItemsResponse.AddItemResponseContainer) {
      let ebayItemNum;
      try {
        ebayItemNum = newItem.ItemID[0];
      } catch (err) {
        console.log(err);
        console.log(JSON.stringify(ebayAddItemResponse, null, 2));
      }
      const rowId = alphanumericToInt(newItem.CorrelationID[0].substring(1));
      console.log(`Saving row_id ${rowId} ${newItem.CorrelationID[0]}`);
      await updateEbayResponse(connection, ebayItemNum, isAuction, rowId);
      console.log(`Saved item number ${ebayItemNum} to ${rowId}`);
    }
    console.log(
      "waiting... ",
      loopTime,
      DateTime.now().setZone("America/New_York")
    );
    await sleep(loopTime);
    if (KILL) {
      console.log("KILL");
      process.exit();
    }
  }
  console.log("done");
  process.exit();
}

async function loop() {
  const pool = mysql2.createPool({
    connectionLimit: 3,
    host: "127.0.0.1",
    user: "test",
    password: "example",
    database: "ebay",
  });
  pool.getConnection(async function (err, connection) {
    if (err) throw err; // not connected!
    await run(connection);
    const dateTimeObject = new Date();
    console.log(`Date: ${dateTimeObject.toDateString()}`);
    console.log(`Time: ${dateTimeObject.toTimeString()}`);
    console.log(
      `RUN ${i} TIMES OVER TIME: ${new Date(i * WAIT_SEC * 1000)
        .toISOString()
        .slice(11, 19)}`
    );
    console.log("----------------------------");
    await run(connection);
  });
}

loop();
