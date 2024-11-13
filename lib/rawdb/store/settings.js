/** @import { Settings, CollectionSettings } from '../../types.js' */

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


/** @type {(_baseUrl: string) => void} */
export function setBaseUrl(_baseUrl) {
  baseUrl = _baseUrl
}


export function getRootDirectory() {
  return rootDirectory
}


export function getBaseUrl() {
  return baseUrl
}


export async function loadSettings() {
  try {
    const settingsContent = await loadSettingsFile(rootDirectory) ?? '{}'
    settings = JSON.parse(settingsContent)
    validateSettings(settings)
  } catch (error) {}
}


/** @type {<Key extends keyof CollectionSettings>(collectionName: string, key: Key) => CollectionSettings[Key]} */
export function getSetting(collectionName, key) {
  const collectionSettings = settings[collectionName]
  return collectionSettings?.[key] ?? defaultCollectionSettings(collectionName)[key]
}




/** @type {(collectionName: string) => CollectionSettings} */
function defaultCollectionSettings(collectionName) {
  return {
    url: collectionName,
    itemproperty: 'currentItem',
    sort: [],
    lazy: [],
  }
}


/** @param {Settings} settings */
function validateSettings(settings) {
  for (const collectionName of Object.keys(settings)) {
    const collectionSettings = settings[collectionName]
    if (!collectionSettings) continue
    const defaultSettings = defaultCollectionSettings(collectionName)
    for (const [key, value] of Object.entries(collectionSettings)) {
      if (!(key in defaultSettings)) throw new Error(`rawdb settings error: setting "${key}" does not exist`)
      // @ts-ignore
      if (typeof value !== typeof defaultSettings[key]) throw new Error(`rawdb settings error: wrong type for "${key}". Expected ${typeof defaultSettings[key]}, found ${typeof value}`)
    }
  }
}