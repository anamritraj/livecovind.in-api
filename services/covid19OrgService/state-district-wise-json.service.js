/*global process*/
const axios = require("axios");

const stateCodeAndNameMap = require('../stateAndNameMapService').stateCodeAndNameMap;
const { notificationCache } = require('../notifications.service');
const webpush = require('web-push');
const districtDataServiceTimeInterval = parseInt(process.env.STATE_DISTRICT_WISE_TIME_INTERVAL_MINS);
webpush.setVapidDetails(process.env.WEB_PUSH_CONTACT, process.env.PUBLIC_VAPID_KEY, process.env.PRIVATE_VAPID_KEY);

let stateDistrictDataGlobal = {};
let districtNotificationsDiff = {};
let stateWiseNotificationsDiff = {};
let isInitialized = false;

const fetchStateDistrictWiseDataFromSource = () => {
  console.log("fetchStateDistrictWiseDataFromSource: Fetching Data from source...");
  return new Promise((resolve, reject) => {
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

const getAllIndiaDiffDistricts = (isAllDiffCalculated) => {
  let allIndiaDiffDistricts = [];
  return {
    getData: () => {
      if (isAllDiffCalculated === true) {
        return allIndiaDiffDistricts;
      } else {
        let allIndiaDiffDistrictsNew = [];
        for (let stateKey in stateWiseNotificationsDiff) {
          for (let districtKey in stateWiseNotificationsDiff[stateKey]) {
            if (stateWiseNotificationsDiff[stateKey][districtKey] &&
              (stateWiseNotificationsDiff[stateKey][districtKey].current - stateWiseNotificationsDiff[stateKey][districtKey].prev > 0)) {
              allIndiaDiffDistrictsNew.push(stateWiseNotificationsDiff[stateKey][districtKey].name);
            }
          }
        }
        allIndiaDiffDistricts = allIndiaDiffDistrictsNew;
        return allIndiaDiffDistrictsNew;
      }
    }
  }
}

// This function takes care of sending out the notifications
// This is done inside a setInterval to prevent blocking the main thread, since even if these are delayed
// It won't matter much.
const sendNotifications = () => {
  const notifications = notificationCache.getAllFromCache();
  let isAllDiffCalculated = false;
  for (let notificationkey in notifications) {
    const notificationObject = notifications[notificationkey];
    let changedDistricts = [];
    if (notificationObject.payload.keys.includes('all_all')) {
        changedDistricts = getAllIndiaDiffDistricts(isAllDiffCalculated).getData();
        isAllDiffCalculated = true;
    } else {
      const allDoneForState = {};
      notificationObject.payload.keys.forEach((key) => {
        const [stateKey, districtName] = key.split("_");
        if (!allDoneForState[stateKey] && notificationObject.payload.keys.includes(stateKey + '_all')) {
          for (let districtKey in stateWiseNotificationsDiff[stateKey]) {
            if (stateWiseNotificationsDiff[stateKey][districtKey] &&
              (stateWiseNotificationsDiff[stateKey][districtKey].current - stateWiseNotificationsDiff[stateKey][districtKey].prev > 0)) {
              changedDistricts.push(stateWiseNotificationsDiff[stateKey][districtKey].name);
            }
          }
          allDoneForState[stateKey] = true;
        } else if (!allDoneForState[stateKey]) {
          // Check only for the districts which are enabled
          if (stateWiseNotificationsDiff[stateKey][districtName] &&
            (stateWiseNotificationsDiff[stateKey][districtName].current - stateWiseNotificationsDiff[stateKey][districtName].prev > 0)) {
            changedDistricts.push(stateWiseNotificationsDiff[stateKey][districtName].name);
          }
        }
      });
    }
    // TODO: Send the number as well as an update in the notification itself
    if (changedDistricts.length > 0) {
      const payload = JSON.stringify({
        title: 'New cases reported',
        body: `${changedDistricts.join(", ")}`,
      });
      // Send the notification once per user
      setTimeout(() => {
        webpush.sendNotification(notificationObject.subscription, payload)
          .then(() => console.log("Sent Notification Successfully!"))
          .catch(e => {
            // This is where we might get errors if the user has revoked their permissions.
            if (e.statusCode === 410) {
              console.log("Deleting the invalid notification object", e.endpoint);
              notificationCache.removeInvalidSubscription(e.endpoint);
            }
          })
      }, 0);
    }
  }
}

const calculateDiff = () => {
  let districtNotificationsDiffNew = {};
  let stateWiseNotificationsDiffNew = {};
  for (let key in stateDistrictDataGlobal) {
    let diff = {};
    stateWiseNotificationsDiffNew[key] = {};
    for (let districtName in stateDistrictDataGlobal[key].districts) {
      diff = {
        prev: isInitialized && districtNotificationsDiff[key + "_" + districtName] ? districtNotificationsDiff[key + "_" + districtName].current : stateDistrictDataGlobal[key].districts[districtName].confirmed,
        current: stateDistrictDataGlobal[key].districts[districtName].confirmed,
        name: districtName,
        stateName: stateDistrictDataGlobal[key].name
      }
      districtNotificationsDiffNew[key + "_" + districtName] = diff;
      stateWiseNotificationsDiffNew[key][districtName] = diff;
    }
  }
  districtNotificationsDiff = districtNotificationsDiffNew;
  stateWiseNotificationsDiff = stateWiseNotificationsDiffNew;
  isInitialized = true;
}

function callStateDistrictService() {
  fetchStateDistrictWiseDataFromSource().then(({ stateDistrictData }) => {
    stateDistrictDataGlobal = stateDistrictData;
    setTimeout(() => {
      calculateDiff();
    }, 0)
    setTimeout(() => {
      sendNotifications();
    }, 0)
  });
}

callStateDistrictService();
setInterval(callStateDistrictService, 1000 * 60 * districtDataServiceTimeInterval);

const getStateDistrictDataGlobal = () => {
  return stateDistrictDataGlobal
}

module.exports = {
  getStateDistrictDataGlobal
};
