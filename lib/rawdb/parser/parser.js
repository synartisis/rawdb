/** @typedef {import('../../types.js').CollectionItem} CollectionItem */
/** @typedef {import('../../types.js').ItemType} ItemType */

/**
 * @typedef ParseResult
 * @prop {string} body
 * @prop {string} bodySource
 * @prop {string[]} bodyProps   // names of properties parsed in body
 * 
 */

const SUPPORTED_FILETYPES = ['md', 'json']

import * as md from './md/md.js'
import * as json from './json/json.js'


/** @type {(ext: ItemType, content: string) => ParseResult} */
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


/** @type {(ext: string, object: CollectionItem) => string} */
export function serialize(ext, item) {
  if (typeof ext !== 'string' || !item) throw new TypeError('bad arguments')
  if (ext === 'md') {
    return md.serialize(item)
  }
  if (ext === 'json') {
    return json.serialize(item)
  }
  throw new Error(`rawdb.parser.serialize: unsupported extention "${ext}"`)
}


/** @type {(ext: string) => ext is ItemType} */
export function isSupportedExtention(ext) {
  return SUPPORTED_FILETYPES.includes(ext)
}