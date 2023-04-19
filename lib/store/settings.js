import fs from 'node:fs/promises'


/** @type {rawdb.Settings} */
export let settings = {}


/** @param {string} settingsFilename */
export async function loadSettings(settingsFilename) {
  let settingsContent
  try {
    settingsContent = await fs.readFile(settingsFilename, 'utf-8')
  } catch (error) {
    settingsContent = '{}'
  }
  settings = JSON.parse(settingsContent)
  return settings
}


/** @type {(collection: string, key: keyof rawdb.CollectionSettings) => any | undefined} */
export function getSetting(collection, key) {
  const collectionSettings = settings[collection]
  if (!collectionSettings) return
  return collectionSettings[key]
}
