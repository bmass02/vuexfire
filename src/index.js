import * as Firestore from './binders/firestore'
import * as RTDB from './binders/rtdb'

import {
  mutations,
  bindings,
} from './utils/index'

import * as types from './utils/types'

export const firebaseMutations = {}

Object.keys(types).forEach(key => {
  // the { commit, state, type, ...payload } syntax is not supported by buble...
  const type = types[key]
  firebaseMutations[type] = (_, context) => {
    mutations[type](context.state, context)
  }
})

export function firebaseAction (action) {
  return function firebaseEnhancedActionFn (context, payload) {
    // get the local state and commit. These may be bound to a module
    const { state, commit } = context
    context.bindFirebaseRef = (key, source, options = {}) =>
      RTDB.bind({ state, commit, key, source, options })
    context.bindFirestoreRef = (key, source, options = {}) =>
      Firestore.bind({ state, commit, key, source, options })
    context.unbind = (key) =>
      bindings.delete({ commit, key })
    return action(context, payload)
  }
}
