const axios = require("axios");
const fs = require("fs");
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = "0";

const getTextFromPDF = url => {
  console.log("Getting text from PDF");
  return new Promise((resolve, reject) => {
    axios({
      method: "get",
      rejectUnauthorized: false,
      url: url,
      responseType: "stream"
    })
      .then(function(response) {
        console.log("Got the file from server!");
        response.data.pipe(fs.createWriteStream("test.pdf"));
        response.data.on("end", function() {
          console.log("File written successfully!");
          resolve("test.pdf");
        });
      })
      .catch(err => {
        console.log(err);
        reject(
          "There was an error in saving the pdf file or getting the pdf file from remote server"
        );
      });
  });
};

module.exports = {
  getTextFromPDF
};
