const mysql2 = require("mysql2");
const FormData = require("form-data");
const axios = require("axios");
const fs = require("fs");
const xml2js = require("xml2js");

let KILL = false;

process.on("SIGINT", async () => {
  KILL = true;
}); // CTRL+C

console.log("process", process.argv);

const username = process.argv[2];

console.log("username", username);
console.log("process 2", process.argv[2])

const tokens = {
  // username: user token
  "greatcurious": "/Users/wkchris/Desktop/keys/greatcurious-key.txt",
};

console.log("objectKey", Object.keys(tokens));


if (!Object.keys(tokens).includes(username)) {
  console.log("invalid username");
  process.exit();
}

let photosTable = "asian";

// if (username == "enycez-collections") {
//   photosTable = "enycez-collections_photos";
// } else if (username == "readysetaction") {
//   photosTable = "photos";
// }

const EBAY_AUTH_TOKEN = fs.readFileSync(tokens[username], "utf-8");

async function uploadPicture(photo, connection) {
  const formData = new FormData();
  formData.append(
    "XML Payload",
    `
        <?xml version="1.0" encoding="utf-8"?>
        <UploadSiteHostedPicturesRequest xmlns="urn:ebay:apis:eBLBaseComponents">
            <RequesterCredentials>
                <ebl:eBayAuthToken xmlns:ebl="urn:ebay:apis:eBLBaseComponents">${EBAY_AUTH_TOKEN}</ebl:eBayAuthToken>
            </RequesterCredentials>
            <PictureName>${photo.hash}</PictureName>
            <PictureSet>Supersize</PictureSet>
        </UploadSiteHostedPicturesRequest>
    `
  );
  console.log("uploading photo", photo);
  formData.append("file", fs.createReadStream(photo.filepath));
  let res;
  try {
    res = await axios.post("https://api.ebay.com/ws/api.dll", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        "X-EBAY-API-SITEID": "0",
        "X-EBAY-API-COMPATIBILITY-LEVEL": "1217",
        "X-EBAY-API-CALL-NAME": "UploadSiteHostedPictures",
      },
    });
  } catch (err) {
    console.log(`MISSING: ${photo.filepath}`);
    return false;
  }
  const { data } = res;
  const parser = new xml2js.Parser();
  const results = await parser.parseStringPromise(data);
  if (results.UploadSiteHostedPicturesResponse.Ack[0] === "Failure") {
    console.log(JSON.stringify(results, null, 2));
  }

  const responseData = JSON.stringify(
    results.UploadSiteHostedPicturesResponse.SiteHostedPictureDetails[0]
  );

  const ebayPicUrl =
    results.UploadSiteHostedPicturesResponse.SiteHostedPictureDetails[0].FullURL[0].replace(
      /\$_\d*\./,
      "$_57."
    );
  await updatePicUrl(connection, responseData, ebayPicUrl, photo.hash);
  console.log("updated ebay_pic_url ", photo.hash, ebayPicUrl);
  console.log("----------------");
  return true;
}

function getPhotosForUpload(connection) {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT * FROM ${photosTable} WHERE ebay_pic_url IS NULL`,
      function (error, results, fields) {
        if (error) throw error;
        resolve([...results]);
      }
    );
  });
}

function updatePicUrl(connection, responseData, filename, hash) {
  return new Promise((resolve, reject) => {
    connection.query(
      `UPDATE ${photosTable} SET ebay_pic_url = ? WHERE hash = ?`,
      [filename, hash],
      function (error, results, fields) {
        if (error) throw error;
        resolve(results);
      }
    );
  });
}

async function run() {
  const parser = new xml2js.Parser();
  const connection = mysql2.createConnection({
    host: "127.0.0.1",
    user: "test",
    password: "example",
    database: "ebay",
  });
  connection.connect();
  const photos = await getPhotosForUpload(connection);
  let i = 0;
  const ups = [];
  for (const photo of photos) {
    i += 1;
    console.log(i, photos.length);
    ups.push(uploadPicture(photo, connection));
    if (ups.length % 8 === 0 || photos.length - i < 8) {
      await Promise.all(ups);
    }
    if (KILL) {
      console.log("KILL");
      process.exit();
    }
  }
  connection.end();
}

run();
