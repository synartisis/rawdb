/** @import { Collection, CollectionItem, ChangeSet, ItemType } from '../../types.js' */

import { loadSettings, getRootDirectory, getCollectionSettings } from './settings.js'
import * as collection from './collection.js'
import { loadCollectionEntries } from './fs.js'

import { loadItem, applyItemChanges, saveItemOnFile } from './item.js'


/** @type {Collection[]} */
const collections = []

/** @type {{ [collectionName: string]: CollectionItem[] } | null} */
let flatCollectionsCache = null


export async function load() {
  await loadSettings()
  const collectionEntries = await loadCollectionEntries(getRootDirectory())
  await loadCollections(collectionEntries)
  flatCollectionsCache = null
}

export function getCollectionNames() {
  return collections.map(o => o.name)
}

/** @param {string} collectionNameOrUrl */
export function getCollection(collectionNameOrUrl) {
  return collections.find(o => o.name === collectionNameOrUrl || o.url === collectionNameOrUrl)
}

/** @type {(collectionName: string, id: string, includeBodySource?: boolean) => Promise<CollectionItem>} */
export async function getItem(collectionName, id, includeBodySource = false) {
  const collection = getCollection(collectionName)
  if (!collection) throw new Error(`rawdb.store.getItem: Collection ${collectionName} not found.`)
  const found = collection.items.find(o => o.meta.id === id)
  if (!found) throw new Error(`rawdb.store.getItem: Item ${collectionName}/${id} not found.`)
  return loadItem(collection, found.meta.filename, true, includeBodySource)
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





export function getCollectionsFlatten() {
  if (flatCollectionsCache) return flatCollectionsCache
  flatCollectionsCache = {}
  collections.forEach(col => {
    Object.defineProperty(flatCollectionsCache, col.name, {
      get() { return col.items },
      enumerable: true,
    })
  })
  return flatCollectionsCache
}



/** @param {import('node:fs').Dirent[]} collectionEntries */
async function loadCollections(collectionEntries) {
  for await (const collectionEntry of collectionEntries) {
    const collectionName = collectionEntry.name
    const userCollectionSettings = getCollectionSettings(collectionName)
    const col = collection.create(collectionName, getRootDirectory(), userCollectionSettings)
    await collection.loadCollectionData(col)
    collections.push(col)
  }
  collections.forEach(collection.applyCollectionSettings)
  collections.forEach(updateReferences)
}



/** @type {(collection: Collection) => void} */
function updateReferences(collection) {
  // TODO: This must be changed
  for (const item of collection.items) {
    for (const [k, v] of Object.entries(item)) {
      if (typeof v === 'string' && v.trim().startsWith('REF:')) {
        const [ foreignCollectionName, foreignKey ] = v.replace('REF:', '').split('.')
        const foreignCollection = collections.find(o => o.name === foreignCollectionName)
        if (!foreignCollection) continue
        if (Array.isArray(item[foreignKey])) {
          const found = []
          for (const id of item[foreignKey]) {
            const foreignItem = foreignCollection.items.find(o => o.meta.id === id)
            if (foreignItem) found.push(foreignItem)
          }
          item[k] = found
        } else {
          const found = foreignCollection.items.find(o => o.meta.id === item[foreignKey])
          if (found) item[k] = found
        }
      }
    }
  }
}
