/** @import { Collection, CollectionItem, ChangeSet, ItemType } from '../../types.js' */


import * as parser from '../parser/parser.js'
import * as settings from './settings.js'
import { loadFileContent, writeFileContent } from './fs.js'


/** @type {(collection: Collection, filename: string, loadLazyProperties: boolean, includeBodySource?: boolean) => Promise<CollectionItem>} */
export async function loadItem(collection, filename, loadLazyProperties, includeBodySource = false) {
  if (!collection || typeof filename !== 'string') throw new TypeError(`bad arguments`)
  const [id, ext] = filename.split('.')
  if (!id || !parser.isSupportedExtention(ext)) throw new Error(`Item ${collection.name}/${filename} is not supported by rawdb`)
  const fileContent = await loadFileContent(`${collection.path}/${filename}`)
  const parsed = parser.parse(ext, fileContent)
  if (!parsed) throw new Error(`Parse Error on Item ${collection.name}/${filename}`)
  /** @type {CollectionItem} */
  const item = {
    meta: {
      id,
      href: `${settings.getBaseUrl()}${collection.url}/${id}`,
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
  for await (const transformer of collection.transformers) {
    await transformer(item)
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
  await saveItemOnFile(collection, item, item.meta.type, item.meta.filename)
  return item
}



/** @type {(collection: Collection, item: CollectionItem, type: ItemType, filename: string) => Promise<void>} */
export async function saveItemOnFile(collection, item, type, filename) {
  const filepath = `${collection.path}/${filename}`
  const serialized = parser.serialize(type, item)
  writeFileContent(filepath, serialized)
}
