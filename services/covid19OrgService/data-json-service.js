/*global process*/
const axios = require("axios");
const moment = require("moment");
const momenttz = require("moment-timezone");
const { getDataFromFirebase, saveDataToFireBase } = require("../firebase-service");
const stateCodeAndNameMap = require('../stateAndNameMapService').stateCodeAndNameMap;
const dataServiceTimeInterval = parseInt(process.env.DATA_JSON_TIME_INTERVAL_MINS);

let indiaTimeSeriesGlobal = {};
let testedGlobal = {};
let currentDataGlobal = {
  total: {},
  statewise: {},
  dayChange: {},
  tested: {}
};

const prevDaysStateWiseDataStore = {};

const fetchStateWiseDataFromSource = () => {
  console.log("fetchStateWiseDataFromSource: Fetching Data from source...");
  return new Promise((resolve, reject) => {
    axios
      .get("https://api.covid19india.org/data.json")
      .then(response => {
        if (response.status === 200) {
          let data = response.data;
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
                lastUpdated: momenttz(
                  state.lastupdatedtime,
                  "DD/MM/YYYY hh:mm:ss",
                  "Asia/Calcutta"
                ).format()
              };
              // TODO: Remove this!
              currentDataNew.dayChange = {
                confirmed: state.deltaconfirmed,
                recovered: state.deltarecovered,
                deceased: state.deltadeaths
              }
            } else {
              currentDataNew.statewise[stateCodeAndNameMap[state.state]] = {
                code: stateCodeAndNameMap[state.state],
                name: state.state,
                active: state.active,
                confirmed: state.confirmed,
                deaths: state.deaths,
                delta: {
                  confirmed: parseInt(state.deltaconfirmed),
                  active: parseInt(state.deltaactive),
                  recovered: parseInt(state.deltarecovered),
                  deaths: parseInt(state.deltadeaths)
                },
                recovered: state.recovered || 0,
                lastUpdated: momenttz(
                  state.lastupdatedtime,
                  "DD/MM/YYYY hh:mm:ss",
                  "Asia/Calcutta"
                ).format()
              };
              max =
                parseInt(state.confirmed) > max
                  ? parseInt(state.confirmed)
                  : max;
              min =
                parseInt(state.confirmed) < min
                  ? parseInt(state.confirmed)
                  : min;
            }
          });
          // Assign Current Data
          currentDataNew.total.max = max;
          currentDataNew.total.min = min;

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

          // Assign India timeseries data
          casesTimeSeries = casesTimeSeries.map(point => {
            delete point.death;
            delete point.rec;
            return {
              ...point,
              date: moment(point.date + "2020", "DD MMMM YYYY").format(
                "YYYY-MM-DD"
              )
            };
          });

          // We would also like to save this data into database.
          saveDataJsonIntoFireBase(data);

          resolve({
            indiaTimeSeries: casesTimeSeries,
            casesTimeSeries,
            tested: data.tested,
            currentData: currentDataNew
          });
        } else {
          reject({ msg: "Error: fetchStateWiseDataFromSource: data.json: There was not a 200 response" });
        }
      })
      .catch(err => {
        reject({ msg: "Error: fetchStateWiseDataFromSource: data.json: There was another error", err: err });
      });
  });
};

// This function saves the data into the firebase database
const saveDataJsonIntoFireBase = (data) => {
  console.log("Saving data into firebase database...")
  const stateWiseRaw = data.statewise;
  let currentDataTimeStamp;

  stateWiseRaw.forEach(state => {
    if (state.state === "Total") {
      currentDataTimeStamp = momenttz(
        state.lastupdatedtime,
        "DD/MM/YYYY hh:mm:ss",
        "Asia/Calcutta"
      );
    }
  })

  // Get the time of data generation
  const prevDataTimeStamp = moment(currentDataTimeStamp).subtract(1, "d");
  const prevDayFileName = prevDataTimeStamp.format("DD-MM-YYYY");
  const currentDayFileName = currentDataTimeStamp.format("DD-MM-YYYY");
  let prevDayData;
  // We only want to get the data from firebase if the data is not present in the prevDaysStateWiseDataStore[dayKey]
  if (!prevDaysStateWiseDataStore[prevDayFileName]) {
    console.log("Data is not present inMemory, getting it from Firebase...")
    // Get the data from firebase and store it in the global variable. prevDaysStateWiseDataStore[dayKey]
    // eslint-disable-next-line no-undef
    getDataFromFirebase('stateWiseTimeSeries', prevDayFileName).then((doc) => {
      prevDayData = doc;
      prevDaysStateWiseDataStore[prevDayFileName] = doc;
      saveStateWiseTimeSeriesDataIntoFirebase(prevDayData, currentDayFileName, stateWiseRaw);
    }).catch(err => {
      console.log(err);
    })
  } else {
    prevDayData = prevDaysStateWiseDataStore[prevDayFileName];
    saveStateWiseTimeSeriesDataIntoFirebase(prevDayData, currentDayFileName, stateWiseRaw);
  }
}

const saveStateWiseTimeSeriesDataIntoFirebase = (prevDayData, currentDayFileName, stateWiseRaw) => {
  const stateWiseFinal = {};

  stateWiseRaw.forEach(stateData => {
    try {
      stateWiseFinal[stateCodeAndNameMap[stateData.state]] = {
        name: stateData.state,
        active: stateData.active,
        confirmed: stateData.confirmed,
        deaths: stateData.deaths,
        recovered: stateData.recovered,
        delta: {
          active: stateData.active - prevDayData[stateCodeAndNameMap[stateData.state]].active,
          confirmed: stateData.confirmed - prevDayData[stateCodeAndNameMap[stateData.state]].confirmed,
          recovered: stateData.recovered - prevDayData[stateCodeAndNameMap[stateData.state]].recovered,
          deaths: stateData.deaths - prevDayData[stateCodeAndNameMap[stateData.state]].deaths,
        }
      };
    } catch (err) {
      console.log("There was an error while parsing calculating delta from new and old statewise data");
    }
  });
  // eslint-disable-next-line no-undef
  saveDataToFireBase('stateWiseTimeSeries', currentDayFileName, stateWiseFinal);
}

// This intiates the call to the backend API.
function calldataService() {
  fetchStateWiseDataFromSource().then(({ indiaTimeSeries, tested, currentData }) => {
    console.log("fetchStateWiseDataFromSource : Setting up the global values");
    indiaTimeSeriesGlobal = indiaTimeSeries;
    testedGlobal = tested;
    currentDataGlobal = currentData;
  }).catch((err) => {
    console.log(err);
  })
}
// This handles the calling of services over and over again
calldataService();
setInterval(calldataService, 1000 * 60 * dataServiceTimeInterval);

// Getters exposed to the outer world
const getCurrentData = () => {
  return currentDataGlobal;
}
const getTested = () => {
  return testedGlobal;
}
const getIndiaTimeSeries = () => {
  return indiaTimeSeriesGlobal;
}

module.exports = {
  getIndiaTimeSeries,
  getTested,
  getCurrentData
};
