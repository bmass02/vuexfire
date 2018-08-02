import test from 'ava'
import Vue from 'vue'
import Vuex from 'vuex'
import {
  createCollectionRef,
  createFirebaseApp,
} from './helpers/firebase'

import {
  firebaseMutations,
  firebaseAction,
} from '../src'

const firebaseApp = createFirebaseApp()

test.before(t => {
  Vue.use(Vuex)
})

test.beforeEach(async (t) => {
  t.context.store = new Vuex.Store({
    state: {
      options: null,
      primitive: null,
    },
    actions: {
      setPrimitiveRef: firebaseAction(({ bindFirestoreRef }, ref) => {
        bindFirestoreRef('primitive', ref)
      }),
      setOptionsRef: firebaseAction(({ bindFirestoreRef }, ref) => {
        bindFirestoreRef('options', ref)
      }),
      unbindOptionsRef: firebaseAction(({ unbind }) => {
        unbind('options')
      }),
    },
    mutations: firebaseMutations,
  })

  // Create a fresh ref for the test
  const collectionRef = await createCollectionRef(firebaseApp)
  t.context.ref = collectionRef.doc('vuexfire')
})

test('binds doc to state', async (t) => {
  t.context.store.dispatch('setOptionsRef', t.context.ref)
  await t.context.ref.set({
    key: 'key1',
    array: [
      '1',
      '2',
    ],
    object: {
      nestedKey: 'key2',
    },
  })
  await t.context.ref.get()

  t.deepEqual(t.context.store.state.options, {
    '.id': t.context.ref.id,
    key: 'key1',
    array: [
      '1',
      '2',
    ],
    object: {
      nestedKey: 'key2',
    },
  })
})
