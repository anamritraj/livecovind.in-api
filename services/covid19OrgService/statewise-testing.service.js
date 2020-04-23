/*global process*/
const axios = require("axios");
const moment =   require('moment');
const stateCodeAndNameMap = require('../stateAndNameMapService').stateCodeAndNameMap;
const stateWiseDataFetchingTimeInterval = process.env.STATE_WISE_TESTING_DATA_FETCHING_TIME_INTERVAL_SECONDS;
let stateWiseTestingGlobal = {};

const fetchStateWiseTestingDataFromSource = () => {
  console.log("fetchStateWiseTestingDataFromSource: Fetching Data from source...");
  return new Promise((resolve, reject) => {
    axios
      .get("https://api.covid19india.org/state_test_data.json")
      .then(response => {
        if (response.status === 200) {
          const stateWiseTestingDataNew = {};

          const statesDataTimeseries = response.data.states_tested_data;
          statesDataTimeseries.forEach((testingData)  => {
            if (!stateWiseTestingDataNew[stateCodeAndNameMap[testingData.state]]){
              stateWiseTestingDataNew[stateCodeAndNameMap[testingData.state]] = testingData;
            }else{
              if (moment(testingData.updatedon, 'DD/MM/YYYY').isAfter(moment(stateWiseTestingDataNew[stateCodeAndNameMap[testingData.state]].updatedon, "DD/MM/YYYY"))){
                stateWiseTestingDataNew[stateCodeAndNameMap[testingData.state]] = testingData;
              }
            }
          });
          resolve({
            data: stateWiseTestingDataNew
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
const getStateWiseTestingGlobal = () => {
  return stateWiseTestingGlobal;
}
fetchStateWiseTestingDataFromSource().then((res) => {
  stateWiseTestingGlobal = res.data;
}).catch(err =>{
  console.log("There was an error in statewise testing service: ", err);
});
setInterval(fetchStateWiseTestingDataFromSource, 1000 * stateWiseDataFetchingTimeInterval);
module.exports = {
  getStateWiseTesting: getStateWiseTestingGlobal
}