import { load } from './lib/load-data.js'
import { httpMiddleware } from './lib/http-middleware.js'


const ROOT_DIR = 'content'

export const { state, settings } = await load(ROOT_DIR)
// console.debug(JSON.stringify({ state, settings }, null, 2))

export function rawDbHttpMiddleware() {
  return httpMiddleware(state, settings)
}





// references

// console.debug(JSON.stringify(state['instructors'].map(o=>o.name + ',' + o.sort),null,2))





// export function getNextItem(collection, currentItem) {
//   if (!state[collection]) return null
//   const currentIndex = state[collection].findIndex(o => o._id === currentItem._id)
//   if (currentIndex < state[collection].length - 1) {
//     return state[collection][currentIndex + 1]
//   } else {
//     return null
//   }
// }

// export function getPrevItem(collection, currentItem) {
//   if (!state[collection]) return null
//   const currentIndex = state[collection].findIndex(o => o._id === currentItem._id)
//   if (currentIndex > 0) {
//     return state[collection][currentIndex - 1]
//   } else {
//     return null
//   }
// }
