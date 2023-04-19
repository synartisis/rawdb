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


/** @param {string} ext */
export function isSupportedExtention(ext) {
  return SUPPORTED_FILETYPES.includes(ext)
}