import * as http from 'node:http'
import { state, collectionNames, stateResponseProperty, getSetting } from './data.js'
import * as rawdbSettings from './rawdb-settings.js'
import { rawdbViewerListener } from './rawdb-viewer.js'

const onProduction = process.env.NODE_ENV === 'production'


/** @type {() => Promise<rawdb.RequestListener>} */
export async function httpMiddleware() {
  return (req, res) => {
    const { pathname } = new URL(req.url ?? '/', 'http://example.com')

    if (pathname.startsWith(rawdbSettings.RAWDB_ENDPOINT) && !onProduction) {
      return rawdbViewerListener(pathname, rawdbSettings.RAWDB_ENDPOINT)(req, res)
    }

    const [ , maybeCollectionName, maybeId ] = pathname.split('/')
    if (collectionNames().includes(maybeCollectionName)) {
      const collectionName = maybeCollectionName
      if (maybeId) {
        const itemProperty = getSetting(collectionName, 'itemproperty')
        res[stateResponseProperty][itemProperty ?? 'current'] = state[collectionName].find(o => o._id === maybeId)
      }
    }

    Object.assign(res[stateResponseProperty], {...state})
  }
}
