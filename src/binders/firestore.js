import {
  createRecordFromDoc,
  isFirestoreDoc,
  bindings,
  FirestoreBinding,
  isObject,
  callOnceFn,
  getDocChanges,
} from '../utils/index'

import * as types from '../utils/types'

const commitOptions = { root: true }

function bindCollectionOrQuery ({
  key,
  source,
  onReadyCallback,
  onErrorCallback,
  wait,
  commit,
  state,
  includeMetadataChanges,
}) {
  // Initialise the array to an empty one
  const array = []
  const initializeArray = () => {
    commit(types.VUEXFIRE_ARRAY_INITIALIZE, {
      type: types.VUEXFIRE_ARRAY_INITIALIZE,
      state,
      key,
      value: array,
    }, commitOptions)
  }

  if (!wait) {
    initializeArray()
  } else {
    source.get().then(initializeArray)
  }

  return source.onSnapshot((snapshot) => {
    getDocChanges(snapshot).forEach((change) => {
      switch (change.type) {
        case 'added': {
          commit(types.VUEXFIRE_ARRAY_ADD, {
            type: types.VUEXFIRE_ARRAY_ADD,
            state,
            key,
            index: change.newIndex,
            array: wait && array,
            record: createRecordFromDoc(change.doc),
          }, commitOptions)
          break
        }
        case 'modified': {
          const record = createRecordFromDoc(change.doc)
          commit(types.VUEXFIRE_ARRAY_CHANGE, {
            type: types.VUEXFIRE_ARRAY_CHANGE,
            state,
            key,
            index: change.oldIndex,
            array: wait && array,
            record,
          }, commitOptions)

          if (change.newIndex !== change.oldIndex) {
            commit(types.VUEXFIRE_ARRAY_MOVE, {
              type: types.VUEXFIRE_ARRAY_MOVE,
              state,
              key,
              index: change.oldIndex,
              newIndex: change.newIndex,
              array: wait && array,
              record,
            }, commitOptions)
          }
          break
        }
        case 'removed': {
          commit(types.VUEXFIRE_ARRAY_REMOVE, {
            type: types.VUEXFIRE_ARRAY_REMOVE,
            state,
            key,
            index: change.oldIndex,
            array: wait && array,
          }, commitOptions)
          break
        }
      }
    })
    onReadyCallback(snapshot)
  }, onErrorCallback)
}

function bindDoc ({
  key,
  source,
  onReadyCallback,
  onErrorCallback,
  commit,
  state,
  includeMetadataChanges,
}) {
  return source.onSnapshot({ includeMetadataChanges }, (doc) => {
    commit(types.VUEXFIRE_OBJECT_VALUE, {
      type: types.VUEXFIRE_OBJECT_VALUE,
      key,
      record: createRecordFromDoc(doc),
      state,
    }, commitOptions)
    onReadyCallback(doc)
  }, onErrorCallback)
}

export function bind ({
  state,
  commit,
  key,
  source,
  options: {
    wait = true,
    includeMetadataChanges = false,
  },
}) {
  return new Promise((resolve, reject) => {
    if (!isObject(source)) {
      throw new Error('VuexFire: invalid Firebase binding source.')
    }
    if (!(key in state)) {
      throw new Error(`VuexFire: cannot bind undefined property '${key}'. Define it on the state first.`)
    }

    bindings.delete({ commit, key })

    const onReadyCallback = callOnceFn(resolve)

    let unsubscriber
    if (isFirestoreDoc(source)) {
      unsubscriber = bindDoc({key, source, onReadyCallback, onErrorCallback: reject, commit, state, includeMetadataChanges})
    } else {
      unsubscriber = bindCollectionOrQuery({key, source, onReadyCallback, onErrorCallback: reject, wait, commit, state, includeMetadataChanges})
    }

    bindings.add({ commit, key, binding: new FirestoreBinding(unsubscriber) })
  })
}
