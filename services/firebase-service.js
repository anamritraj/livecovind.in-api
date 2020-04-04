const db = require("./firebase-database-provider").db;

const saveDataToFireBase = (collection, key, data) => {
  let docRef = db.collection(collection).doc(key);

  return docRef.set(data).then(() => {
    console.log("Added data in the database for ", key);
  })
}

const getDataFromFirebase = (collection, key) => {
  const collectionRef = db.collection(collection).doc(key);

  return new Promise((resolve, reject) => {
    collectionRef.get().then(doc => {
      if (!doc.exists) {
        reject({
          reason: "There was no document found"
        })
      } else {
        resolve(doc.data())
      }
    }).catch(err => {
      reject({ reason: err })
    })
  })

}


module.exports = {
  saveDataToFireBase,
  getDataFromFirebase
}