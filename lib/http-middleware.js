import * as http from 'node:http'
const RAWDB_ENDPOINT = '/rawdb'
const onProduction = process.env.NODE_ENV === 'production'


/** @type {(state: any, settings: any) => Promise<http.RequestListener>} */
export async function httpMiddleware(state, settings, responseFieldForState = 'locals') {
  return (req, res) => {
    if (req.url?.startsWith(RAWDB_ENDPOINT) && !onProduction) {
      if (req.url === RAWDB_ENDPOINT) { res.statusCode = 302; res.setHeader('location', RAWDB_ENDPOINT + '/'); res.end() }
      const rawdbResult = rawdbRequestHandler(req.url, state, settings)
      res.setHeader('content-type', 'text/html; charset=utf-8')
      return res.end(`<!DOCTYPE html>` + rawdbResult)
    }
    // @ts-ignore
    Object.assign(res[responseFieldForState], {...state})
  }
}


/** @type {(url: string, state: any, settings: any) => string} */
function rawdbRequestHandler(url, state, settings) {
  const subUrl = url.substring(RAWDB_ENDPOINT.length)
  if (subUrl === '/') return /*html*/`
    <h2>rawdb</h2>
    <div><a href="settings">settings</a></div>
    <div><a href="state">state</a></div>
  `
  if (subUrl === '/settings') return JSON.stringify(settings)
  if (subUrl === '/state') return /*html*/`
    <ul>
      ${Object.keys(state).map(collectionName => /*html*/`<li><a href="${RAWDB_ENDPOINT}${subUrl}/${collectionName}">${collectionName}</a></li>`).join('\n')}
    </ul>
  `
  if (subUrl.startsWith('/state/')) {
    const collectionName = subUrl.split('?')[0].split('#')[0].replace('/state/', '')
    if (!!state[collectionName]) {
      return /*html*/`
        <pre>${JSON.stringify(state[collectionName])}</pre>
      `      
    }
  }
  return ''
}