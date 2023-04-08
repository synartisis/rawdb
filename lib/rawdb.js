import * as http from 'node:http'

import { init } from './data.js'
import { httpMiddleware } from './http-middleware.js'

let initialized = false


/** @type {(rootDir: string) => Promise<http.RequestListener>} */
export async function rawdb(rootDir) {
  if (!rootDir) throw new Error(`rawdb error: "rootDir" is required`)
  if (!initialized) {
    initialized = true
    await init(rootDir)
  }
  return httpMiddleware()
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
