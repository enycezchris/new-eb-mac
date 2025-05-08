const fs = require("fs");
const { exec } = require("child_process");
const express = require("express");
const app = express();
const PORT = 3001;

app.listen(PORT, () => {
  console.log(`listening on ${PORT}`);
});

const file = fs.readFileSync(`/Users/wkchris/Desktop/photos/processed/e70387f8e84c94f2-C0000Q.tif`);

const photoOpen = ()=>{
    open -a `${file}`;
}

photoOpen();
