import * as fs from 'node:fs/promises'
import * as path from 'node:path'

const SECRETS_PATH = '.rawdb/secrets/'


/** @type {string} */
let rootDirectory


/** @param {string} rootDir */
export async function init(rootDir) {
  if (typeof rootDir !== 'string') throw new Error(`rawdb.secrets: "rootDir" is required`)
  rootDirectory = path.normalize(rootDir)
}


/** @type {(key: string, value: string) => Promise<void>} */
export async function setSecret(key, value) {
  if (typeof key !== 'string' || typeof value !== 'string') throw TypeError('wrong arguments')
  await ensureSecretsPathExist()
  const filename = path.join(rootDirectory, SECRETS_PATH, key)
  await fs.writeFile(filename, value, 'utf-8')
}


/** @type {(key: string) => Promise<string | undefined>} */
export async function getSecret(key) {
  if (typeof key !== 'string') throw TypeError('wrong arguments')
  const filename = path.join(rootDirectory, SECRETS_PATH, key)
  let value
  try {
    value = await fs.readFile(filename, 'utf-8')
  } catch (error) {}
  return value
}


async function ensureSecretsPathExist() {
  try {
    await fs.stat(path.join(rootDirectory, SECRETS_PATH))
    return
  } catch (error) {
    await fs.mkdir(path.join(rootDirectory, SECRETS_PATH))
  }
}