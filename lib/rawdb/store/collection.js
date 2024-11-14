// import { getRootDirectory, getCollectionSettings } from './settings.js'
import { loadCollectionEntries, loadCollectionContentEntries } from './fs.js'
import { loadItem, applyItemChanges, saveItemOnFile } from './item.js'

/** @import { Collection, CollectionSettings } from '../../types.js' */


/** @type {(collectionName: string, rootDirectory: string, collectionSettings: CollectionSettings) => Collection} */
export function create(collectionName, rootDirectory, collectionSettings) {
  /** @type {Collection} */
  const collection = {
    name: collectionName,
    url: collectionSettings['url'],
    path: `${rootDirectory}/${collectionName}`,
    lazyProperties: collectionSettings['lazy'],
    items: [],
    transformers: [],
    settings: collectionSettings,
    addTransformer(transformerFn) { this.transformers.push(transformerFn) }
  }
  return collection  
}


/** @param {Collection} collection */
export async function loadCollectionData(collection) {
  const entries = await loadCollectionContentEntries(collection.path)
console.debug(collection.path, entries.length)
  const items = await Promise.all(
    entries.map(entry => loadItem(collection, entry.name, false))
  )
  for (const item of items) {
    for await (const transformer of collection.transformers) {
      await transformer(item)
    }
    collection.items.push(item)
  }
}


/** @type {(collection: Collection) => void} */
export function applyCollectionSettings(collection) {
  const sort = collection.settings['sort']
  for (const sortBy of sort.reverse()) {
    const isPropertyName = !sortBy.includes('{') && !sortBy.includes('=') // sniff function syntax
    if (isPropertyName) {
      try {
        collection.items.sort((a, b) => a[sortBy] < b[sortBy] ? -1 : 1)
      } catch (/** @type {any} */ error) {
        console.error(`Error while sorting '${collection.name}' collection: "${error?.message}". Check collection settings.`)
      }
    } else {
      try {
        const fn = Function(`'use strict'; return ${sortBy}`)()
        collection.items.sort(fn)
      } catch (/** @type {any} */ error) {
        console.error(`Error while sorting '${collection.name}' collection: "${error?.message}". Check collection settings.`)
      }
    }
  }
}
