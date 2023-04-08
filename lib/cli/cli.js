#! /usr/bin/env node

/**
 * @typedef PathWithOrigin
 * @prop {string | undefined} origin
 * @prop {string} dirpath
 * @prop {string} fullpath
 */


import { parseArgs } from 'node:util'
import { execSync } from "node:child_process"
import * as os from 'node:os'
import * as fs from 'node:fs/promises'

const __dirname = new URL('.', import.meta.url).pathname
const { values, positionals } =  parseArgs({ options: {}, allowPositionals: true })
const [ command, localPath, remotePath, ...restArgs ] = positionals

if ((command !== 'fetch' && command !== 'push' && command !== 'init') || 
    !localPath || !remotePath || restArgs.length > 0) {
  onError('usage: rawdb [command] [localPath] [remotePath]\n  commands: fetch, push, init', 1)
}

const local = parsePath(localPath)
const remote = parsePath(remotePath)

const localSettings = await loadLocalSettings()

if (command === 'init') await init()
if (command === 'fetch') await fetch()
if (command === 'push') await push()


async function init() {
  checkPaths(local, remote, true)
  console.log(`initializing rawdb on ${remotePath}...`)
  exec(`mkdir -p ${remote.dirpath}/.rawdb/deleted/`, remote.origin)
  exec(`rsync ${__dirname}/mark-deletions.sh ${remote.fullpath}/.rawdb/bin/`)
  console.log(`rawdb initialized succesfully to ${remotePath}`)
}


async function fetch() {
  checkPaths(local, remote)
  console.log(`fetching from ${remotePath}`)
  markDeletionsOnRemote()
  const rsyncRemoteToLocal = exec(
    `rsync -azu --out-format="%n" --exclude ".rawdb/" '${remotePath}/' '${localPath}/'`, 
    undefined, `error fetching from ${remotePath}`)
  const changedFilesOnRemote = rsyncOut(rsyncRemoteToLocal.stdout, ' - ')
  if (changedFilesOnRemote) console.log(changedFilesOnRemote)
  const deletedFilesOnRemote = applyDeletionsFromRemote()
  if (!changedFilesOnRemote && !deletedFilesOnRemote) {
    console.log('nothing to fetch')
  }
  localSettings.lastSync = getServerTime()
  await saveLocalSettings()
  console.log(`rawdb fetch succesfully from ${remotePath}`)
}


async function push() {
  checkPaths(local, remote)
  console.log(`pushing to ${remotePath}`)
  markDeletionsOnRemote()
  const changedFilesOnRemote = checkForChangesOnRemote()
  if (changedFilesOnRemote.changed || changedFilesOnRemote.deleted) {
    let message = `cannot push: there are changed files on remote. please fetch again.`
    if (changedFilesOnRemote.changed) message += '\n  changed files:\n' + changedFilesOnRemote.changed
    if (changedFilesOnRemote.deleted) message += '\n  deleted files:\n' + changedFilesOnRemote.deleted
    onError(message, 1)
  }
  const rsyncLocalToRemote = exec(
    `rsync -azu --out-format="%n" --exclude ".rawdb/" --delete '${localPath}/' '${remotePath}/'`,
    undefined, `error pushing to ${remotePath}`)
  const changedFilesOnLocal = rsyncOut(rsyncLocalToRemote.stdout, ' - ')
  if (changedFilesOnLocal) {
    console.log(changedFilesOnLocal)
  } else {
    console.log('nothing to push')
  }
  localSettings.lastSync = getServerTime()
  await saveLocalSettings()
  console.log(`rawdb push succesfully to ${remotePath}`)
}



/** @type {(local: PathWithOrigin, remote: PathWithOrigin, initializing?: boolean) => any} */
function checkPaths(local, remote, initializing = false) {
  exec(`exit`, local.origin, `cannot connect to ${local.origin} referenced by [localPath]`)
  exec(`exit`, remote.origin, `cannot connect to ${remote.origin} referenced by [remotePath]`)
  exec(`ls ${local.dirpath}`, local.origin, `"${local.dirpath}" does not exist - referenced by [localPath]`)
  if (!initializing) {
    exec(`ls ${remote.dirpath}`, remote.origin, `"${remote.dirpath}" does not exist - referenced by [remotePath]`)
    exec(`ls ${remote.dirpath}/.rawdb/`, remote.origin, `rawdb is not initialized on "${remote.fullpath}" - run init command first`)
  }
}


function getServerTime() {
  const { stdout: serverUTCTime } = exec(`date -Iseconds`, remote.origin, `cannot read server time.`)
  return serverUTCTime
}


function markDeletionsOnRemote() {
  exec(`(cd "${remote.dirpath}"; sh .rawdb/bin/mark-deletions.sh)`, remote.origin, 'cannot mark deletions on remote')
}


function applyDeletionsFromRemote() {
  const { stdout: deletedFiles } = exec(
    `(cd ${remote.dirpath}/.rawdb/deleted/; find . -type f -newermt "${localSettings.lastSync}")`,
    remote.origin, `cannot find deleted file on remote`)
  for (const toDelete of deletedFiles.trim().split('\n').filter(Boolean)) {
    console.log(`deleting ${localPath}/${toDelete}`)
    exec(`rm "${localPath}/${toDelete}"`)
  }
  return deletedFiles.trim()
}


function checkForChangesOnRemote() {
  const { stdout: deleted } = exec(
    `(cd ${remote.dirpath}/.rawdb/deleted/; find . -type f -newermt "${localSettings.lastSync}")`,
    remote.origin, `cannot find deleted files on remote`)
  const { stdout: changed } = exec(
    `(cd ${remote.dirpath}; find . -type f -not -path "./.rawdb/*" -newermt "${localSettings.lastSync}")`,
    remote.origin, `cannot find changed files on remote`)
  return { changed, deleted }
}


/** @returns {Promise<{ machineId: string, lastSync: string }>} */
async function loadLocalSettings() {
  let json
  try {
    const content = await fs.readFile(`${localPath}/.rawdb/rawdb-state.json`, 'utf-8')
    json = JSON.parse(content)
  } catch (error) {}
  if (!json || json.machineId !== os.hostname()) json = { machineId: os.hostname(), lastSync: '' }
  return json
}


async function saveLocalSettings() {
  try {
    await fs.mkdir(`${localPath}/.rawdb/`)
  } catch (/**@type {any} */error) {
    if (error.code !== 'EEXIST') throw error
  }
  await fs.writeFile(`${localPath}/.rawdb/rawdb-state.json`, JSON.stringify(localSettings))
}



/** @type {(fullpath: string) => PathWithOrigin} */
function parsePath(fullpath) {
  const [p1, p2] = fullpath?.split(':')
  let origin
  let dirpath
  if (!p2) {
    dirpath = p1
  } else {
    origin = p1
    dirpath = p2
  }
  return { origin, dirpath, fullpath }
}


/** @type {(command: string, origin?: string, throwMessage?: string) => { stdout: string, stderr?: string, status: number }} */
function exec(command, origin, throwMessage) {
  const finalCommand =  origin
    ? `ssh ${origin} '${command}'`
    : `${command}`
  try {
    const stdout = execSync(finalCommand, { stdio: 'pipe' }).toString().trim()
    return { stdout, status: 0 }
  } catch (/** @type {any} */error) {
    if (throwMessage) onError(`${throwMessage}\n${error}`, error.status)
    return { stdout: error.stdout.toString(), stderr: error.stderr.toString(), status: error.status}
  }
}


/** @type {(message: string, status: number) => void} */
function onError(message, status) {
  console.error(message)
  process.exit(status)
}


/** @type {(out: string?, linePrefix?: string) => string} */
function rsyncOut(out, linePrefix = '') {
  if (!out || out === './') return ''
  return out.split('\n').filter(o => !!o && o !== './').map(o => linePrefix + o).join('\n')
}
