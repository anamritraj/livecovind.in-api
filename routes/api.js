var express = require("express");
var router = express.Router();
const axios = require("axios");

let currentData = {
  total: {},
  statewise: {},
  dayChange: {},
  tested: {}
};

let tested = {
  tested: []
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

const fetchStateWiseDataFromSource = () => {
  console.log("Fetching Data from source...");

  axios
    .get("https://api.covid19india.org/data.json")
    .then(result => {
      if (result.status === 200) {
        let data = result.data;
        const stateData = data.statewise;
        let max = 0;
        let min = Infinity;
        let currentDataNew = {
          total: {},
          statewise: {},
          dayChange: {},
          tested: {}
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
        // Assign Current Data
        currentDataNew.total.max = max;
        currentDataNew.total.min = min;
        currentDataNew.dayChange = {
          confirmed: data.key_values[0].confirmeddelta,
          deceased: data.key_values[0].deceaseddelta,
          recovered: data.key_values[0].recovereddelta
        };
        const previousTested =
          data.tested[data.tested.length - 3].totalsamplestested;
        const currentTested =
          data.tested[data.tested.length - 1].totalsamplestested;
        currentDataNew.tested = data.tested[data.tested.length - 1];
        currentDataNew.tested.delta = currentTested - previousTested;
        currentData = currentDataNew;

        // Assign Tested
        tested = data.tested;
      } else {
        console.log("There was an error in the backend api");
      }
    })
    .catch(err => {
      console.log(err);
    });
};

const fetchLiveBlogDataFromSource = index => {
  console.log("Fetching data from backend");
  index = index + 1;
  axios
    .get(
      `https://economictimes.indiatimes.com/etstatic/liveblogs/msid-74765889,callback-liveBlogTypeALL-${index}.htm`
    )
    .then(result => {
      if (result.status === 200) {
        console.log(result.data);
        fetchLiveBlogDataFromSource(index + 1);
      } else {
        console.log("There was an error from backend");
      }
    })
    .catch(err => {
      console.log("There was an error in the API");
    });
};
setInterval(fetchStateWiseDataFromSource, 1000 * 60 * 5);
// fetchLiveBlogDataFromSource(0);
fetchStateWiseDataFromSource();

router.get("/state", function(req, res, next) {
  res.json(currentData);
});

router.get("/tested", function(req, res, next) {
  res.json(tested);
});

module.exports = router;
