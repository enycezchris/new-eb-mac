const mysql2 = require("mysql2");
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const { exec } = require("child_process");

const connection = mysql2.createConnection({
  host: "127.0.0.1",
  user: "test",
  password: "example",
  database: "ebay",
});
connection.connect();

function getHash(sku, tableName) {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT hash FROM ${tableName} where row_id = CONV(?,36,10) order by row_id desc;`,
      [sku.replace("/^J/", "")],
      function (error, results, fields) {
        if (error) throw error;
        resolve(results?.[0]?.hash);
      }
    );
  });
}

const app = express();
const port = 3000;

app.set("views", "./");
app.set("view engine", "ejs");

async function addHashes(userOrders, tableName) {
  const usernames = Object.keys(userOrders);
  for (let i = 0; i < usernames.length; i++) {
    const key = usernames[i];
    const items = userOrders[key].items;
    for (let i = 0; i < items.length; i++) {
      const sku = items[i].sku.replace(/^J/, "");
      items[i].hash = await getHash(sku, tableName);
    }
  }
}

const users = {
  greatcurious: {
    cid: "BAQAAAZRXz2gmAAaAAAQADGmrtn1ncmVhdGN1cmlvdXMAEAAMaavAyWdyZWF0Y3VyaW91cwAzAA5pq8DJMTAwMDItMzYyNixVU0EAQAAMaavAyWdyZWF0Y3VyaW91cwCaAA1nzSX9Z3JlYXRjdXJpb3VzZwCcADhpq8DJblkrc0haMlByQm1kajZ3Vm5ZK3NFWjJQckEyZGo2QUZrWVNrRDVhR3BRV2RqNng5blkrc2VRPT0AnQAIaavAyTAwMDAwMDAwAMoAIGuM9EkyN2NiYmYyYzE4ZDBhOWYxOWFmNGY1MGRmZmU5MzBmOADLAANnypRRMTA1AWQAB2uM9EkjMDAwMDhh/69cW1Evr7PGcELBJoDqjxdCBLQ*",
    tableName: "photos",
  },
  // readysetaction: {
  //   cid: "",
  //   tableName: "photos",
  // },
};

app.get("/", async (req, res) => {
  // console.log("reqquery", req.query);
  const { user } = req.query;
  // console.log("user", user);
  const { cid, tableName } = users[user];
  const userOrders = await getUserOrders(cid, req.query);
  // console.log("userOrders", JSON.stringify(userOrders, null, 2));
  await addHashes(userOrders, tableName);
  res.render("./orders.ejs", { userOrders });
});

// CHECK TO SEE IF IMAGE FILE EXISTS, CREATE NEW IF DOESN'T.
app.get("/images/new/:size/:filename", async (req, res) => {
  const { size, filename } = req.params;
  // console.log("reqParams", req.params.filename);

  if (fs.existsSync(`/Volumes/eb/photos/processed/${filename}.tif`)) {
    return 0;
  } else {
    const cmd = `cp /Volumes/eb/photos/processed/${size}.tif /Volumes/eb/photos/processed/${filename}.tif && 
  open -a 'Adobe Photoshop 2024' /Volumes/eb/photos/processed/${filename}.tif`;
    // console.log("cmd", cmd);
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    });

    res.send({});
  }
});

// OPEN IMAGE FILE.
app.get("/images/:filename", async (req, res) => {
  const photoName = req.params.filename;
  exec(
    `open -a 'Adobe Photoshop 2024' /Volumes/eb/photos/processed/${photoName}`,
    (error, stdout, stderr) => {
      if (error) {
        console.log(`error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
    }
  );

  res.send({});
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

async function getUserOrders(cid, query) {
  const files = fs.readdirSync(`/Volumes/eb/photos/processed`);
  const userOrders = {};
  const response = await getOrders(cid, query);
  const { data } = response;
  // console.log("dataaaaaaa", data);
  const $ = cheerio.load(data);
  $("tr[class^=order-info]").each(function () {
    const el = $(this);
    const className = el.attr("class");
    const name = el
      .find(".buyer-modal-trigger-wrapper")
      .children()
      .children()
      .first()
      .text();
    // console.log("name", name);
    const userId = el
      .find(".buyer-modal-trigger-wrapper")
      .children()
      .children()
      .last()
      .text();
    // console.log("userId", userId);
    const orderShipBy = el
      .find(".order-status .sh-bold")
      .text()
      .replace("Ship by ", "");
    const orderId = className.match(/orderid_[-\d]*/g)?.[0];
    const orderNumber = el.find(".order-details a").text();

    const orderDate = el.find("td:nth-child(7) > span").text();

    const foundUser = Object.keys(userOrders).includes(userId);

    if (!foundUser) {
      userOrders[userId] = {
        userId,
        name,
        orderShipBy,
        orderDate,
        orderNumbers: [orderNumber],
        orderIds: [orderId],
        items: [],
      };
      // console.log("not found", userOrders[userId]);
    } else {
      userOrders[userId].orderNumbers.push(orderNumber);
      userOrders[userId].orderIds.push(orderId);
      // console.log("userOrders", userOrders);
    }
  });

  $("tr[class^=item-info],[class^=order-info]").each(async function () {
    const el = $(this);
    const className = el.attr("class");
    const orderId = className.match(/orderid_[-\d]*/g)?.[0];
    console.log("orderId", orderId);
    const sku = el.find(".item-custom-sku-pair .sh-bold").text();
    // console.log("sku", sku)
    const thumbnail = el.find(".img-cell").attr("src");
    const shipBy = el.find(".order-item-status .sh-bold").text();
    const usernames = Object.keys(userOrders);
    // console.log("usernames", usernames);
    for (let i = 0; i < Object.keys(userOrders).length; i++) {
      if (userOrders[usernames[i]].orderIds.includes(orderId)) {
        let findSku = new RegExp(sku, "g");
        const imageFilename = files.find((filename) => findSku.test(filename));
        if (imageFilename) {
          // console.log("filename was found ", findSku, imageFilename);
          // console.log("filename", findSku, imageFilename);
        }
        userOrders[usernames[i]].items.push({
          sku,
          shipBy: shipBy || userOrders[usernames[i]].orderShipBy,
          imageFilename,
          thumbnail,
        });
        // console.log("userOrders", userOrders);
        break;
      }
    }
  });

  $("tr[class^=buyer-note-row]").each(async function () {
    const el = $(this);
    const className = el.attr("class");
    const orderId = className.match(/orderid_[-\d]*/g)?.[0];
    // console.log("orderId", orderId);
    const buyerNote = el.find(".buyer-note").text();
    const usernames = Object.keys(userOrders);
    for (let i = 0; i < Object.keys(userOrders).length; i++) {
      if (userOrders[usernames[i]].orderIds.includes(orderId)) {
        userOrders[usernames[i]].buyerNote = buyerNote;
        break;
      }
    }
  });

  return userOrders;
}

async function getOrders(cid, query) {
  const { all, filter } = query;
  let url = "https://www.ebay.com/sh/ord?limit=200";
  if (all) {
    url += "&filter=status%3ALL_ORDERS";
  }
  // console.log("url", url);
  // console.log("all", all);
  const response = await axios.get(url, {
    headers: {
      accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "en-US,en;q=0.9",
      "cache-control": "no-cache",
      pragma: "no-cache",
      "sec-ch-ua":
        '"Google Chrome";v="117", "Not;A=Brand";v="8", "Chromium";v="117"',
      "sec-ch-ua-full-version": '"117.0.5938.149"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-model": '""',
      "sec-ch-ua-platform": '"macOS"',
      "sec-ch-ua-platform-version": '"14.0.0"',
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "none",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36",
      cookie: `nonsession=${cid}`,
    },
  });
  return response;
}
