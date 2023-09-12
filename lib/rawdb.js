import * as store from './rawdb/store/store.js'
import { httpMiddleware } from './rawdb/http-middleware.js'
import * as settings from './rawdb/settings.js'

/** @typedef {import('./types.js').Config} Config */


/**
 * rawdb configuration and loading
 * must run before start using rawdb
 * @param {Config} config configuration settings
 * @example rawdb.config({ rootDir: 'my_content/' })
 */
export async function config({ rootDir, rootUrl = '/' }) {
  if (typeof rootDir !== 'string') throw new TypeError(`rawdb error: "rootDir" is required`)
  if (settings.initialized()) throw new Error(`rawdb error: rawdb is already initialized`)
  settings.setRootDirectory(rootDir)
  settings.setRootUrl(rootUrl)
  await store.load()
}


/**
 * rawdb http middleware
 * 
 * attaches rawdb data on http.ServerResponse.locals for use in UI databinding
 * @example server.use(rawdb.middleware())
 * */
export function middleware() {
  return httpMiddleware(settings.getRootUrl())
}
