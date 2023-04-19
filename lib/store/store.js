import fs from 'node:fs/promises'
import path from 'node:path'
import { loadSettings, getSetting } from './settings.js'
import * as parser from '../parser/parser.js'

const SETTINGS_FILENAME = 'settings.json'

/** @type {rawdb.Collection[]} */
const collections = []

/** @type {string} */
let rootDirectory


/** @param {string} rootDir */
export async function init(rootDir) {
  if (!rootDir) throw new Error(`rawdb.store: "rootDir" is required`)
  rootDirectory = path.normalize(rootDir)
  await loadSettings(`${rootDir}/${SETTINGS_FILENAME}`) 
  await loadCollections(rootDir)
  await Promise.all(collections.map(loadCollectionData))
  collections.forEach(applyCollectionSettings)
  collections.forEach(updateCollectionReferences)
}


/** @type {(collectionName: string, id: string) => Promise<any>} */
export async function getItem(collectionName, id) {
  const collection = collections.find(o => o.name === collectionName)
  if (!collection) return
  const found = collection.items.find(o => o._id === id)
  if (!found) return
  const item = structuredClone(found)
  const ext = item._filename.split('.').pop() ?? ''
  const fileContent = await fs.readFile(`${collection.path}/${found._filename}`, 'utf8')
  const parsed = parser.parse(ext, fileContent)
  Object.assign(item, parsed)
  return item
}


/** @param {string} collectionNameOrUrl */
export function getCollection(collectionNameOrUrl) {
  return collections.find(o => o.name === collectionNameOrUrl || o.url === collectionNameOrUrl)
}


export function getCollectionsFlatten() {
  const flatten = {}
  collections.forEach(col => {
    Object.defineProperty(flatten, col.name, {
      get() { return col.items },
      enumerable: true,
    })
  })
  return flatten
}


/** @param {string} rootDir */
async function loadCollections(rootDir) {
  const collectionNames = (await fs.readdir(rootDir, { withFileTypes: true }))
    .filter(entry => entry.isDirectory() && entry.name !== '.rawdb')
    .map(entry => entry.name)
  for (const collectionName of collectionNames) {
    /** @type {rawdb.Collection} */
    const collection = {
      name: collectionName,
      url: getSetting(collectionName, 'url') ?? collectionName,
      path: `${rootDirectory}/${collectionName}`,
      lazyProperties: getSetting(collectionName, 'lazy') ?? [],
      items: []
    }
    collections.push(collection)
  }
}


/** @param {rawdb.Collection} collection */
async function loadCollectionData(collection) {
  const filenames = (await fs.readdir(collection.path, { withFileTypes: true }))
    .filter(entry => entry.isFile())
    .map(entry => entry.name)
  for (const filename of filenames) {
    const [_id, ext] = filename.split('.')
    if (!parser.isSupportedExtention(ext)) continue
    /** @type {rawdb.CollectionItem} */
    const item = {
      _id,
      _href: `/${collection.url}/${_id}`,
      _filename: filename,
    }
    const fileContent = await fs.readFile(`${collection.path}/${filename}`, 'utf8')
    const parsed = parser.parse(ext, fileContent)
    if (parsed) {
      for (const [k, v] of Object.entries(parsed)) {
        if (!collection.lazyProperties.includes(k)) {
          item[k] = v
        }
      }
    }
    collection.items.push(item)
  }
}


/** @type {(collection: rawdb.Collection) => void} */
function applyCollectionSettings(collection) {
  const sort = getSetting(collection.name, 'sort')
  if (sort) {
    const sortByArr = Array.isArray(sort) ? sort : [sort]
    for (const sortBy of sortByArr.reverse()) {
      const isPropertyName = !sortBy.includes('{') && !sortBy.includes('=') // sniff function syntax
      if (isPropertyName) {
        collection.items.sort((a, b) => a[sortBy] < b[sortBy] ? -1 : 1)
      } else {
        const fn = Function(`'use strict'; return ${sortBy}`)()
        try {
          collection.items.sort(fn)
        } catch (/** @type {any} */ error) {
          console.error(`Error while sorting '${collection.name}' collection: "${error?.message}". Check collection settings.`)
        }
      }
    }
  }
}


/** @type {(collection: rawdb.Collection) => void} */
function updateCollectionReferences(collection) {
  for (const item of collection.items) {
    for (const [k, v] of Object.entries(item)) {
      if (typeof v === 'string' && v.trim().startsWith('REF:')) {
        const [ foreignCollectionName, foreignKey ] = v.replace('REF:', '').split('.')
        const foreignCollection = collections.find(o => o.name === foreignCollectionName)
        if (!foreignCollection) continue
        if (Array.isArray(item[foreignKey])) {
          const found = []
          for (const id of item[foreignKey]) {
            const foreignItem = foreignCollection.items.find(o => o._id === id)
            if (foreignItem) found.push(foreignItem)
          }
          item[k] = found
        } else {
          const found = foreignCollection.items.find(o => o._id === item[foreignKey])
          if (found) item[k] = found
        }
      }
    }
  }
}
