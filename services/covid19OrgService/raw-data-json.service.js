const axios = require("axios");

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
let ageBracketsGlobal = {};
let hospitalizedGlobal = {};
let genderGlobal = {};

const fetchRawDataFromSource = () => {
  console.log("fetchRawDataFromSource : Fetching Data from source...");
  return new Promise((resolve, reject) => {
    axios
      .get("https://api.covid19india.org/raw_data.json")
      .then(response => {
        console.log("fetchRawDataFromSource : Got data from source..")
        if (response.status === 200) {
          const raw_data = response.data.raw_data;
          let hospitalizedNew = {};
          let genderNew = {};

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
          });

          resolve({
            ageBrackets: ageBracketsNew,
            hospitalized: hospitalizedNew,
            gender: genderNew
          });
        } else {
          reject({ msg: "Error: fetchRawDataFromSource: There was not a 200 response" });
        }
      })
      .catch(err => {
        reject({ msg: "Error: fetchRawDataFromSource: There was another error", err: err });
      });
  });
};

function callRawDataService() {
  fetchRawDataFromSource().then(({ ageBrackets, hospitalized, gender }) => {
    ageBracketsGlobal = ageBrackets;
    hospitalizedGlobal = hospitalized;
    genderGlobal = gender;

  }).catch(err => {
    console.log(err)
  });
}

callRawDataService();
setInterval(callRawDataService, 1000 * 60 * 7);

const getRawDataStats = () => {
  return {
    hospitalizationStatus: hospitalizedGlobal,
    ageBrackets: ageBracketsGlobal,
    gender: genderGlobal
  }
}

module.exports = {
  getRawDataStats
};
