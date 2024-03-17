import * as store from './rawdb/store/store.js'
import * as settings from './rawdb/settings.js'
import * as secrets from './rawdb/secrets/secrets.js'

/** @typedef {import('./types.js').CollectionItem} CollectionItem */
/** @typedef {import('./types.js').ItemType} ItemType */
/** @typedef {import('./types.js').ChangeSet} ChangeSet */


/**
 * get a list of rawdb collection names
 */
export function getCollectionNames() {
  if (!settings.initialized()) throw new Error(`rawdb not initialized`)
  return store.getCollectionNames()
}

/** @param {string} collectionNameOrUrl */
export function getCollection(collectionNameOrUrl) {
  if (!settings.initialized()) throw new Error(`rawdb not initialized`)
  return store.getCollection(collectionNameOrUrl)
}

/** @type {(collectionName: string, id: string, includeBodySource?: boolean) => Promise<CollectionItem | undefined>} */
export async function getItem(collectionName, id, includeBodySource = false) {
  if (!settings.initialized()) throw new Error(`rawdb not initialized`)
  return store.getItem(collectionName, id, includeBodySource)
}

/** @type {(collectionName: string, id: string, changes: ChangeSet) => Promise<CollectionItem>} */
export function applyChanges(collectionName, id, changes) {
  if (!settings.initialized()) throw new Error(`rawdb not initialized`)
  return store.applyChanges(collectionName, id, changes)
}

/** @type {(collectionName: string, item: CollectionItem, type: ItemType) => Promise<CollectionItem>} */
export async function saveItem(collectionName, item, type) {
  if (!settings.initialized()) throw new Error(`rawdb not initialized`)
  return store.saveItem(collectionName, item, type)
}

/** @type {(key: string, value: string) => Promise<void>} */
export async function setSecret(key, value) {
  if (!settings.initialized()) throw new Error(`rawdb not initialized`)
  return secrets.setSecret(key, value)
}

/** @type {(key: string) => Promise<string | undefined>} */
export async function getSecret(key) {
  if (!settings.initialized()) throw new Error(`rawdb not initialized`)
  return secrets.getSecret(key)
}
