import * as _store from './rawdb/store/store.js'
import { httpMiddleware } from './rawdb/http-middleware/middleware.js'
import * as settings from './rawdb/settings.js'

import * as store from './store.js'

/** @import { Config } from './types.js' */


export default {

  /**
   * rawdb configuration and loading
   * 
   * must run before start using rawdb
   * @param {Config} config configuration settings
   * @example rawdb.config({ rootDir: 'my_content/' })
   */
  config: async function config({ rootDir, baseUrl = '/' }) {
    if (typeof rootDir !== 'string') throw new TypeError(`rawdb error: "rootDir" is required`)
    if (settings.initialized()) throw new Error(`rawdb error: rawdb is already initialized`)
    settings.setRootDirectory(rootDir)
    settings.setBaseUrl(baseUrl)
    await _store.load()
  },


  /**
   * rawdb http middleware
   * 
   * attaches rawdb data on http.ServerResponse.locals for use in UI databinding
   * @example server.use(rawdb.middleware())
   * */
  middleware: function middleware() {
    return httpMiddleware(settings.getBaseUrl())
  },


  /**
   * rawdb store
   * 
   * provides functions for manipulating rawdb data
   * */
  get store() {
    if (!settings.initialized()) throw new Error(`rawdb is not initialized. You must run rawdb.config(CONTENT_DIR) before start using rawdb.`)
    return store
  }

}
