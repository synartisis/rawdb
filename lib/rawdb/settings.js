/** @typedef {import('../types.js').Settings} Settings */
/** @typedef {import('../types.js').CollectionSettings} CollectionSettings */

import * as fs from 'node:fs/promises'
import * as path from 'node:path'

const SETTINGS_FILENAME = 'settings.json'


/** @type {Settings} */
export let settings = {}

/** @type {string} */
let rootDirectory

/** @type {string} */
let rootUrl = '/'


export function initialized() {
  return !!rootDirectory
}


/** @type {(rootDir: string) => void} */
export function setRootDirectory(rootDir) {
  if (!rootDir) throw new Error(`rawdb.store: "rootDir" is required`)
  rootDirectory = path.normalize(rootDir)
}


/** @type {(_rootUrl: string) => void} */
export function setRootUrl(_rootUrl) {
  rootUrl = _rootUrl
}


export function getRootDirectory() {
  return rootDirectory
}


export function getRootUrl() {
  return rootUrl
}


export async function loadSettings() {
  let settingsContent
  try {
    settingsContent = await fs.readFile(path.join(rootDirectory, SETTINGS_FILENAME), 'utf-8')
    settings = JSON.parse(settingsContent)
  } catch (error) {}
  validateSettings(settings)
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