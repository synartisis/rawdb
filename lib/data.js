import fs from 'node:fs/promises'
import * as md from './md/md.js'


const SUPPORTED_FILETYPES = ['md', 'json']
const SETTINGS_FILENAME = 'settings.json'
export const stateResponseProperty = 'locals'

/** @type {rawdb.Settings} */
export let settings = {}
/** @type {rawdb.State} */
export let state = {}

/** @type {string} */
let rootDirectory


/** @param {string} rootDir */
export async function init(rootDir) {
  rootDirectory = rootDir
  settings = await loadSettings(`${rootDir}/${SETTINGS_FILENAME}`) 
  state = await loadState(rootDir)
  applySettings()
  updateReferences()
}


export function collectionNames() {
  return Object.keys(state)
}


export function collectionUrls() {
  const urls = []
  for (const collectionName of collectionNames()) {
    const collectionUrl = getSetting(collectionName, 'url')
    urls.push(collectionUrl ?? collectionName)
  }
  return urls
}


/** @param {string} url */
export function getCollectionNameFromUrl(url) {
  for (const collectionName of collectionNames()) {
    const collectionUrl = getSetting(collectionName, 'url')
    if(collectionUrl === url) return collectionName
  }
  if (collectionNames().includes(url)) return url
}


/** @type {(collection: string, key: keyof rawdb.CollectionSettings) => any | undefined} */
export function getSetting(collection, key) {
  const collectionSettings = settings[collection]
  if (!collectionSettings) return
  return collectionSettings[key]
}



/** @param {string} settingsFilename */
async function loadSettings(settingsFilename) {
  let settingsContent
  try {
    settingsContent = await fs.readFile(settingsFilename, 'utf-8')
  } catch (error) {
    settingsContent = '{}'
  }
  return JSON.parse(settingsContent)
}


/** @param {string} rootDir */
async function loadState(rootDir) {
  const collectionNames = (await fs.readdir(rootDir, { withFileTypes: true }))
    .filter(entry => entry.isDirectory() && entry.name !== '.rawdb').map(entry => entry.name)

  for (const collectionName of collectionNames) {
    state[collectionName] = []
    const collectionUrl = getSetting(collectionName, 'url') ?? collectionName
    const lazyProperties = getSetting(collectionName, 'lazy') ?? []
    const filenames = await fs.readdir(`${rootDir}/${collectionName}`)
    for (const filename of filenames) {
      const ext = filename.split('.').pop() ?? ''
      if (!SUPPORTED_FILETYPES.includes(ext)) continue
      const _id = filename.split('.')[0]
      /** @type {rawdb.CollectionItem} */
      const file = {
        _id,
        _href: `/${collectionUrl}/${_id}`,
        _filename: filename,
      }
      const fileContent = await fs.readFile(`${rootDir}/${collectionName}/${filename}`, 'utf8')
      let obj
      if (ext === 'md') {
        const mdObject = md.mdParse(fileContent)
        obj = mdObject
      }
      if (ext === 'json') {
        obj = JSON.parse(fileContent)
      }
      if (obj) {
        for (const [k, v] of Object.entries(obj)) {
          if (!lazyProperties.includes(k)) {
            file[k] = v
          }
        }
      }
      state[collectionName].push(file)
    }
  }
  return state
}


/** @type {(collectionName: string, id: string) => Promise<any>} */
export async function loadItem(collectionName, id) {
  const found = state[collectionName].find(o => o._id === id)
  if (!found) return {}
  const item = structuredClone(found)
  const ext = item._filename.split('.').pop() ?? ''
  const fileContent = await fs.readFile(`${rootDirectory}/${collectionName}/${item._filename}`, 'utf8')
  if (ext === 'md') {
    const mdObject = md.mdParse(fileContent)
    Object.assign(item, mdObject)
  }
  if (ext === 'json') {
    Object.assign(item, JSON.parse(fileContent))
  }
  return item
}


function applySettings() {
  for (const collectionName of collectionNames()) {
    const collectionSettings = settings[collectionName]
    if (collectionSettings) applyCollectionSettings(collectionName, collectionSettings)
  }
}


/** @type {(collectionName: string, collectionSettings: rawdb.CollectionSettings) => void} */
function applyCollectionSettings(collectionName, collectionSettings) {
  let collection = state[collectionName]
  const { sort } = collectionSettings
  if (sort) {
    const sortByArr = Array.isArray(sort) ? sort : [sort]
    for (const sortBy of sortByArr.reverse()) {
      const isPropertyName = !sortBy.includes('{') && !sortBy.includes('=') // sniff function syntax
      if (isPropertyName) {
        collection = collection.sort((a, b) => a[sortBy] < b[sortBy] ? -1 : 1)
      } else {
        const fn = Function(`'use strict'; return ${sortBy}`)()
        try {
          collection = collection.sort(fn)
        } catch (/** @type {any} */ error) {
          console.error(`Error while sorting '${collectionName}' collection: "${error?.message}". Check collection settings.`)
        }
      }
    }
  }
}


function updateReferences() {
  for (const collectionName of collectionNames()) {
    const collection = state[collectionName]
    for (const item of collection) {
      for (const [k, v] of Object.entries(item)) {
        if (typeof v === 'string' && v.startsWith('REF:')) {
          const [ refCollection, foreignKey ] = v.replace('REF:', '').split('.')
          if (Array.isArray(item[foreignKey])) {
            const found = []
            for (const id of item[foreignKey]) {
              const foundItem = state[refCollection].find(o => o._id === id)
              if (foundItem) found.push(foundItem)
            }
            item[k] = found
          } else {
            const found = state[refCollection].find(o => o._id === item[foreignKey])
            if (found) item[k] = found
          }
        }
      }
    }
  }
}
