var express = require("express");
var router = express.Router();
const axios = require("axios");

let currentData = {
  total: {},
  statewise: {},
  dayChange: {}
};

const stateCodeAndNameMap = {
  Totol: "total",
  Maharashtra: "mh",
  Kerala: "kl",
  "Uttar Pradesh": "up",
  Delhi: "dl",
  Rajasthan: "rj",
  Haryana: "hr",
  Telangana: "tg",
  Karnataka: "ka",
  Gujarat: "gj",
  Ladakh: "lh",
  Punjab: "pb",
  "Tamil Nadu": "tn",
  Chandigarh: "ch",
  "Andhra Pradesh": "ap",
  "Jammu and Kashmir": "jk",
  "Madhya Pradesh": "mp",
  "West Bengal": "wb",
  Uttarakhand: "ut",
  Odisha: "or",
  "Himachal Pradesh": "hp",
  Puducherry: "py",
  Chhattisgarh: "ct",
  "Andaman and Nicobar Islands": "an",
  Assam: "as",
  Bihar: "br",
  Meghalaya: "ml",
  Tripura: "tr",
  Goa: "ga",
  "Arunachal Pradesh": "ar",
  Jharkhand: "jh",
  Manipur: "mn",
  Mizoram: "mz",
  Nagaland: "nl",
  Sikkim: "sk",
  "Dadra and Nagar Haveli": "dn",
  "Daman and Diu": "dd",
  Lakshadweep: "ld"
};

const fetchDataFromSource = () => {
  console.log("Fetching Data from source...");

  axios
    .get("https://api.covid19india.org/data.json")
    .then(({ data }) => {
      const stateData = data.statewise;
      let max = 0;
      let min = Infinity;
      let currentDataNew = {
        total: {},
        statewise: {},
        dayChange: {}
      };
      stateData.map(state => {
        if (state.state === "Total") {
          currentDataNew.total = {
            code: stateCodeAndNameMap[state.state],
            name: state.state,
            active: state.active,
            confirmed: state.confirmed,
            deaths: state.deaths,
            recovered: state.recovered || 0,
            lastUpdated: Date.now()
          };
        } else {
          currentDataNew.statewise[stateCodeAndNameMap[state.state]] = {
            code: stateCodeAndNameMap[state.state],
            name: state.state,
            active: state.active,
            confirmed: state.confirmed,
            deaths: state.deaths,
            recovered: state.recovered || 0
          };
          max =
            parseInt(state.confirmed) > max ? parseInt(state.confirmed) : max;
          min =
            parseInt(state.confirmed) < min ? parseInt(state.confirmed) : min;
        }
      });
      currentDataNew.total.max = max;
      currentDataNew.total.min = min;
      currentDataNew.dayChange = {
        confirmed: data.key_values[0].confirmeddelta,
        deceased: data.key_values[0].deceaseddelta,
        recovered: data.key_values[0].recovereddelta
      };
      currentData = currentDataNew;
    })
    .catch(err => {
      console.log(err);
    });
};

setInterval(fetchDataFromSource, 1000 * 60 * 5);
fetchDataFromSource();

router.get("/state", function(req, res, next) {
  res.json(currentData);
});

module.exports = router;
