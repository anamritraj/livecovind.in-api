const db = require("./firebase-database-provider").db;

const saveDataToFireBase = (collection, key, data) => {
  let docRef = db.collection(collection).doc(key);

  return docRef.set(data).then(() => {
    console.log("Added data in the database for ", key);
  })
}

const updateDataInFireBase = (collection, key, data) => {
  let docRef = db.collection(collection).doc(key);

  return docRef.update(data).then(() => {
    console.log("Added data in the database for ", key);
  }).catch((err) => {
    console.log(err);
  })
}

const deleteDocumentInFireBase = (collection, key) => {
  db.collection(collection).doc(key).delete();
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

const batchProcessData = (collection, elements) => {
  let batch = db.batch();

  elements.forEach(element => {
    let docRef = db.collection(collection).doc(element.key);
    delete element.data.modified;
    batch.set(docRef, element.data);
  })

  return batch.commit().then(function () {
    console.log("Processed the batch elements writing");
  });
}

const getAllDataFromFirebase = (collection) => {
  const collectionRef = db.collection(collection);

  return new Promise((resolve, reject) => {
    collectionRef.get().then(snapshot => {
      let finalResult = {};
      snapshot.forEach(doc => {
        finalResult[doc.id] = doc.data();
      });
      resolve(finalResult)
    }).catch(err => {
      reject({ reason: err })
    })
  })

}


module.exports = {
  saveDataToFireBase,
  getDataFromFirebase,
  deleteDocumentInFireBase,
  getAllDataFromFirebase,
  updateDataInFireBase,
  batchProcessData
}