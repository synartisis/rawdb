import { marked } from 'marked'
import { frontMatter } from './front-matter.js'
import * as html from 'syn-html-parser'


/** @param {string} content */
export function mdParse(content) {
  const fm = frontMatter(content)
  const body = marked.parse(fm.content)
  const mdBodyAttribs = parseMarkdownBodyAttributes(body) 
  return { ...fm.data, ...mdBodyAttribs, body }
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
