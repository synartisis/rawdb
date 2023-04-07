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

const RAWDB_LOCAL_SETTINGS_FILE = '.rawdb'
const RAWDB_REMOTE_LOG_FILE = '.rawdb.log'

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
  exec(`mkdir ${remote.dirpath}`, remote.origin)
  console.log(`rawdb initialized succesfully to ${remotePath}`)
}


async function fetch() {
  checkPaths(local, remote)
  console.log(`fetching from ${remotePath}`)
  localSettings.lastSync = getServerTime()
  const rsyncRemoteToLocal = exec(`rsync -azu --out-format="%n" '${remotePath}/' '${localPath}/'`)
  if (rsyncRemoteToLocal.status === 0) {
    if (rsyncRemoteToLocal.stdout) {
      console.log(rsyncOut(rsyncRemoteToLocal.stdout, ' - '))
    } else {
      console.log('nothing to fetch')
    }
    applyDeletionsFromRemote()
    await saveLocalSettings()
  } else {
    onError(`error fetching from ${remotePath}`, rsyncRemoteToLocal.status)
  }
  console.log(`rawdb fetch succesfully from ${remotePath}`)
}


async function push() {
  checkPaths(local, remote)
  console.log(`pushing to ${remotePath}`)
  const newerFilesOnRemote = checkForNewerFilesOnRemote()
  if (newerFilesOnRemote) onError(`cannot push: there are newer files on remote. please fetch again.\nnewer files found:\n${newerFilesOnRemote}`, 1)
  const rsyncLocalToRemote = exec(`rsync -azu --out-format="%n" --exclude ".rawdb" '${localPath}/' '${remotePath}/'`)
  if (rsyncLocalToRemote.status === 0) {
    if (rsyncLocalToRemote.stdout) {
      console.log(rsyncOut(rsyncLocalToRemote.stdout, ' - '))
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
    const cmdDirRemote = exec(`ls ${remote.dirpath}`, remote.origin)
    if (cmdDirRemote.status !== 0) onError(`"${remote.dirpath}" does not exist - referenced by [remotePath]`, cmdDirRemote.status)
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
  if (!out) return ''
  return out.split('\n').filter(o => !!o && o !== './').map(o => linePrefix + o).join('\n')
}


function getServerTime() {
  const serverUTCTime = exec(`date -Iseconds`, remote.origin)
  if (serverUTCTime.status !== 0) onError(`rawdb error: cannot read server time.\n${serverUTCTime.stderr}`, serverUTCTime.status)
  return serverUTCTime.stdout
}


function applyDeletionsFromRemote() {
  // read deletions from remote and apply them
  // remove old deletion entries from remote
  // local deletions ?
  console.warn('** server deletions not implemented')
}


function checkForNewerFilesOnRemote() {
  const newerFiles = exec(`(cd ${remote.dirpath}; find . -type f -newermt "${localSettings.lastSync}")`, remote.origin)
  if (newerFiles.status !== 0) onError(`rawdb error: cannot list newer files from remote`, newerFiles.status)
  return newerFiles.stdout
}


/** @returns {Promise<{ machineId: string, lastSync: string }>} */
async function loadLocalSettings() {
  let json
  try {
    const content = await fs.readFile(`${localPath}/${RAWDB_LOCAL_SETTINGS_FILE}`, 'utf-8')
    json = JSON.parse(content)
  } catch (error) {}
  if (!json || json.machineId !== os.hostname()) json = { machineId: os.hostname(), lastSync: '' }
  return json
}


async function saveLocalSettings() {
  await fs.writeFile(`${localPath}/${RAWDB_LOCAL_SETTINGS_FILE}`, JSON.stringify(localSettings))
}