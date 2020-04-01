var express = require("express");
var router = express.Router();
const axios = require("axios");
const moment = require("moment");
const mohfwService = require("../services/mohfw");
let currentData = {
  total: {},
  statewise: {},
  dayChange: {},
  tested: {}
};

let tested = {
  tested: []
};

let indiaTimeSeries = [];

let ageBracketsData = {};
let hospitalized = {};
let gender = {};
let nationality = {};

let stateDistrictData = {};
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
  Lakshadweep: "ld",
  Unknown: "unknown"
};

const fetchStateWiseDataFromSource = () => {
  console.log("Fetching Data from source...");

  axios
    .get("https://api.covid19india.org/data.json")
    .then(result => {
      if (result.status === 200) {
        let data = result.data;
        const stateData = data.statewise;
        let casesTimeSeries = data.cases_time_series;
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
              lastUpdated: moment(
                state.lastupdatedtime,
                "DD/MM/YYYY hh:mm:ss"
              ).toDate()
            };
          } else {
            currentDataNew.statewise[stateCodeAndNameMap[state.state]] = {
              code: stateCodeAndNameMap[state.state],
              name: state.state,
              active: state.active,
              confirmed: state.confirmed,
              deaths: state.deaths,
              delta: state.delta,
              recovered: state.recovered || 0,
              lastUpdated: moment(
                state.lastupdatedtime,
                "DD/MM/YYYY hh:mm:ss"
              ).toDate()
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

        // Very bad hack for now. Very very bad!
        let currentTested =
          data.tested[data.tested.length - 1].totalsamplestested || 0;

        let i = 2;
        while (currentTested == 0) {
          currentTested =
            data.tested[data.tested.length - i].totalsamplestested || 0;
          i++;
        }

        let currentTestedIndex = i;
        let previousTested =
          data.tested[data.tested.length - (i + 1)].totalsamplestested || 0;

        while (previousTested == 0) {
          previousTested =
            data.tested[data.tested.length - i].totalsamplestested || 0;
          i++;
        }
        currentDataNew.tested =
          data.tested[data.tested.length - (currentTestedIndex - 1)];
        currentDataNew.tested.delta = currentTested - previousTested;
        currentData = currentDataNew;
        // Assign Tested
        tested = data.tested;

        // Assign India timeseries data
        casesTimeSeries = casesTimeSeries.map(point => ({
          ...point,
          date: moment(point.date + "2020", "DD MMMM YYYY").format("YYYY-MM-DD")
        }));

        indiaTimeSeries = casesTimeSeries;
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

const extractPatientsStats = raw_data => {
  let ageBracketsNew = {
    "0-7": 0,
    "8-17": 0,
    "18-30": 0,
    "31-45": 0,
    "46-60": 0,
    "61-80": 0,
    ">80": 0,
    unknown: 0
  };

  let hospitalizedNew = {};
  let genderNew = {};
  let nationalityNew = {};

  raw_data.map(patient => {
    // Agebracket
    if (
      parseInt(patient.agebracket) >= 0 &&
      parseInt(patient.agebracket) <= 7
    ) {
      ageBracketsNew["0-7"]++;
    } else if (
      parseInt(patient.agebracket) >= 8 &&
      parseInt(patient.agebracket) <= 17
    ) {
      ageBracketsNew["8-17"]++;
    } else if (
      parseInt(patient.agebracket) >= 18 &&
      parseInt(patient.agebracket) <= 30
    ) {
      ageBracketsNew["18-30"]++;
    } else if (
      parseInt(patient.agebracket) >= 31 &&
      parseInt(patient.agebracket) <= 45
    ) {
      ageBracketsNew["31-45"]++;
    } else if (
      parseInt(patient.agebracket) >= 46 &&
      parseInt(patient.agebracket) <= 60
    ) {
      ageBracketsNew["46-60"]++;
    } else if (
      parseInt(patient.agebracket) >= 61 &&
      parseInt(patient.agebracket) <= 80
    ) {
      ageBracketsNew["61-80"]++;
    } else if (parseInt(patient.agebracket) > 80) {
      ageBracketsNew[">80"]++;
    } else ageBracketsNew["unknown"]++;

    // Gender
    if (patient.gender == "") {
      if (!genderNew["unknown"]) genderNew["unknown"] = 0;
      genderNew["unknown"]++;
    } else {
      if (!genderNew[patient.gender]) genderNew[patient.gender] = 0;
      genderNew[patient.gender]++;
    }

    // currentStatus
    if (patient.currentstatus === "") {
      hospitalizedNew["unknown"] = 0;
      hospitalizedNew["unknown"]++;
    } else {
      if (!hospitalizedNew[patient.currentstatus])
        hospitalizedNew[patient.currentstatus] = 0;
      hospitalizedNew[patient.currentstatus]++;
    }

    // Nationality

    // if (patient.nationality === "India") {
    //   if (!nationalityNew["indian"]) nationalityNew["indian"] = 0;
    //   nationalityNew["indian"]++;
    // } else if (patient.nationality === "") {
    //   if (!nationalityNew["unknown"]) nationalityNew["unknown"] = 0;
    //   nationalityNew["unknown"]++;
    // } else {
    //   if (!nationalityNew["foreign"]) nationalityNew["foreign"] = 0;
    //   nationalityNew["foreign"]++;
    // }
  });

  mohfwService().then(({ totals }) => {
    // MOHFW data
    const indians = totals.cases_domestic;
    const foreign = totals.cases_international;

    // Details awaited for (total - indian - foreign)
    nationalityNew["indian"] = indians;
    nationalityNew["foreign"] = foreign;
    nationalityNew["unknown"] = raw_data.length - indians - foreign;

    ageBracketsData = ageBracketsNew;
    gender = genderNew;
    hospitalized = hospitalizedNew;
    nationality = nationalityNew;
  });
};

const fetchRawDataFromSource = () => {
  console.log("Fetching Raw data from source");
  axios
    .get("https://api.covid19india.org/raw_data.json")
    .then(result => {
      if (result.status === 200) {
        extractPatientsStats(result.data.raw_data);
      }
    })
    .catch(err => {
      console.log(err);
    });
};

const fetchDistrictWiseData = () => {
  axios
    .get("https://api.covid19india.org/state_district_wise.json")
    .then(response => {
      if (response.status === 200) {
        let stateDistrictDataNew = {};
        // Assign each state to a code and send its data
        Object.keys(response.data).forEach(key => {
          Object.keys(response.data[key].districtData).forEach(districtName => {
            delete response.data[key].districtData[districtName][
              "lastupdatedtime"
            ];
          });
          stateDistrictDataNew[stateCodeAndNameMap[key]] = {};
          stateDistrictDataNew[stateCodeAndNameMap[key]].name = key;
          stateDistrictDataNew[stateCodeAndNameMap[key]].districts =
            response.data[key].districtData;
        });
        stateDistrictData = stateDistrictDataNew;
      } else {
        console.log(
          "There was an error in the backend API for district-wise data"
        );
      }
    });
};

fetchRawDataFromSource();
fetchStateWiseDataFromSource();
fetchDistrictWiseData();

setInterval(fetchStateWiseDataFromSource, 1000 * 60 * 4);
setInterval(fetchRawDataFromSource, 1000 * 60 * 7);
setInterval(fetchDistrictWiseData, 1000 * 60 * 3);

router.get("/state", function(req, res, next) {
  res.json(currentData);
});

router.get("/district", function(req, res, next) {
  res.json(stateDistrictData);
});

router.get("/india/timeseries", function(req, res, next) {
  res.json(indiaTimeSeries);
});

router.get("/tested", function(req, res, next) {
  res.json(tested);
});

router.get("/stats", function(req, res, next) {
  res.json({
    hospitalizationStatus: hospitalized,
    ageBrackets: ageBracketsData,
    gender: gender,
    nationality: nationality
  });
});

module.exports = router;
