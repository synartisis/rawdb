/** @typedef {import('../../types.js').Collection} Collection */

import * as fs from 'node:fs/promises'
import { getSetting, getRootDirectory } from '../settings.js'
import { loadItem } from './item.js'


const initialized = () => !!getRootDirectory()

/** @type {Collection[]} */
const collections = []


export async function loadCollections() {
  const rootDir = getRootDirectory()
  const collectionNames = (await fs.readdir(rootDir, { withFileTypes: true }))
    .filter(entry => entry.isDirectory() && entry.name !== '.rawdb')
    .map(entry => entry.name)

  for (const collectionName of collectionNames) {
    /** @type {Collection} */
    const collection = {
      name: collectionName,
      url: getSetting(collectionName, 'url'),
      path: `${rootDir}/${collectionName}`,
      lazyProperties: getSetting(collectionName, 'lazy'),
      items: [],
      transformers: [],
      addTransformer(transformerFn) { this.transformers.push(transformerFn) }
    }
    collections.push(collection)
    await loadCollectionData(collection)
  }
  collections.forEach(applyCollectionSettings)
  collections.forEach(updateCollectionReferences)
}


/** @param {string} collectionNameOrUrl */
export function getCollection(collectionNameOrUrl) {
  return collections.find(o => o.name === collectionNameOrUrl || o.url === collectionNameOrUrl)
}


export function getCollectionNames() {
  return collections.map(o => o.name)
}


export function getCollectionsFlatten() {
  if (!initialized()) throw new Error(`rawdb not initialized`)
  const flatten = {}
  collections.forEach(col => {
    Object.defineProperty(flatten, col.name, {
      get() { return col.items },
      enumerable: true,
    })
  })
  return flatten
}



/** @param {Collection} collection */
async function loadCollectionData(collection) {
  const filenames = (await fs.readdir(collection.path, { withFileTypes: true }))
    .filter(entry => entry.isFile())
    .map(entry => entry.name)
  const items = await Promise.all(
    filenames.map(filename => loadItem(collection, filename, false))
  )
  items.forEach(async item => {
    if (item) {
      for await (const transformer of collection.transformers) {
        await transformer(item)
      }
      collection.items.push(item)
    }
  })
}


/** @type {(collection: Collection) => void} */
function applyCollectionSettings(collection) {
  const sort = getSetting(collection.name, 'sort')
  for (const sortBy of sort.reverse()) {
    const isPropertyName = !sortBy.includes('{') && !sortBy.includes('=') // sniff function syntax
    if (isPropertyName) {
      try {
        collection.items.sort((a, b) => a[sortBy] < b[sortBy] ? -1 : 1)
      } catch (/** @type {any} */ error) {
        console.error(`Error while sorting '${collection.name}' collection: "${error?.message}". Check collection settings.`)
      }
    } else {
      try {
        const fn = Function(`'use strict'; return ${sortBy}`)()
        collection.items.sort(fn)
      } catch (/** @type {any} */ error) {
        console.error(`Error while sorting '${collection.name}' collection: "${error?.message}". Check collection settings.`)
      }
    }
  }
}


/** @type {(collection: Collection) => void} */
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
            const foreignItem = foreignCollection.items.find(o => o.meta.id === id)
            if (foreignItem) found.push(foreignItem)
          }
          item[k] = found
        } else {
          const found = foreignCollection.items.find(o => o.meta.id === item[foreignKey])
          if (found) item[k] = found
        }
      }
    }
  }
}
