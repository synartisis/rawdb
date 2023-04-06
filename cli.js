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
  console.log('usage: rawdb [command] [localPath] [remotePath]\n  commands: fetch, push, init')
  process.exit(1)
}

const local = parsePath(localPath)
const remote = parsePath(remotePath)

if (command === 'init') await init()
if (command === 'fetch') await fetch()
if (command === 'push') await push()


async function fetch() {
  checkPaths(local, remote)
  console.log(`fetching from ${remotePath}...`)
  throw new Error('not implemented')
  // const cmdListRemote = exec(`(cd ${remote.dirpath}; find . -type f)`, remote.origin)
  // if (cmdListRemote.status === 0) {
  //   const listRemote = cmdListRemote.stdout
  //   console.log(listRemote)
  // } else {
  //   console.error(`error listing ${remotePath}`)
  //   console.error(cmdListRemote.stderr)
  // }
  console.log(`rawdb fetch succesfully from ${remotePath}`)
}


async function push() {
  checkPaths(local, remote)
  console.log(`pushing to ${remotePath}...`)
  throw new Error('not implemented')
  console.log(`rawdb push succesfully to ${remotePath}`)
}


async function init() {
  checkPaths(local, remote, true)
  console.log(`initializing rawdb on ${remotePath}...`)
  exec(`mkdir ${remote.dirpath}`, remote.origin)
  const cmdInitRawdb = exec(`(cd ${remote.dirpath}; [[ -f '${RAWDB_REMOTE_CONFIG_FILE}' ]] || echo '{}' > ${RAWDB_REMOTE_CONFIG_FILE}; mkdir ${RAWDB_REMOTE_PROD_DIR} ${RAWDB_REMOTE_STAGING_DIR})`, remote.origin)
  if (cmdInitRawdb.status !== 0) { console.error(`cannot initialize rawdb to ${remotePath}`, cmdInitRawdb.stderr); process.exit(cmdInitRawdb.status) }
  console.log(`rawdb initialized succesfully to ${remotePath}`)
}



/** @type {(localPath: PathWithOrigin, remotePath: PathWithOrigin, initializing?: boolean) => any} */
function checkPaths(localPath, remotePath, initializing = false) {
  const cmdSshLocal = exec(`exit`, localPath.origin)
  if (cmdSshLocal.status !== 0) { console.error(`cannot connect to ${localPath.origin} referenced by [localPath]`); process.exit(cmdSshLocal.status) }
  const cmdSshRemote = exec(`exit`, remotePath.origin)
  if (cmdSshRemote.status !== 0) { console.error(`cannot connect to ${remotePath.origin} referenced by [remotePath]`); process.exit(cmdSshRemote.status) }
  const cmdDirLocal = exec(`ls ${localPath.dirpath}`, localPath.origin)
  if (cmdDirLocal.status !== 0) { console.error(`"${localPath.dirpath}" does not exist - referenced by [localPath]`); process.exit(cmdDirLocal.status) }
  if (!initializing) {
    const cmdDirRemote = exec(`ls ${remotePath.dirpath}`, remotePath.origin)
    if (cmdDirRemote.status !== 0) { console.error(`"${remotePath.dirpath}" does not exist - referenced by [remotePath]`); process.exit(cmdDirRemote.status) }
    const cmdRemoteRawdb = exec(`ls ${remotePath.dirpath}/${RAWDB_REMOTE_CONFIG_FILE} ${remotePath.dirpath}/${RAWDB_REMOTE_PROD_DIR} ${remotePath.dirpath}/${RAWDB_REMOTE_STAGING_DIR}`, remotePath.origin)
    if (cmdRemoteRawdb.status !== 0) { console.error(`error: rawdb is not initialized on remote.`); process.exit(cmdRemoteRawdb.status) }
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