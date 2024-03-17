/** @typedef {import('../../types.js').CollectionItem} CollectionItem */
/** @typedef {import('../../types.js').ItemType} ItemType */
/** @typedef {import('../../types.js').ChangeSet} ChangeSet */

import { loadSettings } from '../settings.js'
import { getCollection, loadCollections } from './collection.js'
import { loadItem, applyItemChanges, saveItemOnFile } from './item.js'

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


/** @type {(collectionName: string, item: CollectionItem, type: ItemType) => Promise<CollectionItem>} */
export async function saveItem(collectionName, item, type) {
  if (typeof collectionName !== 'string' || !item) throw new TypeError(`bad arguments`)
  if (!item.meta.id) throw new TypeError(`rawdb.saveItem: item must have an id to be saved (.meta.id)`)
  const collection = getCollection(collectionName)
  if (!collection) throw new Error(`rawdb.saveItem: collection "${collectionName}" not found`)
  const foundIndex = collection.items.findIndex(o => o.meta.id === item.id)
  if (foundIndex > -1) collection.items.splice(foundIndex, 1, item)
  const filename = `${item.meta.id}.${type}`
  await saveItemOnFile(collection, item, type, filename)
  const newItem = await loadItem(collection, filename, true, true)
  if (!newItem) throw new Error(`rawdb.saveItem: error saving item with id: ${item.meta.id}`)
  collection.items.push(newItem)
  return newItem
}