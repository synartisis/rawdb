#! /usr/bin/env node

/**
 * @typedef PathWithOrigin
 * @prop {string | undefined} origin
 * @prop {string} dirpath
 */


import { parseArgs } from 'node:util'
import { execSync } from "child_process"

const RAWDB_REMOTE_CONFIG_FILE = 'rawdb.json'
const RAWDB_REMOTE_PROD_DIR = 'production'
const RAWDB_REMOTE_STAGING_DIR = 'staging'


const { values, positionals } =  parseArgs({ options: {}, allowPositionals: true })
const [ command, localPath, remotePath, ...restArgs ] = positionals

if ((command !== 'fetch' && command !== 'push' && command !== 'init') || !localPath || !remotePath || restArgs.length > 0) {
  onError('usage: rawdb [command] [localPath] [remotePath]\n  commands: fetch, push, init', 1)
}

const local = parsePath(localPath)
const remote = parsePath(remotePath)

if (command === 'init') await init()
if (command === 'fetch') await fetch()
if (command === 'push') await push()


async function init() {
  checkPaths(local, remote, true)
  console.log(`initializing rawdb on ${remotePath}...`)
  exec(`mkdir ${remote.dirpath}`, remote.origin)
  const cmdInitRawdb = exec(`(cd ${remote.dirpath}; [[ -f '${RAWDB_REMOTE_CONFIG_FILE}' ]] || echo '{}' > ${RAWDB_REMOTE_CONFIG_FILE}; mkdir ${RAWDB_REMOTE_PROD_DIR} ${RAWDB_REMOTE_STAGING_DIR})`, remote.origin)
  if (cmdInitRawdb.status !== 0) onError(`cannot initialize rawdb to ${remotePath}\n${cmdInitRawdb.stderr}`, cmdInitRawdb.status)
  console.log(`rawdb initialized succesfully to ${remotePath}`)
}


async function fetch() {
  checkPaths(local, remote)
  console.log(`fetching from ${remotePath}/${RAWDB_REMOTE_STAGING_DIR}`)
  const cmdRSyncRemoteStagingToLocal = exec(`rsync -azu --out-format="%n" '${remotePath}/${RAWDB_REMOTE_STAGING_DIR}/' '${localPath}'`)
  if (cmdRSyncRemoteStagingToLocal.status === 0) {
    const rSyncRemoteStagingToLocal = cmdRSyncRemoteStagingToLocal.stdout
    console.log(rSyncRemoteStagingToLocal?.trim() || 'nothing to fetch')
  } else {
    onError(`error fetching ${remotePath}/${RAWDB_REMOTE_STAGING_DIR}`, cmdRSyncRemoteStagingToLocal.status)
  }
  console.log(`rawdb fetch succesfully from ${remotePath}`)
}


async function push() {
  checkPaths(local, remote)
  console.log(`pushing to ${remotePath}/${RAWDB_REMOTE_PROD_DIR}`)
  const cmdRSyncLocalToRemoteProduction = exec(`rsync -azu --out-format="%n" '${localPath}/' '${remotePath}/${RAWDB_REMOTE_PROD_DIR}/'`)
  if (cmdRSyncLocalToRemoteProduction.status === 0) {
    const rSyncLocalToRemoteProduction = cmdRSyncLocalToRemoteProduction.stdout
    console.log(rSyncLocalToRemoteProduction?.trim() || 'nothing to push')
    deleteDublicatesFromStaging()
  } else {
    onError(`error fetching from ${remotePath}/${RAWDB_REMOTE_PROD_DIR}`, cmdRSyncLocalToRemoteProduction.status)
  }  
  console.log(`rawdb push succesfully to ${remotePath}`)
}



/** @type {(localPath: PathWithOrigin, remotePath: PathWithOrigin, initializing?: boolean) => any} */
function checkPaths(localPath, remotePath, initializing = false) {
  const cmdSshLocal = exec(`exit`, localPath.origin)
  if (cmdSshLocal.status !== 0) onError(`cannot connect to ${localPath.origin} referenced by [localPath]`, cmdSshLocal.status)
  const cmdSshRemote = exec(`exit`, remotePath.origin)
  if (cmdSshRemote.status !== 0) onError(`cannot connect to ${remotePath.origin} referenced by [remotePath]`, cmdSshRemote.status)
  const cmdDirLocal = exec(`ls ${localPath.dirpath}`, localPath.origin)
  if (cmdDirLocal.status !== 0) onError(`"${localPath.dirpath}" does not exist - referenced by [localPath]`, cmdDirLocal.status)
  if (!initializing) {
    const cmdDirRemote = exec(`ls ${remotePath.dirpath}`, remotePath.origin)
    if (cmdDirRemote.status !== 0) onError(`"${remotePath.dirpath}" does not exist - referenced by [remotePath]`, cmdDirRemote.status)
    const cmdRemoteRawdb = exec(`ls ${remotePath.dirpath}/${RAWDB_REMOTE_CONFIG_FILE} ${remotePath.dirpath}/${RAWDB_REMOTE_PROD_DIR} ${remotePath.dirpath}/${RAWDB_REMOTE_STAGING_DIR}`, remotePath.origin)
    if (cmdRemoteRawdb.status !== 0) onError(`error: rawdb is not initialized on remote.`, cmdRemoteRawdb.status)
  }
}


function deleteDublicatesFromStaging() {
  // TODO: must check modified date. newer files on staging must not be deleted
  // find staging/ -type f -newermt "2023-04-06T12:50:00";
  // date -Iseconds
  // rsync --files-from=

  return console.log(`*** WARNING: delete dublicate files is not ready yet!!!!`)

  console.log('deleting dublicate files from staging')
  const cmdDeleteDublicatesFromStaging = exec(`rsync -azu --out-format="%n" --existing --ignore-non-existing --delete '${remote.dirpath}/${RAWDB_REMOTE_PROD_DIR}/' '${remote.dirpath}/${RAWDB_REMOTE_STAGING_DIR}/'`, remote.origin)
  if (cmdDeleteDublicatesFromStaging.status === 0) {
    const out = cmdDeleteDublicatesFromStaging.stdout?.trim()?.split('\n').filter(o => o !== './').join('\n')
    console.log(out || 'no dublicate files')
  } else {
    onError(`error while deleting dublicate files from staging\n${cmdDeleteDublicatesFromStaging.stderr}`, cmdDeleteDublicatesFromStaging.status)
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
  return { origin, dirpath }
}


/** @type {(command: string, origin?: string) => { stdout: string, stderr?: string, status: number }} */
function exec(command, origin) {
  const finalCommand =  origin
    ? `ssh ${origin} '${command}'`
    : `${command}`
  try {
    const stdout = execSync(finalCommand, { stdio: 'pipe' }).toString()
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