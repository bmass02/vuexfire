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
 * Tests if the provided value if a FirebaseReference
 *
 * @param {FirebaseReference} ref
 * @return {boolean}
 */
export function isFirebaseRef (ref) {
  return ref.hasOwnProperty('key')
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
  res['.path'] = toPath(getRef(snapshot))
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
  data['.path'] = toPath(doc.ref)
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

/**
 * Converts a Firestore DocumentReference to a path (similar to how Firestore stores References)
 *
 * @param {DocumentReference|FirebaseReference} source
 * @return {string}
 */
export function toPath (source) {
  if (!(isFirestoreDoc(source) || isFirebaseRef(source))) {
    throw new Error('Only Firestore DocumentReferences can be converted to a path.')
  }

  const getIdent = isFirebaseRef(source) ? getKey : (doc) => doc.id

  const segments = []
  let stepper = source
  while (stepper) {
    segments.unshift(getIdent(stepper))
    stepper = stepper.parent
  }
  return segments.join('/')
}

/**
 * Returns the DocumentChanges for the snapshot
 *
 * @param {QuerySnapshot} snapshot
 * @return {DocumentChange[]}
 */
export function getDocChanges (snapshot) {
  if (typeof snapshot.docChanges === 'function') {
    return snapshot.docChanges()
  }

  return snapshot.docChanges
}
