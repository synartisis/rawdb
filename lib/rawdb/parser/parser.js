const SUPPORTED_FILETYPES = ['md', 'json']

import * as md from './md/md.js'
import * as json from './json/json.js'


/** @type {(ext: string, content: string) => rawdb.ParseResult} */
export function parse(ext, content) {
  if (typeof ext !== 'string' || typeof content !== 'string') throw new TypeError('bad arguments')
  if (ext === 'md') {
    return md.parse(content)
  }
  if (ext === 'json') {
    return json.parse(content)
  }
  throw new Error(`rawdb.parser.parse: unsupported extention "${ext}"`)
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


/** @type {(ext: string) => ext is rawdb.ItemType} */
export function isSupportedExtention(ext) {
  return SUPPORTED_FILETYPES.includes(ext)
}