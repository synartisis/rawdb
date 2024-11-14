import * as http from 'node:http'
import { settings } from '../store/settings.js'
import * as store from '../store/store.js'


/** @type {(pathname: string, rawdbEndpoint: string) => http.RequestListener} */
export function rawdbViewerListener(pathname, rawdbEndpoint) {
  return async (req, res) => {
    if (pathname === rawdbEndpoint) { res.statusCode = 302; res.setHeader('location', rawdbEndpoint + '/'); res.end() }
    await rawdbRequestHandler(req, res, rawdbEndpoint)
    if (!res.closed) {
      res.statusCode = 404
      return res.end()
    }
  }
}


/** @type {(req: http.IncomingMessage, res: http.ServerResponse, rawdbEndpoint: string) => Promise<any>} */
async function rawdbRequestHandler(req, res, rawdbEndpoint) {
  const url = new URL(req.url ?? '/', `http://${req.headers.host}`)
  const [ , rawdb, section, sectionName, id ] = url.pathname.split('/')
  // console.debug({ rawdb, section, sectionName, id})
  if (!section) {
    const html = /*html*/`
      <h2>rawdb</h2>
      <div><a href="user-settings">user settings</a></div>
      <div><a href="collections">collections</a></div>
      <div><a href="data">data</a></div>
    `
    res.setHeader('content-type', 'text/html; charset=utf-8')
    res.end(`<!DOCTYPE html>` + html)
  }
  if (section === 'user-settings') {
    res.setHeader('content-type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(settings))
  }
  if (section === 'collections') {
    if (sectionName) {
      const collectionSettings = settings[sectionName]
      res.setHeader('content-type', 'application/json; charset=utf-8')
      const collection = store.getCollection(sectionName)
      // const itemsToShow = collection.items.map(o => Object.assign({ '_link': url.origin + '/rawdb/data' + o.meta.href }, o))
      return res.end(JSON.stringify({ ...collection, items: `count: ${collection?.items.length}` }))
    } else {
      const collectionNames = store.getCollectionNames()
      const html = /*html*/`
        <ul>
          ${collectionNames.map(collectionName => /*html*/`
            <li><a href="${rawdbEndpoint}/${section}/${collectionName}">${collectionName}</a></li>
          `).join('\n')}
        </ul>
      `
      res.setHeader('content-type', 'text/html; charset=utf-8')
      return res.end(`<!DOCTYPE html>` + html)
    }
  }
  if (section === 'data') {
    if (id) {
      res.setHeader('content-type', 'application/json; charset=utf-8')
      const item = await store.getItem(sectionName, id, true)
      return res.end(JSON.stringify(item))
    }
    if (sectionName) {
      const collectionName = sectionName
      const collection = store.getCollection(collectionName)
      if (collection) {
        res.setHeader('content-type', 'application/json; charset=utf-8')
        const itemsToShow = collection.items.map(o => Object.assign({ '_link': url.origin + '/rawdb/data' + o.meta.href }, o))
        return res.end(JSON.stringify(itemsToShow))
      }
    } else {
      const collectionNames = store.getCollectionNames()
      const html = /*html*/`
        <ul>
          ${collectionNames.map(collectionName => /*html*/`
            <li><a href="${rawdbEndpoint}/${section}/${collectionName}">${collectionName}</a></li>
          `).join('\n')}
        </ul>
      `
      res.setHeader('content-type', 'text/html; charset=utf-8')
      return res.end(`<!DOCTYPE html>` + html)
    }
  }
}