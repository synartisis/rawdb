import * as store from './rawdb/store/store.js'
import * as secrets from './rawdb/secrets/secrets.js'

/** @import { CollectionItem, ItemType, ChangeSet } from './types.js' */


/**
 * @returns {string[]} rawdb collection names
 */
export function getCollectionNames() {
  return store.getCollectionNames()
}

/**
 * @param {string} collectionNameOrUrl
 * */
export function getCollection(collectionNameOrUrl) {
  const collection = store.getCollection(collectionNameOrUrl)
  if (collection === undefined) throw new ReferenceError(`Collection with name or url: "${collectionNameOrUrl}" not found`)
  return collection
}

/** @type {(collectionName: string, id: string, includeBodySource?: boolean) => Promise<CollectionItem | undefined>} */
export async function getItem(collectionName, id, includeBodySource = false) {
  return store.getItem(collectionName, id, includeBodySource)
}

/** @type {(collectionName: string, id: string, changes: ChangeSet) => Promise<CollectionItem>} */
export function applyChanges(collectionName, id, changes) {
  return store.applyChanges(collectionName, id, changes)
}

/** @type {(collectionName: string, item: CollectionItem, type: ItemType) => Promise<CollectionItem>} */
export async function saveItem(collectionName, item, type) {
  return store.saveItem(collectionName, item, type)
}

/** @type {(key: string, value: string) => Promise<void>} */
export async function setSecret(key, value) {
  return secrets.setSecret(key, value)
}

/** @type {(key: string) => Promise<string | undefined>} */
export async function getSecret(key) {
  return secrets.getSecret(key)
}
