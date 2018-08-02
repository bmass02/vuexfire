import test from 'ava'
import Vue from 'vue'
import Vuex from 'vuex'
import {
  createCollectionRef,
  createFirebaseApp,
  deleteCollection,
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
      items: [],
    },
    actions: {
      setItemsRef: firebaseAction(({ bindFirestoreRef }, ref) => {
        return bindFirestoreRef('items', ref)
      }),
      unbindItemsRef: firebaseAction(({ unbind }) => {
        unbind('items')
      }),
      bindsWithCallback: firebaseAction(
        ({ bindFirestoreRef }, { ref, readyCallback, wait = false }) => {
          return bindFirestoreRef('items', ref, { readyCallback, wait })
        }
      ),
    },
    mutations: firebaseMutations,
  })

  // Create a fresh ref for the test
  const collectionRef = await createCollectionRef(firebaseApp)
  t.context.ref = collectionRef
})

test.afterEach(async (t) => {
  await deleteCollection(firebaseApp.firestore(), t.context.ref, 100)
})

test('binds an array of documents', async (t) => {
  await t.context.store.dispatch('setItemsRef', t.context.ref)

  const batch = firebaseApp.firestore().batch()
  batch.set(t.context.ref.doc('first'), { index: 0 })
  batch.set(t.context.ref.doc('second'), { index: 1 })
  batch.set(t.context.ref.doc('third'), { index: 2 })
  await batch.commit()
  await t.context.ref.get()

  t.deepEqual(t.context.store.state.items, [
    { '.id': 'first', index: 0 },
    { '.id': 'second', index: 1 },
    { '.id': 'third', index: 2 },
  ])

  await t.context.ref.doc('first').update({
    index: 3,
  })
  await t.context.ref.get()

  t.deepEqual(t.context.store.state.items[0].index, 3)
})

test('removes records from array', async (t) => {
  await t.context.store.dispatch('setItemsRef', t.context.ref)

  const batch = firebaseApp.firestore().batch()
  batch.set(t.context.ref.doc('first'), { index: 0 })
  batch.set(t.context.ref.doc('second'), { index: 1 })
  batch.set(t.context.ref.doc('third'), { index: 2 })
  await batch.commit()
  await t.context.ref.get()

  t.deepEqual(t.context.store.state.items, [
    { '.id': 'first', index: 0 },
    { '.id': 'second', index: 1 },
    { '.id': 'third', index: 2 },
  ])

  await t.context.ref.doc('second').delete()
  await t.context.ref.get()

  t.deepEqual(t.context.store.state.items, [
    { '.id': 'first', index: 0 },
    { '.id': 'third', index: 2 },
  ])
})

test('maintains order of query', async (t) => {
  await t.context.store.dispatch('setItemsRef', t.context.ref.orderBy('index', 'asc'))

  const batch = firebaseApp.firestore().batch()
  batch.set(t.context.ref.doc('first'), { index: 2 })
  batch.set(t.context.ref.doc('second'), { index: 1 })
  batch.set(t.context.ref.doc('third'), { index: 3 })
  await batch.commit()
  await t.context.ref.get()

  t.deepEqual(t.context.store.state.items, [
    { '.id': 'second', index: 1 },
    { '.id': 'first', index: 2 },
    { '.id': 'third', index: 3 },
  ])

  await t.context.ref.doc('third').update({
    index: 0,
  })
  await t.context.ref.get()

  t.deepEqual(t.context.store.state.items, [
    { '.id': 'third', index: 0 },
    { '.id': 'second', index: 1 },
    { '.id': 'first', index: 2 },
  ])
})

// Can't run until issue fixed with Firestore NodeJS
// test('maintains limit of query', async (t) => {
//   const batch = firebaseApp.firestore().batch()
//   batch.set(t.context.ref.doc('first'), { index: 2 })
//   batch.set(t.context.ref.doc('second'), { index: 1 })
//   batch.set(t.context.ref.doc('third'), { index: 3 })
//   await batch.commit()
//   await t.context.ref.get()

//   t.context.store.dispatch('setItemsRef', t.context.ref.orderBy('index').limit(2))

//   await t.context.ref.get()

//   t.deepEqual(t.context.store.state.items, [
//     { '.id': 'third', index: 3 },
//     { '.id': 'first', index: 2 },
//   ])

//   await t.context.ref.doc('third').update({
//     index: 0,
//   })
//   await t.context.ref.get()

//   t.deepEqual(t.context.store.state.items, [
//     { '.id': 'first', index: 2 },
//     { '.id': 'second', index: 1 },
//   ])
// })

test('adds records that fall into query range', async (t) => {
  t.context.store.dispatch('setItemsRef', t.context.ref.where('index', '>=', 2).orderBy('index', 'asc'))

  const batch = firebaseApp.firestore().batch()
  batch.set(t.context.ref.doc('first'), { index: 2 })
  batch.set(t.context.ref.doc('second'), { index: 1 })
  batch.set(t.context.ref.doc('third'), { index: 3 })
  await batch.commit()
  await t.context.ref.get()

  t.deepEqual(t.context.store.state.items, [
    { '.id': 'first', index: 2 },
    { '.id': 'third', index: 3 },
  ])

  await t.context.ref.doc('second').update({
    index: 3,
  })
  await t.context.ref.get()

  t.deepEqual(t.context.store.state.items, [
    { '.id': 'first', index: 2 },
    { '.id': 'second', index: 3 },
    { '.id': 'third', index: 3 },
  ])
})

test('removes records that fall out of query range', async (t) => {
  t.context.store.dispatch('setItemsRef', t.context.ref.where('index', '<=', 2).orderBy('index', 'asc'))

  const batch = firebaseApp.firestore().batch()
  batch.set(t.context.ref.doc('first'), { index: 2 })
  batch.set(t.context.ref.doc('second'), { index: 1 })
  batch.set(t.context.ref.doc('third'), { index: 3 })
  await batch.commit()
  await t.context.ref.get()

  t.deepEqual(t.context.store.state.items, [
    { '.id': 'second', index: 1 },
    { '.id': 'first', index: 2 },
  ])

  await t.context.ref.doc('second').update({
    index: 3,
  })
  await t.context.ref.get()

  t.deepEqual(t.context.store.state.items, [
    { '.id': 'first', index: 2 },
  ])
})
