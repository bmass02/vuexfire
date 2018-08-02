var firebase = require('firebase')
var Firestore = require('@google-cloud/firestore')

exports.invalidFirebaseRefs = [null, undefined, true, false, [], 0, 5, '', 'a', ['hi', 1]]

/* Returns a random alphabetic string of variable length */
exports.generateRandomString = function generateRandomString () {
  const possibleCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const numPossibleCharacters = possibleCharacters.length

  var text = ''
  for (var i = 0; i < 10; i++) {
    text += possibleCharacters.charAt(Math.floor(Math.random() * numPossibleCharacters))
  }

  return text
}

exports.createFirebaseApp = function createFirebaseApp () {
  const _firebase = firebase.initializeApp({
    apiKey: 'AIzaSyC3eBV8N95k_K67GTfPqf67Mk1P-IKcYng',
    authDomain: 'oss-test.firebaseapp.com',
    databaseURL: 'https://oss-test.firebaseio.com',
    storageBucket: 'oss-test.appspot.com',
  })
  const firestore = new Firestore({
    projectId: 'testing-out-firestore',
    keyFileName: '~/.firebase/testing-out-firestore.json',
  })
  _firebase.firestore = function () {
    return firestore
  }
  return _firebase
}

exports.createRef = function createRef (firebaseApp) {
  const firebaseRef = firebaseApp.database().ref().child('vuexfire')
  return new Promise(function (resolve, reject) {
    firebaseRef.remove(function (error) {
      if (error) {
        reject(error)
      } else {
        resolve(firebaseRef.child(exports.generateRandomString()))
      }
    })
  })
}

exports.createCollectionRef = function createCollectionRef (firebaseApp) {
  const db = firebaseApp.firestore()
  const collectionRef = db.collection(exports.generateRandomString())
  return new Promise(function (resolve, reject) {
    exports.deleteCollection(db, collectionRef, 100).then(() => {
      collectionRef.get().then(() => {
        resolve(collectionRef)
      })
    }, reject)
  })
}

/**
 * Delete all docs in Firestore Collection by batchSize
 * @param {Firestore} db
 * @param {CollectionReference} collectionRef
 * @param {number} batchSize
 */
exports.deleteCollection = function deleteCollection (db, collectionRef, batchSize) {
  var query = collectionRef.orderBy('__name__').limit(batchSize)

  return new Promise(function (resolve, reject) {
    deleteQueryBatch(db, query, batchSize, resolve, reject)
  })
}

/**
 * Delete subset of Documents (of size batchSize) from the Collection
 * @param {Firestore} db
 * @param {Query} query
 * @param {number} batchSize
 * @param {Function} resolve
 * @param {Function} reject
 */
function deleteQueryBatch (db, query, batchSize, resolve, reject) {
  query.get()
    .then((snapshot) => {
      // When there are no documents left, we are done
      if (snapshot.size === 0) {
        return 0
      }

      // Delete documents in a batch
      var batch = db.batch()
      snapshot.docs.forEach(function (doc) {
        batch.delete(doc.ref)
      })

      return batch.commit().then(function () {
        return snapshot.size
      })
    }).then(function (numDeleted) {
      if (numDeleted <= batchSize) {
        resolve()
        return
      }

      // Recurse on the next process tick, to avoid
      // exploding the stack.
      process.nextTick(function () {
        deleteQueryBatch(db, query, batchSize, resolve, reject)
      })
    })
    .catch(reject)
}
