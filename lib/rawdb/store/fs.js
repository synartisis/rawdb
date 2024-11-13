import * as fs from 'node:fs/promises'
import * as path from 'node:path'

const SETTINGS_FILENAME = 'settings.json'


/** @param {string} rootDirectory */
export async function loadSettingsFile(rootDirectory) {
  try {
    return fs.readFile(path.join(rootDirectory, SETTINGS_FILENAME), 'utf-8')
  } catch (error) {}
}


/** @param {string} rootDirectory */
export async function loadCollectionEntries(rootDirectory) {
  return (await fs.readdir(rootDirectory, { withFileTypes: true }))
    .filter(entry => entry.isDirectory() && !entry.name.startsWith('.'))
}


/** @param {string} collectionPath */
export async function loadCollectionContentEntries(collectionPath) {
  return (await fs.readdir(collectionPath, { withFileTypes: true, recursive: true }))
    .filter(entry => entry.isFile())
}


/** @param {string} filepath */
export async function loadFileContent(filepath) {
  return fs.readFile(filepath, 'utf8')
}


/** 
 * @param {string} filename
 * @param {string} content
 * */
export async function writeFileContent(filename, content) {
  return fs.writeFile(filename, content, 'utf-8')
}