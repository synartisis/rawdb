import * as http from 'node:http'
const RAWDB_ENDPOINT = '/rawdb'
const onProduction = process.env.NODE_ENV === 'production'

/** @type {string[]} */
let collectionNames



/** @type {(state: any, settings: any) => Promise<http.RequestListener>} */
export async function httpMiddleware(state, settings, responseFieldForState = 'locals') {
  return (req, res) => {
    const { pathname } = new URL(req.url ?? '/', 'http://example.com')
    if (pathname.startsWith(RAWDB_ENDPOINT) && !onProduction) {
      if (pathname === RAWDB_ENDPOINT) { res.statusCode = 302; res.setHeader('location', RAWDB_ENDPOINT + '/'); res.end() }
      const rawdbResult = rawdbRequestHandler(pathname, state, settings)
      if (rawdbResult) {
        res.setHeader('content-type', 'text/html; charset=utf-8')
        return res.end(`<!DOCTYPE html>` + rawdbResult)
      } else {
        res.statusCode = 404
        return res.end()
      }
    }
    if (!collectionNames) collectionNames = Object.keys(state)
    const [ firstPath, ...restPaths ] = pathname.substring(1).split('/')
    if (collectionNames.includes(firstPath)) {
      const collectionName = firstPath
      // TODO do something with the specific collection data
      console.log({collectionNames})
    }
    // @ts-ignore
    Object.assign(res[responseFieldForState], {...state})
  }
}


/** @type {(pathname: string, state: any, settings: any) => string | undefined} */
function rawdbRequestHandler(pathname, state, settings) {
  const subPath = pathname.substring(RAWDB_ENDPOINT.length)
  if (subPath === '/') return /*html*/`
    <h2>rawdb</h2>
    <div><a href="settings">settings</a></div>
    <div><a href="state">state</a></div>
  `
  if (subPath === '/settings') return JSON.stringify(settings)
  if (subPath === '/state') return /*html*/`
    <ul>
      ${Object.keys(state).map(collectionName => /*html*/`<li><a href="${RAWDB_ENDPOINT}${subPath}/${collectionName}">${collectionName}</a></li>`).join('\n')}
    </ul>
  `
  if (subPath.startsWith('/state/')) {
    const collectionName = subPath.replace('/state/', '')
    if (!!state[collectionName]) {
      return /*html*/`
        <pre>${JSON.stringify(state[collectionName])}</pre>
      `      
    }
  }
}