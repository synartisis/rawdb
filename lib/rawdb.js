import * as store from './rawdb/store/store.js'
import { httpMiddleware } from './rawdb/http-middleware.js'
import * as settings from './rawdb/settings.js'


/**
 * rawdb http middleware
 * @type {(rootDir: string) => Promise<rawdb.RequestListener>}
 * */
export async function rawdb(rootDir) {
  if (typeof rootDir !== 'string') throw new TypeError(`rawdb error: "rootDir" is required`)
  if (!settings.initialized()) {
    settings.setRootDirectory(rootDir)
    await store.load()
  }
  return httpMiddleware()
}
