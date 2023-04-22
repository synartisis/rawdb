import * as store from './store/store.js'
import * as secrets from './secrets/secrets.js'
import { httpMiddleware } from './http-middleware.js'
export { getCollectionList, getCollection, getItem } from './store/store.js'
export { getSecret, setSecret } from './secrets/secrets.js'


let initialized = false


/** @type {(rootDir: string) => Promise<rawdb.RequestListener>} */
export async function rawdb(rootDir) {
  if (!rootDir) throw new TypeError(`rawdb error: "rootDir" is required`)
  if (!initialized) {
    initialized = true
    await store.init(rootDir)
    await secrets.init(rootDir)
  }
  return httpMiddleware()
}
