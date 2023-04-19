import fs from 'node:fs/promises'


/** @type {rawdb.Settings} */
export let settings = {}


/** @param {string} settingsFilename */
export async function loadSettings(settingsFilename) {
  let settingsContent
  try {
    settingsContent = await fs.readFile(settingsFilename, 'utf-8')
    settings = JSON.parse(settingsContent)
  } catch (error) {}
  validateSettings(settings)
  return settings
}


/** @type {<Key extends keyof rawdb.CollectionSettings>(collectionName: string, key: Key) => rawdb.CollectionSettings[Key]} */
export function getSetting(collectionName, key) {
  const collectionSettings = settings[collectionName]
  return collectionSettings?.[key] ?? defaultCollectionSettings(collectionName)[key]
}


/** @type {(collectionName: string) => rawdb.CollectionSettings} */
function defaultCollectionSettings(collectionName) {
  return {
    url: collectionName,
    itemproperty: 'currentItem',
    sort: [],
    lazy: [],
  }
}


/** @param {rawdb.Settings} settings */
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