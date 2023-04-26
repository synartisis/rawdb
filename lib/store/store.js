import { loadSettings } from '../settings.js'
import { getCollection, loadCollections } from './collection.js'
import { loadItem, applyItemChanges } from './item.js'

export { getCollectionNames, getCollection, getCollectionsFlatten } from './collection.js'


export async function load() {
  await loadSettings()
  await loadCollections()
}


/** @type {(collectionName: string, id: string, includeBodySource?: boolean) => Promise<rawdb.CollectionItem | undefined>} */
export async function getItem(collectionName, id, includeBodySource = false) {
  const collection = getCollection(collectionName)
  if (!collection) return
  const found = collection.items.find(o => o.meta.id === id)
  if (!found) return
  const item = await loadItem(collection, found.meta.filename, includeBodySource)
  return item
}


/** @type {(collectionName: string, _id: string, changes: rawdb.ChangeSet) => Promise<rawdb.CollectionItem>} */
export function applyChanges(collectionName, _id, changes) {
  const collection = getCollection(collectionName)
  if (!collection) throw new Error(`rawdb.applyChanges: collection "${collectionName}" not found`)
  const found = collection.items.find(o => o.meta.id === _id)
  if (!found) throw new Error(`rawdb.applyChanges: item "${collectionName}"."${_id}" not found`)
  return applyItemChanges(collection, found.meta.filename, changes)
}
