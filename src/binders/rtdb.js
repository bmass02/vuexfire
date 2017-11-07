import {
  createRecord,
  getRef,
  indexForKey,
  getKey,
  isObject,
  RTDBBinding,
  bindings,
} from '../utils/index'

import * as types from '../utils/types'

const commitOptions = { root: true }

function bindAsObject ({
  key,
  source,
  cancelCallback,
  commit,
  state,
}) {
  const cb = source.on('value', function (snapshot) {
    commit(types.VUEXFIRE_OBJECT_VALUE, {
      type: types.VUEXFIRE_OBJECT_VALUE,
      key,
      record: createRecord(snapshot),
      state,
    }, commitOptions)
  }, cancelCallback)

  // return the listeners that have been setup
  return { value: cb }
}

function bindAsArray ({
  key,
  source,
  cancelCallback,
  wait,
  commit,
  state,
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
    source.once('value', initializeArray)
  }

  const onAdd = source.on('child_added', function (snapshot, prevKey) {
    const index = prevKey ? indexForKey(array, prevKey) + 1 : 0
    commit(types.VUEXFIRE_ARRAY_ADD, {
      type: types.VUEXFIRE_ARRAY_ADD,
      state,
      key,
      index,
      array: wait && array,
      record: createRecord(snapshot),
    }, commitOptions)
  }, cancelCallback)

  const onRemove = source.on('child_removed', function (snapshot) {
    const index = indexForKey(array, getKey(snapshot))
    commit(types.VUEXFIRE_ARRAY_REMOVE, {
      type: types.VUEXFIRE_ARRAY_REMOVE,
      state,
      key,
      index,
      array: wait && array,
    }, commitOptions)
  }, cancelCallback)

  const onChange = source.on('child_changed', function (snapshot) {
    const index = indexForKey(array, getKey(snapshot))
    commit(types.VUEXFIRE_ARRAY_CHANGE, {
      type: types.VUEXFIRE_ARRAY_CHANGE,
      state,
      key,
      index,
      array: wait && array,
      record: createRecord(snapshot),
    }, commitOptions)
  }, cancelCallback)

  const onMove = source.on('child_moved', function (snapshot, prevKey) {
    const index = indexForKey(array, getKey(snapshot))
    var newIndex = prevKey ? indexForKey(array, prevKey) + 1 : 0
    // TODO refactor + 1
    newIndex += index < newIndex ? -1 : 0
    commit(types.VUEXFIRE_ARRAY_MOVE, {
      type: types.VUEXFIRE_ARRAY_MOVE,
      state,
      key,
      index,
      newIndex,
      array: wait && array,
      record: createRecord(snapshot),
    }, commitOptions)
  }, cancelCallback)

  // return the listeners that have been setup
  return {
    child_added: onAdd,
    child_changed: onChange,
    child_removed: onRemove,
    child_moved: onMove,
  }
}

export function bind ({
  state,
  commit,
  key,
  source,
  options: {
    cancelCallback,
    readyCallback,
    errorCallback,
    wait = true,
  },
}) {
  if (!isObject(source)) {
    throw new Error('VuexFire: invalid Firebase binding source.')
  }
  if (!(key in state)) {
    throw new Error(`VuexFire: cannot bind undefined property '${key}'. Define it on the state first.`)
  }
  // Unbind if it already exists
  let binding = new RTDBBinding(getRef(source))
  bindings.add({ commit, key, binding })

  // Support for SSR
  // We have to listen for the readyCallback first so it
  // gets called after the initializeArray callback
  if (readyCallback || errorCallback) {
    source.once('value', readyCallback, errorCallback)
  }

  // Automatically detects if it should be bound as an array or as an object
  let listener
  if (state[key] && 'length' in state[key]) {
    listener = bindAsArray({ key, source, cancelCallback, wait, commit, state })
  } else {
    listener = bindAsObject({ key, source, cancelCallback, commit, state })
  }

  binding.addListeners(listener)
}
