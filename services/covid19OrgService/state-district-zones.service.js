/*global process*/
const axios = require("axios");
const { stateCodeAndNameMap } = require('../stateAndNameMapService');
const stateDistrictWiseZoneDataInterval = parseInt(process.env.STATE_DISTRICT_ZONES_DATA_TIME_INTERVAL_MINS) || 30;
const stateDistrictWiseZoneDataCollectionName = process.env.STATE_DISTRICT_ZONES_COLLECTION_NAME;
const { saveDataToFireBase} = require("../firebase-service");


let stateDistrictZonesDataGlobal = {};
const momenttz = require('moment-timezone');

const zoneMap = {
  "Green": "G",
  "Orange": "O",
  "Red": "R"
}

const fetchStateDistrictWiseZoneDataFromSource = () => {
  console.log("fetchStateDistrictWiseZoneDataFromSource: Fetching Data from source...");
  return new Promise((resolve, reject) => {
    axios
      .get("https://api.covid19india.org/zones.json")
      .then(response => {
        if (response.status === 200) {
          if (response && response.data) {
            let stateDistrictZonesDataNew = response.data.zones;
            let stateDistrictZonesDataResult = {}
            stateDistrictZonesDataNew.forEach(districtData => {
              if (!stateDistrictZonesDataResult[stateCodeAndNameMap[districtData.state]]) {
                stateDistrictZonesDataResult[stateCodeAndNameMap[districtData.state]] = {};
              }
              stateDistrictZonesDataResult[stateCodeAndNameMap[districtData.state]][districtData.district] = {
                zone: zoneMap[districtData.zone],
                updated: districtData.lastupdated
              }
            });
            resolve({
              stateDistrictZonesData: stateDistrictZonesDataResult,
              rawData: response.data.zones
            });
          } else {
            reject({ msg: 'Err' });
          }

        } else {
          reject({ msg: "Error: fetchStateDistrictWiseZoneDataFromSource: There was not a 200 response" });
        }
      })
      .catch(err => {
        reject({ msg: "Error: fetchStateDistrictWiseZoneDataFromSource: There was another error", err: err });
      });
  });
};

function callStateDistrictZonesService() {
  fetchStateDistrictWiseZoneDataFromSource().then(({ stateDistrictZonesData, rawData }) => {
    stateDistrictZonesDataGlobal = stateDistrictZonesData;
    saveStateDistrictWiseZoneDataIntoFirebase(rawData);
  }).catch((err) =>{
    console.log(err);
    // TODO, fetch the latest fresh data from firebase.
  });
}

function saveStateDistrictWiseZoneDataIntoFirebase(rawData){
  const currentDate = momenttz(new Date(), "DD-MM-YYYY", "Asia/Calcutta").format("DD-MM-YYYY");
  saveDataToFireBase(stateDistrictWiseZoneDataCollectionName, currentDate, {zones: rawData});
}

// This handles the calling of services over and over again
callStateDistrictZonesService();
setInterval(callStateDistrictZonesService, 1000 * 60 * stateDistrictWiseZoneDataInterval);

// Getters exposed to the outer world
const getStateDistrictZonesDataGlobal = () => {
  return stateDistrictZonesDataGlobal;
}

module.exports = {
  getStateDistrictZonesDataGlobal
};
