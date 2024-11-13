import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import * as settings from '../store/settings.js'

const SECRETS_PATH = '.rawdb/secrets/'


/** @type {(key: string, value: string) => Promise<void>} */
export async function setSecret(key, value) {
  if (typeof key !== 'string' || typeof value !== 'string') throw TypeError('wrong arguments')
  await ensureSecretsPathExist()
  const filename = path.join(settings.getRootDirectory(), SECRETS_PATH, key)
  await fs.writeFile(filename, value, 'utf-8')
}


/** @type {(key: string) => Promise<string | undefined>} */
export async function getSecret(key) {
  if (typeof key !== 'string') throw TypeError('wrong arguments')
  const filename = path.join(settings.getRootDirectory(), SECRETS_PATH, key)
  let value
  try {
    value = await fs.readFile(filename, 'utf-8')
  } catch (error) {}
  return value
}


async function ensureSecretsPathExist() {
  try {
    await fs.stat(path.join(settings.getRootDirectory(), SECRETS_PATH))
    return
  } catch (error) {
    await fs.mkdir(path.join(settings.getRootDirectory(), SECRETS_PATH))
  }
}