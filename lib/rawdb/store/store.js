/** @typedef {import('../../types.js').CollectionItem} CollectionItem */
/** @typedef {import('../../types.js').ChangeSet} ChangeSet */

import { loadSettings } from '../settings.js'
import { getCollection, loadCollections } from './collection.js'
import { loadItem, applyItemChanges } from './item.js'

export { getCollectionNames, getCollection, getCollectionsFlatten } from './collection.js'


export async function load() {
  await loadSettings()
  await loadCollections()
}


/** @type {(collectionName: string, id: string, includeBodySource?: boolean) => Promise<CollectionItem | undefined>} */
export async function getItem(collectionName, id, includeBodySource = false) {
  const collection = getCollection(collectionName)
  if (!collection) return
  const found = collection.items.find(o => o.meta.id === id)
  if (!found) return
  const item = await loadItem(collection, found.meta.filename, true, includeBodySource)
  return item
}


/** @type {(collectionName: string, id: string, changes: ChangeSet) => Promise<CollectionItem>} */
export function applyChanges(collectionName, id, changes) {
  const collection = getCollection(collectionName)
  if (!collection) throw new Error(`rawdb.applyChanges: collection "${collectionName}" not found`)
  const found = collection.items.find(o => o.meta.id === id)
  if (!found) throw new Error(`rawdb.applyChanges: item "${collectionName}"."${id}" not found`)
  return applyItemChanges(collection, found.meta.filename, changes)
}
