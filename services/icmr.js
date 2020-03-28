const pdfService = require("./pdf-parsing");
const pdf = require("pdf-parse");

const cheerio = require("cheerio");
const axios = require("axios");

const URL = "http://icmr.nic.in/node/39071";

const call = async () => {
  console.log("Here inside");
  let response;
  try {
    console.log("Making a call to ", URL);
    response = await axios.get(URL);
  } catch (err) {
    console.log(err);
  }
  if (response && response.status === 200) {
    console.log("Got HTML from ICMR");
    const $ = cheerio.load(response.data);
    $("#node-39071 .directorDetail p a").each((i, el) => {
      try {
        const match = el.children[0].data
          .toString()
          .match(/\b\s*:\s*Status Update\b/g);
        if (match.length) {
          console.log("Matched! ", match);
          console.log(el.attribs.href);
          pdfService
            .getTextFromPDF(el.attribs.href)
            .then(file => {
              let dataBuffer = fs.readFileSync(file);
              pdf(dataBuffer).then(function(data) {
                // Convert the newlines, tabs etc to a whitespace, simplifies the regex rules
                const text = data.text.replace(/[\r\n]+/g, " ");
                const totalPeopleTested = text
                  .match(/[1-9,]*\s\bindividuals have been tested\b/g)[0]
                  .replace(" individuals have been tested", "")
                  .replace(",", "");
                const totalSamplesTaken = text
                  .match(/[1-9,]*\s\bsamples\b/g)[0]
                  .replace(" samples", "")
                  .replace(",", "");

                console.log(totalPeopleTested, totalSamplesTaken);
              });
            })
            .catch(err => {
              console.log(err);
            });
        }
      } catch (err) {
        console.log("Not matched");
      }
    });
  }
  return null;
};

call();
