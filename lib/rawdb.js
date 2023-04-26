import * as store from './store/store.js'
import { httpMiddleware } from './http-middleware.js'
import * as settings from './settings.js'
import * as secrets from './secrets/secrets.js'


/**
 * rawdb http middleware
 * @type {(rootDir: string) => Promise<rawdb.RequestListener>}
 * */
export async function rawdb(rootDir) {
  if (typeof rootDir !== 'string') throw new TypeError(`rawdb error: "rootDir" is required`)
  if (!settings.initialized()) {
    settings.setRootDirectory(rootDir)
    await store.load()
  }
  return httpMiddleware()
}

export function getCollectionNames() {
  if (!settings.initialized()) throw new Error(`rawdb not initialized`)
  return store.getCollectionNames()
}

/** @param {string} collectionNameOrUrl */
export function getCollection(collectionNameOrUrl) {
  if (!settings.initialized()) throw new Error(`rawdb not initialized`)
  return store.getCollection(collectionNameOrUrl)
}

/** @type {(collectionName: string, id: string, includeBodySource?: boolean) => Promise<rawdb.CollectionItem | undefined>} */
export async function getItem(collectionName, id, includeBodySource = false) {
  if (!settings.initialized()) throw new Error(`rawdb not initialized`)
  return store.getItem(collectionName, id, includeBodySource)
}

/** @type {(collectionName: string, _id: string, changes: rawdb.ChangeSet) => Promise<rawdb.CollectionItem>} */
export function applyChanges(collectionName, _id, changes) {
  if (!settings.initialized()) throw new Error(`rawdb not initialized`)
  return store.applyChanges(collectionName, _id, changes)
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
