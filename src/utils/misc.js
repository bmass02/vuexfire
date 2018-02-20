/**
 * Find the index for an object with given key.
 *
 * @param {array} array
 * @param {string} key
 * @return {number}
 */
export function indexForKey (array, key) {
  for (let i = 0; i < array.length; i++) {
    if (array[i]['.key'] === key) return i
  }
  /* istanbul ignore next: Fallback */
  return -1
}

/**
 * Check if a value is an object.
 *
 * @param {*} val
 * @return {boolean}
 */
export function isObject (val) {
  return Object.prototype.toString.call(val) === '[object Object]'
}

/**
 * Create a wrapper function to ensure passed function is called at most once
 *
 * @param {*} fn Any function to be called only once
 */
export function callOnceFn (fn) {
  if (typeof fn !== 'function') throw new Error('Must pass a function.')

  let callOnce = (...params) => {
    fn(...params)
    callOnce = () => {}
  }
  return callOnce
}
