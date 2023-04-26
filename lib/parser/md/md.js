import { marked } from 'marked'
import { frontMatter } from './front-matter.js'
import * as html from 'syn-html-parser'


/** @param {string} content */
export function mdParse(content) {
  const fm = frontMatter(content)
  const body = marked.parse(fm.content)
  const source = fm.content
  const mdBodyAttribs = parseMarkdownBodyAttributes(body) 
  return { ...fm.data, ...mdBodyAttribs, body, source }
}


/** @type {(object: any) => string} */
export function serialize(object) {
  if (!object) throw new TypeError('bad arguments')
  const mdBodyAttribs = parseMarkdownBodyAttributes(object.source) 
  let content = '---\n'
  for (const [key, value] of Object.entries(object)) {
    if (key.startsWith('_')) continue
    if (key === 'body' || key === 'source') continue
    if (key in mdBodyAttribs) continue
    if (value == null) { content += `${key}: \n`; continue }
    if (value instanceof Date) { content += `${key}: ${value}\n`; continue }
    // if (value instanceof Date) { content += `${key}: \n`; continue }
    if (typeof value === 'object') {
      content += `${key}:\n`
      for (const [vk, vv] of Object.entries(value)) {
        content += `  ${vk}: ${vv}\n`
      }
      continue
    }
    content += `${key}: ${value}\n`
  }
  content += '---\n'
  if (object.source) content += object.source
  return content
}


/** @param {string} body */
function parseMarkdownBodyAttributes(body) {
  if (!body) return {}
  const mdAttrs = Object.create(null)
  const doc = html.parseFragment(body)
  const elementsWithId = html.qsa(doc, el => !!html.getAttribute(el, 'data-id'))
  for (const el of elementsWithId) {
    const attr = html.getAttribute(el, 'data-id')
    if (!attr) continue
    const lang = html.getAttribute(el, 'lang')
    const value = html.serialize(el)
    if (!lang) {
      mdAttrs[attr] = value?.trim()
    } else {
      if (mdAttrs[attr] == null || Object.getPrototypeOf(mdAttrs[attr]) === Object.getPrototypeOf({})) {
        mdAttrs[attr] = { ...mdAttrs[attr], [lang]: value?.trim() }
      } else {
        mdAttrs[attr] = value?.trim()
      }
    }
  }
  return mdAttrs
}
