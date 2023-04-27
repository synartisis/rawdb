import * as store from './rawdb/store/store.js'
import { httpMiddleware } from './rawdb/http-middleware.js'
import * as settings from './rawdb/settings.js'

/** @typedef {import('./types.js').Config} Config */
/** @typedef {import('./types.js').RequestListener} RequestListener */


/**
 * rawdb configuration and loading
 * @type {({}: Config) => Promise<void>}
 * */
export async function config({ rootDir }) {
  if (typeof rootDir !== 'string') throw new TypeError(`rawdb error: "rootDir" is required`)
  if (settings.initialized()) throw new Error(`rawdb error: rawdb is already initialized`)
  settings.setRootDirectory(rootDir)
  await store.load()
}


/**
 * rawdb http middleware
 * @type {() => RequestListener}
 * */
export function middleware() {
  return httpMiddleware()
}
