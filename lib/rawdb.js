import * as http from 'node:http'

import * as store from './store/store.js'
import { httpMiddleware } from './http-middleware.js'

let initialized = false


/** @type {(rootDir: string) => Promise<http.RequestListener>} */
export async function rawdb(rootDir) {
  if (!rootDir) throw new Error(`rawdb error: "rootDir" is required`)
  if (!initialized) {
    initialized = true
    await store.init(rootDir)
  }
  return httpMiddleware()
}
