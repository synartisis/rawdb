/** @typedef {import('../../types.js').Collection} Collection */
/** @typedef {import('../../types.js').CollectionItem} CollectionItem */
/** @typedef {import('../../types.js').ChangeSet} ChangeSet */

import * as fs from 'node:fs/promises'
import * as parser from '../parser/parser.js'


/** @type {(collection: Collection, filename: string, loadLazyProperties: boolean, includeBodySource?: boolean) => Promise<CollectionItem | undefined>} */
export async function loadItem(collection, filename, loadLazyProperties, includeBodySource = false) {
  if (!collection || typeof filename !== 'string') throw new TypeError(`bad arguments`)
  const [id, ext] = filename.split('.')
  if (!id || !parser.isSupportedExtention(ext)) return
  const fileContent = await fs.readFile(`${collection.path}/${filename}`, 'utf8')
  const parsed = parser.parse(ext, fileContent)
  if (!parsed) return
  /** @type {CollectionItem} */
  const item = {
    meta: {
      id,
      href: `/${collection.url}/${id}`,
      filename,
      type: ext,
      properties: [],
      bodySource: includeBodySource ? parsed.bodySource ?? '' : '',
    }
  }
  const { bodySource, bodyProps, ...props } = parsed
  for (const [name, value] of Object.entries(props)) {
    const isLazy = collection.lazyProperties.includes(name)
    const isBodyProp = parsed.bodyProps.includes(name)
    item.meta.properties.push({ name, isLazy, isBodyProp })
    if (loadLazyProperties || !isLazy) item[name] = value
  }
  return item
}


/** @type {(collection: Collection, filename: string, changes: ChangeSet) => Promise<CollectionItem>} */
export async function applyItemChanges(collection, filename, changes) {
  if (!collection || typeof filename !== 'string') throw new TypeError(`bad arguments`)
  // console.debug('*', {collection.name, filename, changes})
  const item = await loadItem(collection, filename, true, true)
  if (!item) throw new Error(`rawdb.applyChanges: item "${collection.name}/${filename}" not found`)
  for (const change of changes) {
    if (change.propertyName === 'bodySource') {
      item.meta.bodySource = change.newValue
      continue
    }
    if (change.lang) {
      if (!(change.propertyName in item)) item[change.propertyName] = {}
      item[change.propertyName][change.lang] = change.newValue
    } else {
      item[change.propertyName] = change.newValue
    }
  }
  await saveItem(collection, item)
  return item
}



/** @type {(collection: Collection, item: CollectionItem) => Promise<void>} */
async function saveItem(collection, item) {
  const filename = `${collection.path}/${item.meta.filename}`
  const ext = item.meta.type
  const serialized = parser.serialize(ext, item)
  fs.writeFile(filename, serialized, 'utf-8')
}
