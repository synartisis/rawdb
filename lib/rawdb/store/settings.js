/** @import { Settings, UserCollectionSettings } from '../../types.js' */

import * as path from 'node:path'
import { loadSettingsFile } from './fs.js'


/** @type {Settings} */
export let settings = {}

/** @type {string} */
let rootDirectory

/** @type {string} */
let baseUrl = '/'


export function initialized() {
  return !!rootDirectory
}

/** @type {(rootDir: string) => void} */
export function setRootDirectory(rootDir) {
  if (!rootDir) throw new Error(`rawdb.store: "rootDir" is required`)
  rootDirectory = path.normalize(rootDir)
}

export function getRootDirectory() {
  return rootDirectory
}

/** @type {(_baseUrl: string) => void} */
export function setBaseUrl(_baseUrl) {
  baseUrl = _baseUrl
}

export function getBaseUrl() {
  return baseUrl
}

export async function loadSettings() {
  try {
    const settingsContent = await loadSettingsFile(rootDirectory) ?? '{}'
    settings = JSON.parse(settingsContent)
  } catch (error) {}
  validateSettings(settings)
}


/** @param {string} collectionName */
export function getCollectionSettings(collectionName) {
  return { ...defaultCollectionSettings(collectionName), ...settings[collectionName] }
}

// /** @type {<Key extends keyof CollectionSettings>(collectionName: string, key: Key) => CollectionSettings[Key]} */
// export function getSetting(collectionName, key) {
//   const collectionSettings = settings[collectionName]
//   return collectionSettings?.[key] ?? defaultCollectionSettings(collectionName)[key]
// }




/** @type {(collectionName: string) => UserCollectionSettings} */
function defaultCollectionSettings(collectionName) {
  return {
    url: collectionName,
    itemproperty: 'currentItem',
    sort: [],
    lazyProperties: [],
  }
}

/** @param {Settings} settings */
function validateSettings(settings) {
  for (const collectionName of Object.keys(settings)) {
    const collectionSettings = settings[collectionName]
    if (!collectionSettings) continue
    const defaultSettings = defaultCollectionSettings(collectionName)
    for (const [key, value] of Object.entries(collectionSettings)) {
      if (!(key in defaultSettings)) throw new Error(`rawdb settings error: setting "${key}" on collection "${collectionName}" is not valid`)
      // @ts-ignore
      if (typeof value !== typeof defaultSettings[key]) throw new Error(`rawdb settings error: wrong type for "${key}". Expected ${typeof defaultSettings[key]}, found ${typeof value}`)
    }
  }
}