import * as http from 'node:http'
import { state, settings } from './data.js'


/** @type {(pathname: string, rawdbEndpoint: string) => http.RequestListener} */
export function rawdbViewerListener(pathname, rawdbEndpoint) {
  return (req, res) => {
    if (pathname === rawdbEndpoint) { res.statusCode = 302; res.setHeader('location', rawdbEndpoint + '/'); res.end() }
    rawdbRequestHandler(pathname, rawdbEndpoint, res)
    if (!res.closed) {
      res.statusCode = 404
      return res.end()
    }
  }
}


/** @type {(pathname: string, rawdbEndpoint: string, res: http.ServerResponse) => void} */
function rawdbRequestHandler(pathname, rawdbEndpoint, res) {
  const subPath = pathname.substring(rawdbEndpoint.length)
  if (subPath === '/') {
    const html = /*html*/`
      <h2>rawdb</h2>
      <div><a href="settings">settings</a></div>
      <div><a href="state">state</a></div>
    `
    res.setHeader('content-type', 'text/html; charset=utf-8')
    res.end(`<!DOCTYPE html>` + html)
  }
  if (subPath === '/settings') {
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(settings))
  }
  if (subPath === '/state') {
    const html = /*html*/`
      <ul>
        ${Object.keys(state).map(collectionName => /*html*/`
          <li><a href="${rawdbEndpoint}${subPath}/${collectionName}">${collectionName}</a></li>
        `).join('\n')}
      </ul>
    `
    res.setHeader('content-type', 'text/html; charset=utf-8')
    res.end(`<!DOCTYPE html>` + html)
  }
  if (subPath.startsWith('/state/')) {
    const collectionName = subPath.replace('/state/', '')
    if (!!state[collectionName]) {
      res.setHeader('content-type', 'application/json; charset=utf-8')
      res.end(JSON.stringify(state[collectionName]))
    }
  }
}