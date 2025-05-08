const mysql = require("mysql");
const fs = require("fs");

function getPhotosListed(connection) {
  return new Promise((resolve, reject) => {
    connection.query(
      "SELECT *, CONCAT('A',LPAD(CONV(row_id,10,36), 6, 0)) as SKU FROM activecolors_photos",
      function (error, results, fields) {
        if (error) throw error;
        resolve([...results]);
      }
    );
  });
}

async function run() {
  const connection = mysql.createConnection({
    host: "192.168.1.98",
    user: "swift",
    password: "swift",
    database: "readysetaction",
  });
  connection.connect();
  const listings = await getPhotosListed(connection);
  const files = fs.readdirSync("/Volumes/pictures/2", {
    flag: "rs",
  });

  const hashes = [
    ...listings.map((l) => l.hash),
    ...files.map((f) => f.split(".")[0]),
  ];

  const hashesTable = {};
  hashes.forEach((hash) => {
    hashesTable[hash] = { diff: undefined, otherHash: undefined };
  });
  function compareToRest(startIndex, str) {
    let leastDiffCount = 9999;
    let mostSimilarIndex;
    if (startIndex === hashes.length) return;
    for (let j = startIndex; j < hashes.length; j++) {
      let nextStr = hashes[j];
      let diffCount = 0;
      for (index in str) {
        diffCount = str[index] === nextStr[index] ? diffCount : diffCount + 1;
        if (diffCount > leastDiffCount) break;
      }
      if (diffCount < leastDiffCount) {
        leastDiffCount = diffCount;
        mostSimilarIndex = j;
      }
    }
    hashesTable[str].diff = leastDiffCount;
    hashesTable[str].otherHash = hashes[mostSimilarIndex];
    hashesTable[hashes[mostSimilarIndex]].diff = leastDiffCount;
    hashesTable[hashes[mostSimilarIndex]].otherHash = str;
  }

  for (let i = 0; i < hashes.length; i++) {
    const str = hashes[i];
    compareToRest(i + 1, str);
  }

  const dupeHashes = new Set();

  const toRemove = [];
  Object.keys(hashesTable).forEach((key) => {
    const { diff, otherHash } = hashesTable[key];
    if (diff < 7) {
      const hash1 = `/Volumes/pictures/compare/${key}.jpg`;
      const rowid1 = listings.find((l) => l.hash === key)?.row_id;
      const itemId1 = listings.find((l) => l.hash === key)?.ebay_item_number;
      const hash2 = `/Volumes/pictures/compare/${otherHash}.jpg`;
      const rowid2 = listings.find((l) => l.hash === otherHash)?.row_id;
      const itemId2 = listings.find(
        (l) => l.hash === otherHash
      )?.ebay_item_number;
      console.log(hash1, itemId1, rowid1);
      console.log(hash2, itemId2, rowid2);
      if ((itemId1 && !itemId2) || (!itemId1 && itemId2)) {
        if (!itemId1) {
          console.log(itemId1, rowid1);
          toRemove.push(rowid1);
        }
        if (!itemId2) {
          console.log(itemId2, rowid2);
          toRemove.push(rowid2);
        }
      }
      console.log("@ @ @ @ @ @ @ @ @");
      dupeHashes.add(key);
      dupeHashes.add(otherHash);
    }
  });
  console.log(`DELETE FROM WHERE row_id IN (${toRemove.join(",")})`);
  console.log("done");
  connection.end();
}

run();
