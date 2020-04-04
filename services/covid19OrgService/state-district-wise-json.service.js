const axios = require("axios");

const stateCodeAndNameMap = require('../stateAndNameMapService').stateCodeAndNameMap;

let stateDistrictDataGlobal = {};

const fetchStateDistrictWiseDataFromSource = () => {
  console.log("fetchStateDistrictWiseDataFromSource: Fetching Data from source...");
  return new Promise((resolve, reject) => {
    axios
      .get("https://api.covid19india.org/state_district_wise.json")
      .then(response => {
        console.log("Got data from source..")
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

          resolve({
            stateDistrictData: stateDistrictDataNew
          });
        } else {
          reject({ msg: "Error: fetchStateDistrictWiseDataFromSource: There was not a 200 response" });
        }
      })
      .catch(err => {
        reject({ msg: "Error: fetchStateDistrictWiseDataFromSource: There was another error", err: err });
      });
  });
};

function callStateDistrictService() {
  fetchStateDistrictWiseDataFromSource().then(({ stateDistrictData }) => {
    stateDistrictDataGlobal = stateDistrictData;
  });
}

callStateDistrictService();
setInterval(callStateDistrictService, 1000 * 60 * 3);

const getStateDistrictDataGlobal = () => {
  return stateDistrictDataGlobal
}

module.exports = {
  getStateDistrictDataGlobal
};
