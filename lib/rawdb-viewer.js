import * as http from 'node:http'
import { state, settings } from './data.js'


/** @type {(pathname: string, rawdbEndpoint: string) => http.RequestListener} */
export function rawdbViewerListener(pathname, rawdbEndpoint) {
  return (req, res) => {
    if (pathname === rawdbEndpoint) { res.statusCode = 302; res.setHeader('location', rawdbEndpoint + '/'); res.end() }
    const rawdbResult = rawdbRequestHandler(pathname, rawdbEndpoint)
    if (rawdbResult) {
      res.setHeader('content-type', 'text/html; charset=utf-8')
      return res.end(`<!DOCTYPE html>` + rawdbResult)
    } else {
      res.statusCode = 404
      return res.end()
    }
  }
}


/** @type {(pathname: string, rawdbEndpoint: string) => string | undefined} */
function rawdbRequestHandler(pathname, rawdbEndpoint) {
  const subPath = pathname.substring(rawdbEndpoint.length)
  if (subPath === '/') return /*html*/`
    <h2>rawdb</h2>
    <div><a href="settings">settings</a></div>
    <div><a href="state">state</a></div>
  `
  if (subPath === '/settings') return JSON.stringify(settings)
  if (subPath === '/state') return /*html*/`
    <ul>
      ${Object.keys(state).map(collectionName => /*html*/`<li><a href="${rawdbEndpoint}${subPath}/${collectionName}">${collectionName}</a></li>`).join('\n')}
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