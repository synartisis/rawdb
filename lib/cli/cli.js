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

if ((command !== 'fetch' && command !== 'push' && command !== 'init') || !localPath || !remotePath || restArgs.length > 0) {
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
  const rsyncRemoteToLocal = exec(`rsync -azu --out-format="%n" --exclude ".rawdb/" '${remotePath}/' '${localPath}/'`)
  if (rsyncRemoteToLocal.status === 0) {
    const changedFilesOnRemote = rsyncOut(rsyncRemoteToLocal.stdout, ' - ')
    if (changedFilesOnRemote) console.log(changedFilesOnRemote)
    markDeletionsOnRemote()
    const deletedFilesOnRemote = applyDeletionsFromRemote()
    if (!changedFilesOnRemote && !deletedFilesOnRemote) {
      console.log('nothing to fetch')
    }
    localSettings.lastSync = getServerTime()
    await saveLocalSettings()
  } else {
    onError(`error fetching from ${remotePath}`, rsyncRemoteToLocal.status)
  }
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
  const rsyncLocalToRemote = exec(`rsync -azu --out-format="%n" --exclude ".rawdb/" --delete '${localPath}/' '${remotePath}/'`)
  if (rsyncLocalToRemote.status === 0) {
    const changedFilesOnLocal = rsyncOut(rsyncLocalToRemote.stdout, ' - ')
    if (changedFilesOnLocal) {
      console.log(changedFilesOnLocal)
    } else {
      console.log('nothing to push')
    }
    localSettings.lastSync = getServerTime()
    await saveLocalSettings()
  } else {
    onError(`error pushing to ${remotePath}\n${rsyncLocalToRemote.stderr}`, rsyncLocalToRemote.status)
  }  
  console.log(`rawdb push succesfully to ${remotePath}`)
}



/** @type {(local: PathWithOrigin, remote: PathWithOrigin, initializing?: boolean) => any} */
function checkPaths(local, remote, initializing = false) {
  const cmdSshLocal = exec(`exit`, local.origin)
  if (cmdSshLocal.status !== 0) onError(`cannot connect to ${local.origin} referenced by [localPath]`, cmdSshLocal.status)
  const cmdSshRemote = exec(`exit`, remote.origin)
  if (cmdSshRemote.status !== 0) onError(`cannot connect to ${remote.origin} referenced by [remotePath]`, cmdSshRemote.status)
  const cmdDirLocal = exec(`ls ${local.dirpath}`, local.origin)
  if (cmdDirLocal.status !== 0) onError(`"${local.dirpath}" does not exist - referenced by [localPath]`, cmdDirLocal.status)
  if (!initializing) {
    const cmdDirRemotePath = exec(`ls ${remote.dirpath}`, remote.origin)
    if (cmdDirRemotePath.status !== 0) onError(`"${remote.dirpath}" does not exist - referenced by [remotePath]`, cmdDirRemotePath.status)
    const cmdDirRemoteRawDb = exec(`ls ${remote.dirpath}/.rawdb/`, remote.origin)
    if (cmdDirRemoteRawDb.status !== 0) onError(`rawdb is not initialized on "${remote.fullpath}" - run init command first`, cmdDirRemoteRawDb.status)
  }
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


/** @type {(command: string, origin?: string) => { stdout: string, stderr?: string, status: number }} */
function exec(command, origin) {
  const finalCommand =  origin
    ? `ssh ${origin} '${command}'`
    : `${command}`
  try {
    const stdout = execSync(finalCommand, { stdio: 'pipe' }).toString().trim()
    return { stdout, status: 0 }
  } catch (/** @type {any} */error) {
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


function getServerTime() {
  const serverUTCTime = exec(`date -Iseconds`, remote.origin)
  if (serverUTCTime.status !== 0) onError(`rawdb error: cannot read server time.\n${serverUTCTime.stderr}`, serverUTCTime.status)
  return serverUTCTime.stdout
}


function markDeletionsOnRemote() {
  const cmdMarkDeletionsOnRemote = exec(`(cd "${remote.dirpath}"; sh .rawdb/bin/mark-deletions.sh)`, remote.origin)
  if (cmdMarkDeletionsOnRemote.status !== 0) onError(`rawdb error: cannot markDeletionsOnRemote \n${cmdMarkDeletionsOnRemote.stderr}`, cmdMarkDeletionsOnRemote.status)
  return cmdMarkDeletionsOnRemote.stdout
}


function applyDeletionsFromRemote() {
  const deletedFiles = exec(`(cd ${remote.dirpath}/.rawdb/deleted/; find . -type f -newermt "${localSettings.lastSync}")`, remote.origin)
  if (deletedFiles.status !== 0) onError(`rawdb error: cannot find deleted file on remote`, deletedFiles.status)
  for (const toDelete of deletedFiles.stdout.trim().split('\n').filter(Boolean)) {
    console.log(`deleting ${localPath}/${toDelete}`)
    exec(`rm "${localPath}/${toDelete}"`)
  }
  return deletedFiles.stdout.trim()
}


function checkForChangesOnRemote() {
  const deletedFiles = exec(`(cd ${remote.dirpath}/.rawdb/deleted/; find . -type f -newermt "${localSettings.lastSync}")`, remote.origin)
  if (deletedFiles.status !== 0) onError(`rawdb error: cannot find deleted file on remote`, deletedFiles.status)
  const createdOrUpdatedFiles = exec(`(cd ${remote.dirpath}; find . -type f -not -path "./.rawdb/*" -newermt "${localSettings.lastSync}")`, remote.origin)
  if (createdOrUpdatedFiles.status !== 0) onError(`rawdb error: cannot find changed files on remote`, createdOrUpdatedFiles.status)
  return { changed: createdOrUpdatedFiles.stdout, deleted: deletedFiles.stdout }
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