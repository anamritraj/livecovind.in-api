/*global process*/
const { getAllDataFromFirebase, batchProcessData, deleteDocumentInFireBase } = require('./firebase-service');
const crypto = require('crypto');
const ttl = parseInt(process.env.NOTIFICATIONS_CACHE_WRITE_BACK_INTERVAL_SECONDS);
const collectionName = process.env.NOTIFICATIONS_COLLECTION_NAME;
const moment = require('moment');

const getHash = (key) => {
  const hash = crypto.createHash('sha512');
  hash.update(key);
  return hash.digest('hex');
}

const NotificationCache = (ttl) =>{
  let data  = {};
  // This setInterval takes care of the writeback to the firebase at regular intervals.
  setInterval(() => {
    // This will off load all the data to Firebase
    let dataToWrite = [];
    for(let key in data){
      if(data[key].modified === true){
        let copyToBeSaved = {
          key : key,
          data : data[key]
        };
        delete copyToBeSaved.data.modified;
        copyToBeSaved.data.lastModified = moment().format();
        dataToWrite.push(copyToBeSaved);
        data[key].modified = false;
      }
    }
    if(dataToWrite.length > 0){
      console.log("Offloading the data to the database");
      batchProcessData(collectionName, dataToWrite).catch(err =>{
        console.log(err)
      });
    }else{
      console.log("No modified Candidates");
    }
  }, ttl * 1000)

  return {
    initialize : () => {
      // Get all the data from the database and store it in memory
      // Might not be a good idea, but lets see
      getAllDataFromFirebase(collectionName).then(notifications => {
        console.log("Got notifications from the notifications collection for inMemoryCache");
        for(let key in notifications){
          notifications[key].modified = false;
        }
        data = notifications;
      }).catch(err => {
        console.log(err);
      })
    },
    getAllFromCache : () => {
      return data;
    },
    clearCache :  () => {
      data = [];
    },
    addNotificationPayload : (key, subscriptionToBeAdded) => {
      const newObject = data[key];
      if(!newObject){
        // This means that this is a new Notification, we now need to add this into the cache and also add this into the database
        // Adding it to the database can be done during the normal cycle
        const newObject = {
          ...subscriptionToBeAdded,
          payload: {
            keys: [subscriptionToBeAdded.payload.key]
          },
          modified : true
        }
        data[key] = newObject;
      }else{
        if (newObject.payload.keys.indexOf(subscriptionToBeAdded.payload.key) < 0){
          newObject.payload.keys = [...newObject.payload.keys, subscriptionToBeAdded.payload.key];
          newObject.modified = true;
          data[key] = newObject;
        }
      }
    },
    removeNotificationPayload: (key, subscriptionToBeRemoved) => {
      const newObject = data[key];
      newObject.payload.keys = newObject.payload.keys.filter((el) => el != subscriptionToBeRemoved.payload.key)
      newObject.modified = true;
      data[key] = newObject;
      // console.log(data);
    },
    removeInvalidSubscription :(endpoint) => {
      const key = getHash(endpoint);
      deleteDocumentInFireBase(collectionName, key);
      delete data[key];
    }
  }
};

const notificationCache = NotificationCache(ttl, 1);
notificationCache.initialize();

const saveNotificationEndpointToFireBase = (data) => {
  const key = getHash(data.subscription.endpoint);
  notificationCache.addNotificationPayload(key, data);
}

const removeNotificationEndpointToFireBase = (data) => {
  const key = getHash(data.subscription.endpoint);
  notificationCache.removeNotificationPayload(key, data);

}

module.exports = {
  notificationCache,
  saveNotificationEndpointToFireBase,
  removeNotificationEndpointToFireBase
}