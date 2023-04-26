const SUPPORTED_FILETYPES = ['md', 'json']

import * as md from './md/md.js'


/** @type {(ext: string, content: string) => unknown} */
export function parse(ext, content) {
  if (ext === 'md') {
    return md.mdParse(content)
  }
  if (ext === 'json') {
    return JSON.parse(content)
  }
}


/** @type {(ext: string, object: any) => string} */
export function serialize(ext, object) {
  if (typeof ext !== 'string' || !object) throw new TypeError('bad arguments')
  if (ext === 'md') {
    return md.serialize(object)
  }
  if (ext === 'json') {
    return JSON.stringify(object)
  }
  throw new Error(`rawdb.parser.serialize: unsupported extention "${ext}"`)
}


/** @param {string} ext */
export function isSupportedExtention(ext) {
  return SUPPORTED_FILETYPES.includes(ext)
}