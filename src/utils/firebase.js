import {
  isObject,
} from './misc'

/**
 * Returns the key of a Firebase snapshot across SDK versions.
 *
 * @param {FirebaseSnapshot} snapshot
 * @return {string|null}
 */
export function getKey (snapshot) {
  return typeof snapshot.key === 'function'
  /* istanbul ignore next: Firebase 2.x */
    ? snapshot.key()
    : snapshot.key
}

/**
 * Returns the original reference of a Firebase reference or query across SDK
 * versions.
 *
 * @param {FirebaseReference|FirebaseQuery} refOrQuery
 * @return {FirebaseReference}
 */
export function getRef (refOrQuery) {
  /* istanbul ignore else: Fallback */
  /* istanbul ignore next: Firebase 2.x */
  if (typeof refOrQuery.ref === 'function') {
    refOrQuery = refOrQuery.ref()
  } else if (typeof refOrQuery.ref === 'object') {
    refOrQuery = refOrQuery.ref
  }

  return refOrQuery
}

/**
 * Convert firebase snapshot into a bindable data record.
 *
 * @param {FirebaseSnapshot} snapshot
 * @return {Object}
 */
export function createRecord (snapshot) {
  var value = snapshot.val()
  var res = isObject(value)
    ? value
    : { '.value': value }
  res['.key'] = getKey(snapshot)
  return res
}

/**
 * Convert Firestore DocumentSnapshot into a bindable data record.
 *
 * @param {DocumentSnapshot} doc
 * @return {Object}
 */
export function createRecordFromDoc (doc) {
  var data = doc.exists ? doc.data() : Object.create(null)
  data['.id'] = doc.id
  return data
}

/**
 * Tests if source is a Firestore DocumentReference
 *
 * @param {DocumentReference|CollectionReference|Query} source
 * @return {boolean}
 */
export function isFirestoreDoc (source) {
  return 'collection' in source
}

/**
 * Tests if source is a Firestore CollectionReference
 *
 * @param {DocumentReference|CollectionReference|Query} source
 * @return {boolean}
 */
export function isFirestoreCollection (source) {
  return 'doc' in source && typeof source.doc === 'function'
}
