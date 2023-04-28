import * as http from 'node:http'
import { setState } from './state.js'
import { rawdbViewerListener } from './rawdb-viewer.js'

export const RAWDB_ENDPOINT = '/rawdb'
const onProduction = process.env.NODE_ENV === 'production'


export function httpMiddleware() {
  /** @type {(req: http.IncomingMessage, res: http.ServerResponse & { locals: string }) => Promise<void>} */
  return async (req, res) => {
    const { pathname } = new URL(req.url ?? '/', 'http://example.com')

    if (pathname.startsWith(RAWDB_ENDPOINT) && !onProduction) {
      return rawdbViewerListener(pathname, RAWDB_ENDPOINT)(req, res)
    }

    const [ , maybeCollectionUrl, maybeId ] = pathname.split('/')
    await setState(res, maybeCollectionUrl, maybeId)
  }
}
