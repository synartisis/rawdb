import fs from 'node:fs/promises'
import * as md from './md/md.js'


const SUPPORTED_FILETYPES = ['md', 'json']
const SETTINGS_FILENAME = 'settings.json'


export async function load(rootDir) {
  const settings = await loadSettings(`${rootDir}/${SETTINGS_FILENAME}`) 
  const state = await loadState(rootDir)
  applySettings(settings, state)
  updateReferences(state)

  return { settings, state }
}


async function loadSettings(settingsFilename) {
  let settingsContent
  try {
    settingsContent = await fs.readFile(settingsFilename, 'utf-8')
  } catch (error) {
    settingsContent = '{}'
  }
  return JSON.parse(settingsContent)
}


async function loadState(rootDir) {
  const state = {}
  const collectionNames = (await fs.readdir(rootDir, { withFileTypes: true }))
    .filter(entry => entry.isDirectory()).map(entry => entry.name)

  for (const collectionName of collectionNames) {
    state[collectionName] = []
    const filenames = await fs.readdir(`${rootDir}/${collectionName}`)
    for (const filename of filenames) {
      const ext = filename.split('.').pop()
      if (!SUPPORTED_FILETYPES.includes(ext)) continue
      const _id = filename.split('.')[0]
      const file = {
        _id,
      }
      const fileContent = await fs.readFile(`${rootDir}/${collectionName}/${filename}`, 'utf8')
      if (ext === 'md') {
        const mdObject = md.mdParse(fileContent)
        Object.assign(file, mdObject)
      }
      if (ext === 'json') {
        Object.assign(file, JSON.parse(fileContent))
      }
      if (!file.href) file.href = `/${collectionName}/${_id}`
      state[collectionName].push(file)
    }
  }
  return state
}


function applySettings(settings, state) {
  for (const collectionName of Object.keys(state)) {
    if (settings[collectionName]) applyCollectionSettings(state[collectionName], settings[collectionName])
  }
}


function applyCollectionSettings(collection, collectionSettings) {
  const { sort } = collectionSettings
  if (sort) {
    const sortByArr = Array.isArray(sort) ? sort : [sort]
    for (const sortBy of sortByArr.reverse()) {
      const isPropertyName = !sortBy.includes('{') && !sortBy.includes('=') // sniff function syntax
      if (isPropertyName) {
        collection = collection.sort((a, b) => a[sortBy] < b[sortBy] ? -1 : 1)
      } else {
        const fn = Function('return ' + sortBy)()
        try {
          collection = collection.sort(fn)
        } catch (error) {
          console.error(`Error while sorting '${collectionName}' collection: "${error.message}". Check collection settings.`)
        }
      }
    }
  }
}


function updateReferences(state) {
  for (const collectionName of Object.keys(state)) {
    for (const item of state[collectionName]) {
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
